import { AUTOMATION_DECISION_POLICY } from './decision-policy';
import type {
	AutomationDecision,
	AutomationDecisionBlocker,
	AutomationDecisionInput,
	AutomationDecisionSeverity
} from './decisions';
import type {
	EvidenceAssessment,
	OwnerSignal,
	SourceAssessment,
	SourceClaim,
	SourceClaimKind,
	SourceClaimStance,
	SourceTier
} from './types';

type DecisionSignals = {
	assessment: EvidenceAssessment;
	sourceAssessments: readonly SourceAssessment[];
	bestSourceAssessments: readonly SourceAssessment[];
	strongSourceAssessments: readonly SourceAssessment[];
	primarySourceIds: readonly string[];
	likelyValidationOwnerSignals: readonly OwnerSignal[];
	likelyValidationOwnerIds: readonly string[];
	hasUsableSource: boolean;
	hasStrongSource: boolean;
	hasLikelyValidationOwner: boolean;
	hasAnyHumanOwnerSignal: boolean;
	hasHighRisk: boolean;
	hasSensitiveMaterial: boolean;
	hasConflicts: boolean;
	hasValidationRequiredClaims: boolean;
	hasWeakOrInferredClaims: boolean;
	hasUnsafePrimaryStrongClaims: boolean;
	isWeakEvidence: boolean;
	resolvedConflictSourceIds: readonly string[];
	unresolvedConflictClaimKinds: readonly SourceClaimKind[];
};

const SOURCE_TIER_RANK = {
	weak: 0,
	medium: 1,
	strong: 2
} as const satisfies Record<SourceTier, number>;

export function decideAutomation({
	evidenceAssessment
}: AutomationDecisionInput): AutomationDecision {
	const signals = getDecisionSignals(evidenceAssessment);

	if (!signals.hasUsableSource) {
		return buildBlockedDecision(
			signals,
			'No source answers the required context need.',
			getNoUsableSourceBlockers(signals)
		);
	}

	if (signals.hasHighRisk && !signals.hasLikelyValidationOwner) {
		return buildBlockedDecision(
			signals,
			'Evidence is too risky to use without a reliable validation owner.',
			getHighRiskNoOwnerBlockers(signals)
		);
	}

	if (canAutoHandoff(signals)) {
		return buildAutoHandoffDecision(
			signals,
			signals.strongSourceAssessments.map((assessment) => assessment.sourceId),
			'Fresh strong evidence is sufficient for automatic handoff.'
		);
	}

	if (canAutoHandoffWithResolvedConflicts(signals)) {
		return buildAutoHandoffDecision(
			signals,
			signals.resolvedConflictSourceIds,
			'Fresh strong evidence resolves older conflicting context.'
		);
	}

	if (signals.hasConflicts) {
		return buildNeedsUserReviewDecision(
			signals,
			'Conflicting evidence requires user review before automation.',
			getReviewBlockers(signals)
		);
	}

	if (canGenerateContextRequest(signals)) {
		return buildGenerateContextRequestDecision(
			signals,
			'Medium evidence needs validation from a likely owner before automation.',
			getContextRequestBlockers(signals)
		);
	}

	if (signals.isWeakEvidence && !signals.hasLikelyValidationOwner && !signals.hasAnyHumanOwnerSignal) {
		return buildBlockedDecision(
			signals,
			'Evidence is weak and has no reliable validation owner.',
			getOwnerlessWeakEvidenceBlockers(signals)
		);
	}

	if (
		signals.hasWeakOrInferredClaims ||
		signals.hasValidationRequiredClaims ||
		!signals.hasLikelyValidationOwner
	) {
		return buildNeedsUserReviewDecision(
			signals,
			'Usable evidence has an uncertainty that needs user review.',
			getReviewBlockers(signals)
		);
	}

	return buildBlockedDecision(
		signals,
		'Available evidence is not reliable enough for automation.',
		getInsufficientContextBlockers(signals)
	);
}

