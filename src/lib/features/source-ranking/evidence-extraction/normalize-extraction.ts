import type {
	ContextNeedKind,
	ContextSource,
	EvidenceOwner,
	OwnerSignal,
	OwnerSignalKind,
	SourceClaim,
	SourceClaimKind,
	SourceClaimStance,
	SourceClaimSupport,
	SourceSensitivityLevel
} from '$domain/source-ranking';
import type {
	ExtractedEvidence,
	ExtractedEvidenceClaim,
	ExtractedEvidenceOwnerSignal,
	ExtractedEvidenceSourceInput
} from './types';

const SOURCE_CLAIM_KINDS = new Set<SourceClaimKind>([
	'clientConcern',
	'decisionFeedback',
	'implementationRisk',
	'renewalRisk',
	'pricingContext',
	'timelineContext',
	'stakeholderContext',
	'nextStep',
	'other'
]);

const CONTEXT_NEED_KINDS = new Set<ContextNeedKind>([
	'clientConcern',
	'pitchContext',
	'renewalRisk',
	'implementationRisk',
	'decisionCriteria',
	'stakeholderContext',
	'pricingContext',
	'timelineContext',
	'other'
]);

const OWNER_SIGNAL_KINDS = new Set<OwnerSignalKind>([
	'accountOwner',
	'opportunityOwner',
	'proposalOwner',
	'documentAuthor',
	'meetingAttendee',
	'sourceUploader',
	'unknown'
]);

const SOURCE_CLAIM_SUPPORTS = new Set<SourceClaimSupport>(['direct', 'inferred', 'weak']);
const SOURCE_CLAIM_STANCES = new Set<SourceClaimStance>(['supports', 'contradicts']);
const SOURCE_SENSITIVITY_LEVELS = new Set<SourceSensitivityLevel>(['low', 'medium', 'high']);

const AI_OWNER_FALLBACK: EvidenceOwner = {
	id: 'owner-ai-extracted-source',
	name: 'AI extracted source',
	role: 'Extracted owner signal'
};

export function normalizeExtractedEvidence(extracted: unknown): ExtractedEvidence {
	const record = isRecord(extracted) ? extracted : {};

	return {
		claims: normalizeExtractedClaims(record.claims),
		ownerSignals: normalizeExtractedOwnerSignals(record.ownerSignals),
		cautions: normalizeStringArray(record.cautions),
		missingContext: normalizeStringArray(record.missingContext),
		suggestedContextNeedKinds: normalizeSuggestedContextNeedKinds(record.suggestedContextNeedKinds)
	};
}

export function buildContextSourceFromExtractedEvidence({
	id,
	fileName,
	text,
	lastModified,
	extracted
}: ExtractedEvidenceSourceInput): ContextSource {
	const normalizedExtracted = normalizeExtractedEvidence(extracted);
	const claims = normalizedExtracted.claims.map((claim, index) => ({
		id: `${id}-ai-claim-${index + 1}-${claim.kind}`,
		kind: claim.kind as SourceClaimKind,
		text: claim.text,
		support: claim.support as SourceClaimSupport,
		...(claim.stance && claim.stance !== 'none' ? { stance: claim.stance as SourceClaimStance } : {}),
		sensitivity: claim.sensitivity as SourceSensitivityLevel,
		requiresValidation: claim.requiresValidation,
		reason: claim.reason
	})) satisfies SourceClaim[];
	const ownerSignals = normalizedExtracted.ownerSignals.map((ownerSignal, index) =>
		toOwnerSignal(ownerSignal, id, index)
	);

	return {
		id,
		kind: inferSourceKind(fileName),
		title: fileName,
		summary: summarizeExtractedSource(text, normalizedExtracted),
		fullText: text,
		extractionKind: 'ai',
		cautions: normalizedExtracted.cautions,
		missingContext: normalizedExtracted.missingContext,
		createdAt: lastModified,
		updatedAt: lastModified,
		createdBy: ownerSignals[0]?.owner ?? AI_OWNER_FALLBACK,
		ownerSignals:
			ownerSignals.length > 0
				? ownerSignals
				: [
						{
							kind: 'sourceUploader',
							confidence: 0.45,
							reason: 'AI extraction did not identify a stronger owner signal.',
							owner: AI_OWNER_FALLBACK
						}
					],
		claims: claims.length > 0 ? claims : [toFallbackClaim(id, text)],
		sensitivity: getMaxSensitivity([
			...claims.map((claim) => claim.sensitivity),
			...normalizedExtracted.cautions.map(inferSensitivityFromText)
		])
	};
}

function normalizeExtractedClaims(value: unknown): ExtractedEvidenceClaim[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((claim): ExtractedEvidenceClaim | null => {
			if (!isRecord(claim)) {
				return null;
			}

			const kind = normalizeEnum(claim.kind, SOURCE_CLAIM_KINDS, 'other');
			const text = normalizeText(claim.text);
			const reason = normalizeText(claim.reason);

			if (!text) {
				return null;
			}

			return {
				kind,
				text,
				support: normalizeEnum(claim.support, SOURCE_CLAIM_SUPPORTS, 'weak'),
				stance: normalizeStance(claim.stance),
				sensitivity: normalizeEnum(claim.sensitivity, SOURCE_SENSITIVITY_LEVELS, 'medium'),
				requiresValidation: Boolean(claim.requiresValidation),
				reason: reason || 'AI extraction provided this claim.'
			};
		})
		.filter((claim): claim is ExtractedEvidenceClaim => claim !== null)
		.slice(0, 16);
}

