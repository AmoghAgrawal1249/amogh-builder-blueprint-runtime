import type {
	ConfidenceScoreDimension,
	ContextSourceKind,
	NormalizedScore,
	OwnerSignalKind,
	SourceSensitivityLevel
} from './types';

export const SOURCE_RANKING_SCORE_RANGE = {
	min: 0,
	max: 1
} as const;

export const SOURCE_RANKING_CONFIDENCE_WEIGHTS = {
	freshness: 0.14,
	directness: 0.18,
	authority: 0.15,
	ownershipSignal: 0.12,
	completeness: 0.16,
	corroboration: 0.1,
	specificity: 0.1,
	historicalReliability: 0.05
} as const satisfies Record<ConfidenceScoreDimension, NormalizedScore>;

export const SOURCE_TIER_POLICY = {
	strong: {
		minConfidence: 0.78,
		maxRisk: 0.35,
		minDirectness: 0.65,
		minSpecificity: 0.65
	},
	medium: {
		minConfidence: 0.48,
		maxRisk: 0.7
	},
	highRisk: {
		minSensitivity: 0.75
	}
} as const;

export const SOURCE_FRESHNESS_POLICY = {
	recentDays: 30,
	currentDays: 180,
	agingDays: 365,
	staleDays: 540
} as const;

export const SOURCE_DIRECTNESS_PRIORS = {
	sameOpportunity: 1,
	sameClient: 0.86,
	sameClientAdjacentWork: 0.66,
	similarClient: 0.42,
	sameIndustry: 0.26,
	generic: 0.12
} as const satisfies Record<string, NormalizedScore>;

export const SOURCE_KIND_AUTHORITY_PRIORS = {
	crmNote: 0.82,
	accountNote: 0.86,
	opportunityNote: 0.9,
	meeting: 0.68,
	proposal: 0.78,
	deck: 0.44,
	partnerMaterial: 0.4,
	document: 0.5,
	email: 0.62,
	other: 0.3
} as const satisfies Record<ContextSourceKind, NormalizedScore>;

export const SOURCE_KIND_RELIABILITY_PRIORS = {
	crmNote: 0.82,
	accountNote: 0.84,
	opportunityNote: 0.86,
	meeting: 0.62,
	proposal: 0.74,
	deck: 0.42,
	partnerMaterial: 0.36,
	document: 0.5,
	email: 0.58,
	other: 0.28
} as const satisfies Record<ContextSourceKind, NormalizedScore>;

export const SOURCE_KIND_SENSITIVITY_PRIORS = {
	crmNote: 0.34,
	accountNote: 0.38,
	opportunityNote: 0.42,
	meeting: 0.3,
	proposal: 0.54,
	deck: 0.44,
	partnerMaterial: 0.78,
	document: 0.46,
	email: 0.5,
	other: 0.5
} as const satisfies Record<ContextSourceKind, NormalizedScore>;

export const OWNER_SIGNAL_PRIORS = {
	accountOwner: 0.9,
	opportunityOwner: 0.94,
	proposalOwner: 0.82,
	documentAuthor: 0.62,
	meetingAttendee: 0.58,
	sourceUploader: 0.42,
	unknown: 0
} as const satisfies Record<OwnerSignalKind, NormalizedScore>;

export const SOURCE_SENSITIVITY_PRIORS = {
	low: 0.18,
	medium: 0.52,
	high: 0.86
} as const satisfies Record<SourceSensitivityLevel, NormalizedScore>;

export const EVIDENCE_BUNDLE_AGGREGATION_POLICY = {
	primaryWeight: 0.8,
	supportingWeight: 0.2
} as const;