function getDecisionSignals(assessment: EvidenceAssessment): DecisionSignals {
	const sourceAssessments = assessment.sourceAssessments;
	const bestSourceAssessments = getBestSourceAssessments(assessment);
	const strongSourceAssessments = sourceAssessments.filter(
		(sourceAssessment) => sourceAssessment.tier === 'strong'
	);
	const likelyValidationOwnerSignals = assessment.likelyOwnerSignals.filter(isLikelyValidationOwner);
	const likelyValidationOwnerIds = getOwnerIds(likelyValidationOwnerSignals);
	const resolvedConflictSourceIds = getResolvedConflictSourceIds(assessment, strongSourceAssessments);
	const unresolvedConflictClaimKinds = getUnresolvedConflictClaimKinds(
		assessment,
		resolvedConflictSourceIds
	);

	return {
		assessment,
		sourceAssessments,
		bestSourceAssessments,
		strongSourceAssessments,
		primarySourceIds: getPrimarySourceIds(assessment, bestSourceAssessments),
		likelyValidationOwnerSignals,
		likelyValidationOwnerIds,
		hasUsableSource: sourceAssessments.some(hasMatchedClaim),
		hasStrongSource: strongSourceAssessments.length > 0,
		hasLikelyValidationOwner: likelyValidationOwnerIds.length > 0,
		hasAnyHumanOwnerSignal: assessment.likelyOwnerSignals.length > 0,
		hasHighRisk: hasHighRisk(assessment),
		hasSensitiveMaterial: hasSensitiveMaterial(assessment),
		hasConflicts: assessment.conflictingClaimKinds.length > 0,
		hasValidationRequiredClaims: sourceAssessments.some(hasValidationRequiredClaim),
		hasWeakOrInferredClaims: sourceAssessments.some(hasWeakOrInferredClaim),
		hasUnsafePrimaryStrongClaims: strongSourceAssessments.some(hasUnsafeClaimForAutoHandoff),
		isWeakEvidence: assessment.strongestTier !== 'medium' && assessment.strongestTier !== 'strong',
		resolvedConflictSourceIds,
		unresolvedConflictClaimKinds
	};
}

function canAutoHandoff(signals: DecisionSignals) {
	return (
		signals.hasStrongSource &&
		signals.assessment.aggregateRisk <= AUTOMATION_DECISION_POLICY.autoHandoff.maxAggregateRisk &&
		!signals.hasConflicts &&
		!signals.hasUnsafePrimaryStrongClaims
	);
}

function canAutoHandoffWithResolvedConflicts(signals: DecisionSignals) {
	return (
		AUTOMATION_DECISION_POLICY.conflictResolution.allowFreshStrongOverStaleWeakerConflict &&
		signals.hasStrongSource &&
		signals.hasConflicts &&
		signals.assessment.aggregateRisk <= AUTOMATION_DECISION_POLICY.autoHandoff.maxAggregateRisk &&
		signals.resolvedConflictSourceIds.length > 0 &&
		signals.unresolvedConflictClaimKinds.length === 0 &&
		!signals.hasUnsafePrimaryStrongClaims
	);
}

function canGenerateContextRequest(signals: DecisionSignals) {
	return isTierAtLeast(signals.assessment.strongestTier, AUTOMATION_DECISION_POLICY.contextRequest.minSourceTier) &&
		signals.hasLikelyValidationOwner;
}

function isLikelyValidationOwner(ownerSignal: OwnerSignal) {
	if (!ownerSignal.owner || ownerSignal.confidence < AUTOMATION_DECISION_POLICY.owner.minLikelyOwnerConfidence) {
		return false;
	}

	if (AUTOMATION_DECISION_POLICY.owner.disallowedValidationOwnerKinds.some((kind) => kind === ownerSignal.kind)) {
		return false;
	}

	return AUTOMATION_DECISION_POLICY.owner.allowedValidationOwnerKinds.some(
		(kind) => kind === ownerSignal.kind
	);
}

function getOwnerIds(ownerSignals: readonly OwnerSignal[]) {
	const ownerIds = new Set<string>();

	for (const ownerSignal of ownerSignals) {
		if (ownerSignal.owner) {
			ownerIds.add(ownerSignal.owner.id);
		}
	}

	return [...ownerIds];
}

function getBestSourceAssessments(assessment: EvidenceAssessment) {
	if (assessment.bestSourceIds.length === 0) {
		return getTopSourceAssessments(assessment.sourceAssessments);
	}

	const bestSourceIds = new Set(assessment.bestSourceIds);

	return assessment.sourceAssessments.filter((sourceAssessment) =>
		bestSourceIds.has(sourceAssessment.sourceId)
	);
}

function getTopSourceAssessments(sourceAssessments: readonly SourceAssessment[]) {
	const bestConfidence = Math.max(
		-Infinity,
		...sourceAssessments.map((assessment) => assessment.aggregateConfidence)
	);

	return sourceAssessments.filter(
		(assessment) => assessment.aggregateConfidence === bestConfidence
	);
}

