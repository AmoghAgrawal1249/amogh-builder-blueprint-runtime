import type {
	EvidenceAssessment,
	SourceClaimKind,
	SourceTier
} from './types';

export type AutomationDecisionKind =
	| 'autoHandoff'
	| 'generateContextRequest'
	| 'needsUserReview'
	| 'blocked';

export type AutomationDecisionBlockerKind =
	| 'missingStrongSource'
	| 'highRisk'
	| 'conflictingEvidence'
	| 'validationRequired'
	| 'noLikelyOwner'
	| 'insufficientContext'
	| 'sensitiveMaterial';

export type AutomationDecisionSeverity = 'low' | 'medium' | 'high';

export type AutomationDecisionBlocker = {
	kind: AutomationDecisionBlockerKind;
	message: string;
	severity: AutomationDecisionSeverity;
	sourceIds: readonly string[];
	claimKinds?: readonly SourceClaimKind[];
};

export type AutomationDecisionBase = {
	kind: AutomationDecisionKind;
	evidenceBundleId: string;
	contextNeedId: string;
	primarySourceIds: readonly string[];
	reason: string;
	blockers: readonly AutomationDecisionBlocker[];
};

export type AutoHandoffDecision = AutomationDecisionBase & {
	kind: 'autoHandoff';
};

export type GenerateContextRequestDecision = AutomationDecisionBase & {
	kind: 'generateContextRequest';
	ownerIds: readonly string[];
};

export type NeedsUserReviewDecision = AutomationDecisionBase & {
	kind: 'needsUserReview';
};

export type BlockedDecision = AutomationDecisionBase & {
	kind: 'blocked';
};

export type AutomationDecision =
	| AutoHandoffDecision
	| GenerateContextRequestDecision
	| NeedsUserReviewDecision
	| BlockedDecision;

export type AutomationDecisionInput = {
	evidenceAssessment: EvidenceAssessment;
};

export type AutomationDecisionTierPolicy = {
	minSourceTier: SourceTier;
};
