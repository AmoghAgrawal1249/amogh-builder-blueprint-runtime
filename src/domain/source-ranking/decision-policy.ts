import type {
	AutomationDecisionBlockerKind,
	AutomationDecisionKind,
	AutomationDecisionTierPolicy
} from './decisions';
import type { OwnerSignalKind } from './types';

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
	},
	owner: {
		minLikelyOwnerConfidence: 0.75,
		allowedValidationOwnerKinds: [
			'accountOwner',
			'opportunityOwner',
			'proposalOwner',
			'meetingAttendee',
			'documentAuthor'
		] as const satisfies readonly OwnerSignalKind[],
		disallowedValidationOwnerKinds: [
			'sourceUploader',
			'unknown'
		] as const satisfies readonly OwnerSignalKind[]
	},
	conflictResolution: {
		allowFreshStrongOverStaleWeakerConflict: true,
		minFreshnessGap: 0.25,
		minConfidenceGap: 0.03
	},
	risk: {
		highRiskThreshold: 0.7
	}
} as const;

export function isAutomationDecisionKind(value: string): value is AutomationDecisionKind {
	return AUTOMATION_DECISION_KINDS.some((kind) => kind === value);
}