function getPrimarySourceIds(
	assessment: EvidenceAssessment,
	bestSourceAssessments: readonly SourceAssessment[]
) {
	if (assessment.bestSourceIds.length > 0) {
		return assessment.bestSourceIds;
	}

	return bestSourceAssessments.map((sourceAssessment) => sourceAssessment.sourceId);
}

function hasHighRisk(assessment: EvidenceAssessment) {
	return assessment.aggregateRisk >= AUTOMATION_DECISION_POLICY.risk.highRiskThreshold ||
		assessment.sourceAssessments.some(
			(sourceAssessment) =>
				sourceAssessment.aggregateRisk >= AUTOMATION_DECISION_POLICY.risk.highRiskThreshold
		);
}

function hasSensitiveMaterial(assessment: EvidenceAssessment) {
	return assessment.unresolvedWeaknesses.some(
		(weakness) => weakness.dimension === 'sensitivity' && weakness.severity === 'high'
	);
}

function hasMatchedClaim(sourceAssessment: SourceAssessment) {
	return sourceAssessment.matchedClaims.length > 0;
}

function hasValidationRequiredClaim(sourceAssessment: SourceAssessment) {
	return sourceAssessment.matchedClaims.some((claim) => claim.requiresValidation === true);
}

function hasWeakOrInferredClaim(sourceAssessment: SourceAssessment) {
	return sourceAssessment.matchedClaims.some((claim) => claim.support !== 'direct');
}

function hasUnsafeClaimForAutoHandoff(sourceAssessment: SourceAssessment) {
	return sourceAssessment.matchedClaims.some(
		(claim) => claim.requiresValidation === true || claim.support !== 'direct'
	);
}

function getResolvedConflictSourceIds(
	assessment: EvidenceAssessment,
	strongSourceAssessments: readonly SourceAssessment[]
) {
	const resolvedSourceIds = new Set<string>();

	for (const claimKind of assessment.conflictingClaimKinds) {
		const resolvingSourceAssessment = getResolvingSourceAssessmentForConflict(
			assessment,
			strongSourceAssessments,
			claimKind
		);

		if (resolvingSourceAssessment) {
			resolvedSourceIds.add(resolvingSourceAssessment.sourceId);
		}
	}

	return [...resolvedSourceIds];
}

function getUnresolvedConflictClaimKinds(
	assessment: EvidenceAssessment,
	resolvedConflictSourceIds: readonly string[]
) {
	const resolvedSourceIdSet = new Set(resolvedConflictSourceIds);

	return assessment.conflictingClaimKinds.filter((claimKind) => {
		const resolvedSourceHandlesClaimKind = assessment.sourceAssessments.some(
			(sourceAssessment) =>
				resolvedSourceIdSet.has(sourceAssessment.sourceId) &&
				sourceAssessment.matchedClaims.some((claim) => claim.kind === claimKind)
		);

		return !resolvedSourceHandlesClaimKind;
	});
}

function getResolvingSourceAssessmentForConflict(
	assessment: EvidenceAssessment,
	strongSourceAssessments: readonly SourceAssessment[],
	claimKind: SourceClaimKind
) {
	const participants = assessment.sourceAssessments.filter((sourceAssessment) =>
		sourceAssessment.matchedClaims.some((claim) => claim.kind === claimKind)
	);

	return strongSourceAssessments.find((candidateAssessment) => {
		if (!hasDirectSafeClaim(candidateAssessment, claimKind)) {
			return false;
		}

		const opposingAssessments = getOpposingAssessments(candidateAssessment, participants, claimKind);

		return opposingAssessments.length > 0 && opposingAssessments.every((opposingAssessment) =>
			isFreshStrongSourceBetterThanStaleConflict(candidateAssessment, opposingAssessment)
		);
	});
}

function getOpposingAssessments(
	candidateAssessment: SourceAssessment,
	participants: readonly SourceAssessment[],
	claimKind: SourceClaimKind
) {
	const candidateStances = getClaimStances(candidateAssessment, claimKind);

	return participants.filter(
		(participant) =>
			participant.sourceId !== candidateAssessment.sourceId &&
			getClaimStances(participant, claimKind).some((stance) =>
				candidateStances.some((candidateStance) => candidateStance !== stance)
			)
	);
}