function normalizeExtractedOwnerSignals(value: unknown): ExtractedEvidenceOwnerSignal[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((ownerSignal): ExtractedEvidenceOwnerSignal | null => {
			if (!isRecord(ownerSignal)) {
				return null;
			}

			const reason = normalizeText(ownerSignal.reason);

			if (!reason) {
				return null;
			}

			return {
				kind: normalizeEnum(ownerSignal.kind, OWNER_SIGNAL_KINDS, 'unknown'),
				name: normalizeNullableText(ownerSignal.name),
				email: normalizeNullableText(ownerSignal.email),
				role: normalizeNullableText(ownerSignal.role),
				organization: normalizeNullableText(ownerSignal.organization),
				confidence: clampScore(Number(ownerSignal.confidence)),
				reason
			};
		})
		.filter((ownerSignal): ownerSignal is ExtractedEvidenceOwnerSignal => ownerSignal !== null)
		.slice(0, 8);
}

function normalizeSuggestedContextNeedKinds(value: unknown): ContextNeedKind[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((kind) => normalizeEnum(kind, CONTEXT_NEED_KINDS, null))
		.filter((kind): kind is ContextNeedKind => kind !== null);
}

function normalizeStringArray(value: unknown) {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.map(normalizeText).filter(Boolean).slice(0, 12);
}

function toOwnerSignal(
	ownerSignal: ExtractedEvidenceOwnerSignal,
	sourceId: string,
	index: number
): OwnerSignal {
	const owner = ownerSignal.name
		? {
				id: `owner-${sourceId}-${index + 1}-${slugify(ownerSignal.name)}`,
				name: ownerSignal.name,
				...(ownerSignal.email ? { email: ownerSignal.email } : {}),
				...(ownerSignal.role ? { role: ownerSignal.role } : {}),
				...(ownerSignal.organization ? { organization: ownerSignal.organization } : {})
			}
		: undefined;

	return {
		kind: ownerSignal.kind as OwnerSignalKind,
		confidence: ownerSignal.confidence,
		reason: ownerSignal.reason,
		...(owner ? { owner } : {})
	};
}

function toFallbackClaim(sourceId: string, text: string): SourceClaim {
	return {
		id: `${sourceId}-ai-claim-other`,
		kind: 'other',
		text: summarizeText(text) || 'AI extraction did not identify specific claims.',
		support: 'weak',
		sensitivity: inferSensitivityFromText(text),
		requiresValidation: true,
		reason: 'No structured claim was available after normalization.'
	};
}

function summarizeExtractedSource(text: string, extracted: ExtractedEvidence) {
	const cautions = extracted.cautions.length > 0 ? ` Cautions: ${extracted.cautions.join(' ')}` : '';
	const missingContext = extracted.missingContext.length > 0 ? ` Missing context: ${extracted.missingContext.join(' ')}` : '';

	return `${summarizeText(text)}${cautions}${missingContext}`.trim();
}

function summarizeText(text: string) {
	const normalizedText = text.replace(/\s+/g, ' ').trim();

	return normalizedText.length > 280 ? `${normalizedText.slice(0, 280).trim()}...` : normalizedText;
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

function inferSensitivityFromText(text: string): SourceSensitivityLevel {
	const normalizedText = text.toLowerCase();

	if (/(confidential|partner|private|legal|restricted)/.test(normalizedText)) {
		return 'high';
	}

	if (/(internal|pricing|discount|procurement|contract)/.test(normalizedText)) {
		return 'medium';
	}

	return 'low';
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

function normalizeStance(value: unknown): ExtractedEvidenceClaim['stance'] {
	if (typeof value !== 'string') {
		return 'none';
	}

	if (value === 'none') {
		return 'none';
	}

	return normalizeEnum(value, SOURCE_CLAIM_STANCES, 'none');
}

function normalizeEnum<const Value extends string>(
	value: unknown,
	allowedValues: ReadonlySet<Value>,
	fallback: Value
): Value;
function normalizeEnum<const Value extends string>(
	value: unknown,
	allowedValues: ReadonlySet<Value>,
	fallback: null
): Value | null;
function normalizeEnum<const Value extends string>(
	value: unknown,
	allowedValues: ReadonlySet<Value>,
	fallback: Value | null
) {
	return typeof value === 'string' && allowedValues.has(value as Value) ? value : fallback;
}

function normalizeNullableText(value: unknown) {
	const text = normalizeText(value);

	return text || null;
}

function normalizeText(value: unknown) {
	return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function clampScore(value: number) {
	if (!Number.isFinite(value)) {
		return 0;
	}

	return Math.min(1, Math.max(0, value));
}

function slugify(value: string) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 48) || 'owner';
}
