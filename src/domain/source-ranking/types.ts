export type NormalizedScore = number;

export type SourceTier = 'strong' | 'medium' | 'weak';

export type ContextNeedKind =
	| 'clientConcern'
	| 'pitchContext'
	| 'renewalRisk'
	| 'implementationRisk'
	| 'decisionCriteria'
	| 'stakeholderContext'
	| 'pricingContext'
	| 'timelineContext'
	| 'other';

export type ContextSourceKind =
	| 'crmNote'
	| 'accountNote'
	| 'opportunityNote'
	| 'meeting'
	| 'proposal'
	| 'deck'
	| 'partnerMaterial'
	| 'document'
	| 'email'
	| 'other';

export type OwnerSignalKind =
	| 'accountOwner'
	| 'opportunityOwner'
	| 'proposalOwner'
	| 'documentAuthor'
	| 'meetingAttendee'
	| 'sourceUploader'
	| 'unknown';

export type SourceClaimKind =
	| 'clientConcern'
	| 'decisionFeedback'
	| 'implementationRisk'
	| 'renewalRisk'
	| 'pricingContext'
	| 'timelineContext'
	| 'stakeholderContext'
	| 'nextStep'
	| 'other';

export type SourceClaimSupport = 'direct' | 'inferred' | 'weak';

export type SourceClaimStance = 'supports' | 'contradicts';

export type SourceSensitivityLevel = 'low' | 'medium' | 'high';

export type ConfidenceScoreDimension =
	| 'freshness'
	| 'directness'
	| 'authority'
	| 'ownershipSignal'
	| 'completeness'
	| 'corroboration'
	| 'specificity'
	| 'historicalReliability';

export type RiskScoreDimension = 'sensitivity';

export type SourceScoreDimension = ConfidenceScoreDimension | RiskScoreDimension;

export type EvidenceEntityRef = {
	id: string;
	name: string;
};

export type EvidenceOwner = EvidenceEntityRef & {
	email?: string;
	role?: string;
	organization?: string;
};

export type ContextNeed = {
	id: string;
	kind: ContextNeedKind;
	label: string;
	description: string;
	client?: EvidenceEntityRef;
	opportunity?: EvidenceEntityRef;
	requiredClaimKinds: readonly SourceClaimKind[];
	sensitivity: SourceSensitivityLevel;
};

export type OwnerSignal = {
	kind: OwnerSignalKind;
	confidence: NormalizedScore;
	reason: string;
	owner?: EvidenceOwner;
};

export type SourceClaim = {
	id: string;
	kind: SourceClaimKind;
	text: string;
	support: SourceClaimSupport;
	stance?: SourceClaimStance;
	sensitivity: SourceSensitivityLevel;
};

export type ContextSource = {
	id: string;
	kind: ContextSourceKind;
	title: string;
	summary?: string;
	createdAt: number;
	updatedAt?: number;
	client?: EvidenceEntityRef;
	opportunity?: EvidenceEntityRef;
	createdBy?: EvidenceOwner;
	ownerSignals: readonly OwnerSignal[];
	claims: readonly SourceClaim[];
	sensitivity: SourceSensitivityLevel;
};

export type ConfidenceScores = Record<ConfidenceScoreDimension, NormalizedScore>;

export type RiskScores = Record<RiskScoreDimension, NormalizedScore>;

export type SourceScores = {
	confidence: ConfidenceScores;
	risk: RiskScores;
};

export type ScoreExplanation = {
	dimension: SourceScoreDimension;
	score: NormalizedScore;
	reason: string;
	polarity: 'positive' | 'negative' | 'neutral';
};

export type SourceWeakness = {
	dimension: SourceScoreDimension;
	message: string;
	severity: 'low' | 'medium' | 'high';
};

export type SourceAssessment = {
	contextNeedId: string;
	sourceId: string;
	tier: SourceTier;
	scores: SourceScores;
	aggregateConfidence: NormalizedScore;
	aggregateRisk: NormalizedScore;
	bestOwnerSignal?: OwnerSignal;
	matchedClaims: readonly SourceClaim[];
	weaknesses: readonly SourceWeakness[];
	explanations: readonly ScoreExplanation[];
};

export type EvidenceBundle = {
	id: string;
	title: string;
	description?: string;
	contextNeed: ContextNeed;
	sources: readonly ContextSource[];
};

export type EvidenceAssessment = {
	bundleId: string;
	contextNeedId: string;
	sourceAssessments: readonly SourceAssessment[];
	strongestTier: SourceTier | null;
	aggregateConfidence: NormalizedScore;
	aggregateRisk: NormalizedScore;
	bestSourceIds: readonly string[];
	likelyOwnerSignals: readonly OwnerSignal[];
	corroboratedClaimKinds: readonly SourceClaimKind[];
	conflictingClaimKinds: readonly SourceClaimKind[];
	unresolvedWeaknesses: readonly SourceWeakness[];
};

export type EvidenceFixtureDecisionKind =
	| 'autoHandoff'
	| 'generateContextRequest'
	| 'needsUserReview'
	| 'blocked';

export type EvidenceFixtureReviewPromptKind =
	| 'staleSource'
	| 'similarClientMatch'
	| 'unclearOwner'
	| 'sensitiveMaterial'
	| 'unsupportedClaim';

export type EvidenceFixtureTruth = {
	strongestTier: SourceTier;
	sourceTiers: Record<string, SourceTier>;
	automationDecision: EvidenceFixtureDecisionKind;
	primarySourceIds: readonly string[];
	likelyOwnerIds: readonly string[];
	validatedClaimIds: readonly string[];
	weakClaimIds: readonly string[];
	contextRequestOwnerId?: string;
	reviewPromptKind?: EvidenceFixtureReviewPromptKind;
	blockedReason?: string;
	corroboratedClaimKinds?: readonly SourceClaimKind[];
	conflictingClaimKinds?: readonly SourceClaimKind[];
	notes: readonly string[];
};

export type EvidenceFixture = EvidenceBundle & {
	expected: EvidenceFixtureTruth;
};