function isFreshStrongSourceBetterThanStaleConflict(
	candidateAssessment: SourceAssessment,
	opposingAssessment: SourceAssessment
) {
	return SOURCE_TIER_RANK[candidateAssessment.tier] > SOURCE_TIER_RANK[opposingAssessment.tier] &&
		candidateAssessment.scores.confidence.freshness - opposingAssessment.scores.confidence.freshness >=
			AUTOMATION_DECISION_POLICY.conflictResolution.minFreshnessGap &&
		candidateAssessment.aggregateConfidence - opposingAssessment.aggregateConfidence >=
			AUTOMATION_DECISION_POLICY.conflictResolution.minConfidenceGap;
}

function hasDirectSafeClaim(sourceAssessment: SourceAssessment, claimKind: SourceClaimKind) {
	return sourceAssessment.matchedClaims.some(
		(claim) => claim.kind === claimKind && claim.support === 'direct' && claim.requiresValidation !== true
	);
}

function getClaimStances(sourceAssessment: SourceAssessment, claimKind: SourceClaimKind) {
	return sourceAssessment.matchedClaims
		.filter((claim) => claim.kind === claimKind)
		.map(getClaimStance);
}

function getClaimStance(claim: SourceClaim): SourceClaimStance {
	return claim.stance ?? 'supports';
}

function isTierAtLeast(sourceTier: SourceTier | null, minSourceTier: SourceTier) {
	if (!sourceTier) {
		return false;
	}

	return SOURCE_TIER_RANK[sourceTier] >= SOURCE_TIER_RANK[minSourceTier];
}

function buildAutoHandoffDecision(
	signals: DecisionSignals,
	primarySourceIds: readonly string[],
	reason: string
): AutomationDecision {
	return {
		kind: 'autoHandoff',
		evidenceBundleId: signals.assessment.bundleId,
		contextNeedId: signals.assessment.contextNeedId,
		primarySourceIds,
		reason,
		blockers: []
	};
}

function buildGenerateContextRequestDecision(
	signals: DecisionSignals,
	reason: string,
	blockers: readonly AutomationDecisionBlocker[]
): AutomationDecision {
	return {
		kind: 'generateContextRequest',
		evidenceBundleId: signals.assessment.bundleId,
		contextNeedId: signals.assessment.contextNeedId,
		primarySourceIds: signals.primarySourceIds,
		reason,
		blockers,
		ownerIds: signals.likelyValidationOwnerIds
	};
}

function buildNeedsUserReviewDecision(
	signals: DecisionSignals,
	reason: string,
	blockers: readonly AutomationDecisionBlocker[]
): AutomationDecision {
	return {
		kind: 'needsUserReview',
		evidenceBundleId: signals.assessment.bundleId,
		contextNeedId: signals.assessment.contextNeedId,
		primarySourceIds: signals.primarySourceIds,
		reason,
		blockers
	};
}

function buildBlockedDecision(
	signals: DecisionSignals,
	reason: string,
	blockers: readonly AutomationDecisionBlocker[]
): AutomationDecision {
	return {
		kind: 'blocked',
		evidenceBundleId: signals.assessment.bundleId,
		contextNeedId: signals.assessment.contextNeedId,
		primarySourceIds: [],
		reason,
		blockers
	};
}

function getNoUsableSourceBlockers(signals: DecisionSignals) {
	return [
		createBlocker({
			kind: 'insufficientContext',
			message: 'No source contains a matching claim for the context need.',
			severity: 'high',
			sourceIds: signals.sourceAssessments.map((assessment) => assessment.sourceId)
		}),
		...(signals.hasAnyHumanOwnerSignal ? [] : [createNoLikelyOwnerBlocker(signals)])
	];
}

function getHighRiskNoOwnerBlockers(signals: DecisionSignals) {
	return [
		createBlocker({
			kind: 'highRisk',
			message: 'Evidence risk is too high without a reliable validation owner.',
			severity: 'high',
			sourceIds: signals.primarySourceIds
		}),
		...(signals.hasSensitiveMaterial
			? [
					createBlocker({
						kind: 'sensitiveMaterial',
						message: 'Sensitive material requires validation before automation.',
						severity: 'high',
						sourceIds: signals.primarySourceIds
					})
				]
			: []),
		createNoLikelyOwnerBlocker(signals)
	];
}

