import type {
	ContextNeedKind,
	OwnerSignalKind,
	SourceClaimKind,
	SourceClaimStance,
	SourceClaimSupport,
	SourceSensitivityLevel
} from '$domain/source-ranking';

export type ExtractedEvidenceClaim = {
	kind: SourceClaimKind | string;
	text: string;
	support: SourceClaimSupport | string;
	stance: SourceClaimStance | 'none' | string | null;
	sensitivity: SourceSensitivityLevel | string;
	requiresValidation: boolean;
	reason: string;
};

export type ExtractedEvidenceOwnerSignal = {
	kind: OwnerSignalKind | string;
	name: string | null;
	email: string | null;
	role: string | null;
	organization: string | null;
	confidence: number;
	reason: string;
};

export type ExtractedEvidence = {
	claims: ExtractedEvidenceClaim[];
	ownerSignals: ExtractedEvidenceOwnerSignal[];
	cautions: string[];
	missingContext: string[];
	suggestedContextNeedKinds: Array<ContextNeedKind | string>;
};

export type ExtractedEvidenceSourceInput = {
	id: string;
	fileName: string;
	text: string;
	lastModified: number;
	extracted: ExtractedEvidence;
};
