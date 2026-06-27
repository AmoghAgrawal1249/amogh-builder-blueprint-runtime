import type {
	ContextSource,
	EvidenceBundle,
	EvidenceEntityRef,
	EvidenceOwner,
	ContextNeedKind,
	SourceClaim,
	SourceClaimKind,
	SourceClaimSupport,
	SourceSensitivityLevel
} from '$domain/source-ranking';
import { buildContextSourceFromExtractedEvidence } from '$lib/features/source-ranking/evidence-extraction';
import type { ExtractedEvidence } from '$lib/features/source-ranking/evidence-extraction';

export type UploadedEvidenceFile = {
	id: string;
	name: string;
	text: string;
	lastModified: number;
	extractionKind: 'keyword' | 'ai';
	extractedEvidence?: ExtractedEvidence;
};

type ClaimRule = {
	kind: SourceClaimKind;
	keywords: readonly string[];
};

const UPLOADED_CLIENT: EvidenceEntityRef = {
	id: 'client-uploaded',
	name: 'Uploaded data'
};

const UPLOADED_OWNER: EvidenceOwner = {
	id: 'owner-local-upload',
	name: 'Local upload',
	role: 'Browser file upload'
};

const CLAIM_RULES: readonly ClaimRule[] = [
	{
		kind: 'implementationRisk',
		keywords: ['implementation', 'rollout', 'deployment', 'migration', 'go-live', 'readiness']
	},
	{
		kind: 'timelineContext',
		keywords: ['timeline', 'deadline', 'q1', 'q2', 'q3', 'q4', 'delay', 'schedule']
	},
	{
		kind: 'pricingContext',
		keywords: ['pricing', 'discount', 'budget', 'commercial', 'procurement', 'renewal price']
	},
	{
		kind: 'stakeholderContext',
		keywords: ['stakeholder', 'sponsor', 'vp', 'cfo', 'cio', 'committee', 'owner']
	},
	{
		kind: 'decisionFeedback',
		keywords: ['decision', 'approved', 'rejected', 'feedback', 'criteria', 'concern']
	},
	{
		kind: 'renewalRisk',
		keywords: ['renewal', 'churn', 'expansion', 'upsell', 'contract']
	},
	{
		kind: 'clientConcern',
		keywords: ['concern', 'risk', 'blocked', 'pushback', 'hesitation', 'problem']
	}
];

const HIGH_SENSITIVITY_KEYWORDS = ['confidential', 'partner', 'private', 'legal', 'restricted'];
const MEDIUM_SENSITIVITY_KEYWORDS = ['internal', 'pricing', 'discount', 'procurement', 'contract'];

export function buildUploadedEvidenceBundle(files: readonly UploadedEvidenceFile[]): EvidenceBundle {
	const sources = files.map(toUploadedContextSource);
	const requiredClaimKinds = getUploadedRequiredClaimKinds(sources);

	return {
		id: 'uploaded-evidence-bundle',
		title: 'Uploaded data sources',
		description: 'Browser-local evidence bundle built from uploaded source files.',
		contextNeed: {
			id: 'need-uploaded-context-review',
			kind: 'other',
			label: 'Uploaded context review',
			description: 'Evaluate whether the uploaded local files contain usable context for an automated handoff.',
			client: UPLOADED_CLIENT,
			requiredClaimKinds,
			sensitivity: getMaxSensitivity(sources.map((source) => source.sensitivity))
		},
		sources
	};
}

export function toUploadedEvidenceFile({
	name,
	text,
	lastModified,
	index
}: {
	name: string;
	text: string;
	lastModified: number;
	index: number;
}): UploadedEvidenceFile {
	return {
		id: `uploaded-${index + 1}-${slugify(name)}`,
		name,
		text,
		lastModified,
		extractionKind: 'keyword'
	};
}

export function withAiExtractedEvidence(
	file: UploadedEvidenceFile,
	extractedEvidence: ExtractedEvidence
): UploadedEvidenceFile {
	return {
		...file,
		extractionKind: 'ai',
		extractedEvidence
	};
}