function getContextRequestBlockers(signals: DecisionSignals) {
	return [
		...(signals.hasStrongSource
			? []
			: [
					createBlocker({
						kind: 'missingStrongSource',
						message: 'Evidence is useful but not strong enough for automatic handoff.',
						severity: 'medium',
						sourceIds: signals.primarySourceIds
					})
				]),
		...(signals.hasWeakOrInferredClaims || signals.hasValidationRequiredClaims
			? [
					createBlocker({
						kind: 'validationRequired',
						message: 'One or more matched claims need validation before automation.',
						severity: 'medium',
						sourceIds: signals.primarySourceIds,
						claimKinds: getUncertainClaimKinds(signals.sourceAssessments)
					})
				]
			: [])
	];
}

function getReviewBlockers(signals: DecisionSignals) {
	return [
		...(signals.unresolvedConflictClaimKinds.length > 0
			? [
					createBlocker({
						kind: 'conflictingEvidence',
						message: 'Sources disagree on a claim needed for automation.',
						severity: 'high',
						sourceIds: getSourceIdsForClaimKinds(signals.sourceAssessments, signals.unresolvedConflictClaimKinds),
						claimKinds: signals.unresolvedConflictClaimKinds
					})
				]
			: []),
		...(signals.hasWeakOrInferredClaims || signals.hasValidationRequiredClaims
			? [
					createBlocker({
						kind: 'validationRequired',
						message: 'Uncertain matched claims need user judgment before use.',
						severity: 'medium',
						sourceIds: signals.primarySourceIds,
						claimKinds: getUncertainClaimKinds(signals.sourceAssessments)
					})
				]
			: []),
		...(signals.hasLikelyValidationOwner ? [] : [createNoLikelyOwnerBlocker(signals)]),
		...(signals.isWeakEvidence
			? [
					createBlocker({
						kind: 'insufficientContext',
						message: 'Evidence is weak and cannot be used without review.',
						severity: 'medium',
						sourceIds: signals.primarySourceIds
					})
				]
			: [])
	];
}

function getOwnerlessWeakEvidenceBlockers(signals: DecisionSignals) {
	return [
		createBlocker({
			kind: 'insufficientContext',
			message: 'Weak evidence has no reliable path to validation.',
			severity: 'high',
			sourceIds: signals.primarySourceIds
		}),
		createNoLikelyOwnerBlocker(signals)
	];
}

function getInsufficientContextBlockers(signals: DecisionSignals) {
	return [
		createBlocker({
			kind: 'insufficientContext',
			message: 'Available evidence does not meet the policy requirements for automation.',
			severity: 'high',
			sourceIds: signals.primarySourceIds
		})
	];
}

function createNoLikelyOwnerBlocker(signals: DecisionSignals) {
	return createBlocker({
		kind: 'noLikelyOwner',
		message: 'No reliable validation owner is available.',
		severity: signals.hasAnyHumanOwnerSignal ? 'medium' : 'high',
		sourceIds: signals.primarySourceIds
	});
}

function getUncertainClaimKinds(sourceAssessments: readonly SourceAssessment[]) {
	return getUniqueClaimKinds(
		sourceAssessments.flatMap((sourceAssessment) =>
			sourceAssessment.matchedClaims.filter(
				(claim) => claim.support !== 'direct' || claim.requiresValidation === true
			)
		)
	);
}

function getSourceIdsForClaimKinds(
	sourceAssessments: readonly SourceAssessment[],
	claimKinds: readonly SourceClaimKind[]
) {
	const claimKindSet = new Set(claimKinds);

	return sourceAssessments
		.filter((sourceAssessment) =>
			sourceAssessment.matchedClaims.some((claim) => claimKindSet.has(claim.kind))
		)
		.map((sourceAssessment) => sourceAssessment.sourceId);
}

function getUniqueClaimKinds(claims: readonly SourceClaim[]) {
	return [...new Set(claims.map((claim) => claim.kind))];
}

function createBlocker({
	kind,
	message,
	severity,
	sourceIds,
	claimKinds
}: {
	kind: AutomationDecisionBlocker['kind'];
	message: string;
	severity: AutomationDecisionSeverity;
	sourceIds: readonly string[];
	claimKinds?: readonly SourceClaimKind[];
}): AutomationDecisionBlocker {
	return {
		kind,
		message,
		severity,
		sourceIds,
		...(claimKinds && claimKinds.length > 0 ? { claimKinds } : {})
	};
}
