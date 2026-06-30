import type {
	AutomationDecisionBlockerKind,
	AutomationDecisionKind,
	AutomationDecisionTierPolicy
} from './decisions';

export const AUTOMATION_DECISION_KINDS = [
	'autoHandoff',
	'generateContextRequest',
	'needsUserReview',
	'blocked'
] as const satisfies readonly AutomationDecisionKind[];

export const AUTOMATION_DECISION_BLOCKER_KINDS = [
	'missingStrongSource',
	'highRisk',
	'conflictingEvidence',
	'validationRequired',
	'noLikelyOwner',
	'insufficientContext',
	'sensitiveMaterial'
] as const satisfies readonly AutomationDecisionBlockerKind[];

export const AUTOMATION_DECISION_POLICY = {
	autoHandoff: {
		requiresStrongSource: true,
		minStrongSourceCount: 1,
		maxAggregateRisk: 0.35,
		allowConflicts: false,
		allowValidationRequiredClaims: false
	},
	contextRequest: {
		minSourceTier: 'medium',
		requiresLikelyOwner: true
	} satisfies AutomationDecisionTierPolicy & {
		requiresLikelyOwner: boolean;
	},
	userReview: {
		conflictForcesReview: true,
		validationWithoutClearOwnerForcesReview: true
	},
	blocked: {
		noOwnerAndWeakEvidenceBlocks: true,
		highRiskWithoutValidationPathBlocks: true
	}
} as const;

export function isAutomationDecisionKind(value: string): value is AutomationDecisionKind {
	return AUTOMATION_DECISION_KINDS.some((kind) => kind === value);
}