function toUploadedContextSource(file: UploadedEvidenceFile): ContextSource {
	if (file.extractionKind === 'ai' && file.extractedEvidence) {
		return buildContextSourceFromExtractedEvidence({
			id: file.id,
			fileName: file.name,
			text: file.text,
			lastModified: file.lastModified,
			extracted: file.extractedEvidence
		});
	}

	const sensitivity = inferSensitivity(file.text);
	const claims = inferClaims(file);

	return {
		id: file.id,
		kind: inferSourceKind(file.name),
		title: file.name,
		summary: summarizeUploadedText(file.text),
		fullText: file.text,
		extractionKind: 'keyword',
		createdAt: file.lastModified,
		updatedAt: file.lastModified,
		client: UPLOADED_CLIENT,
		createdBy: UPLOADED_OWNER,
		ownerSignals: [
			{
				kind: 'sourceUploader',
				confidence: 0.45,
				reason: 'The source came from a local browser upload.',
				owner: UPLOADED_OWNER
			}
		],
		claims,
		sensitivity
	};
}

function inferClaims(file: UploadedEvidenceFile): SourceClaim[] {
	const normalizedText = file.text.toLowerCase();
	const claims = CLAIM_RULES.map((rule) => {
		const matchedKeywords = rule.keywords.filter((keyword) => normalizedText.includes(keyword));

		if (matchedKeywords.length === 0) {
			return null;
		}

		const support = getUploadedClaimSupport(matchedKeywords.length);

		return {
			id: `${file.id}-claim-${rule.kind}`,
			kind: rule.kind,
			text: `Uploaded source mentions ${matchedKeywords.slice(0, 4).join(', ')}.`,
			support,
			sensitivity: inferSensitivity(matchedKeywords.join(' '))
		} satisfies SourceClaim;
	}).filter((claim): claim is SourceClaim => claim !== null);

	if (claims.length > 0) {
		return claims;
	}

	return [
		{
			id: `${file.id}-claim-clientConcern`,
			kind: 'clientConcern',
			text: 'Uploaded source contains general context but no recognized source-ranking keywords.',
			support: 'weak',
			sensitivity: inferSensitivity(file.text)
		}
	];
}

function getUploadedRequiredClaimKinds(sources: readonly ContextSource[]) {
	const claimKinds = [
		...new Set(
			sources.flatMap((source) =>
				source.claims
					.filter((claim) => (claim.stance ?? 'supports') === 'supports')
					.map((claim) => claim.kind)
			)
		)
	];

	return claimKinds.length > 0 ? claimKinds : ['clientConcern' as const];
}

export function getUploadedSuggestedContextNeedKinds(
	files: readonly UploadedEvidenceFile[]
): ContextNeedKind[] {
	const kinds = files.flatMap((file) => file.extractedEvidence?.suggestedContextNeedKinds ?? []);

	return [...new Set(kinds.filter((kind): kind is ContextNeedKind => typeof kind === 'string'))];
}

function getUploadedClaimSupport(matchCount: number): SourceClaimSupport {
	if (matchCount >= 2) {
		return 'direct';
	}

	return 'inferred';
}

function inferSensitivity(text: string): SourceSensitivityLevel {
	const normalizedText = text.toLowerCase();

	if (HIGH_SENSITIVITY_KEYWORDS.some((keyword) => normalizedText.includes(keyword))) {
		return 'high';
	}

	if (MEDIUM_SENSITIVITY_KEYWORDS.some((keyword) => normalizedText.includes(keyword))) {
		return 'medium';
	}

	return 'low';
}

function inferSourceKind(fileName: string): ContextSource['kind'] {
	const normalizedFileName = fileName.toLowerCase();

	if (normalizedFileName.endsWith('.eml')) {
		return 'email';
	}

	if (normalizedFileName.includes('proposal')) {
		return 'proposal';
	}

	if (normalizedFileName.includes('deck')) {
		return 'deck';
	}

	return 'document';
}

function summarizeUploadedText(text: string) {
	const normalizedText = text.replace(/\s+/g, ' ').trim();

	if (!normalizedText) {
		return 'Uploaded file has no readable text.';
	}

	return normalizedText.length > 260 ? `${normalizedText.slice(0, 260).trim()}...` : normalizedText;
}

function getMaxSensitivity(values: readonly SourceSensitivityLevel[]): SourceSensitivityLevel {
	if (values.includes('high')) {
		return 'high';
	}

	if (values.includes('medium')) {
		return 'medium';
	}

	return 'low';
}

function slugify(value: string) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 48) || 'source';
}
