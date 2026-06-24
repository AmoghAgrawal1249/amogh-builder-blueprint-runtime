import {
	OWNER_SIGNAL_PRIORS,
	SOURCE_DIRECTNESS_PRIORS,
	SOURCE_FRESHNESS_POLICY,
	SOURCE_KIND_AUTHORITY_PRIORS,
	SOURCE_KIND_RELIABILITY_PRIORS,
	SOURCE_KIND_SENSITIVITY_PRIORS,
	SOURCE_RANKING_CONFIDENCE_WEIGHTS,
	SOURCE_RANKING_SCORE_RANGE,
	SOURCE_SENSITIVITY_PRIORS,
	SOURCE_TIER_POLICY
} from './policy';
import type {
	ConfidenceScores,
	ConfidenceScoreDimension,
	ContextNeed,
	ContextSource,
	NormalizedScore,
	OwnerSignal,
	RiskScores,
	ScoreExplanation,
	SourceAssessment,
	SourceClaim,
	SourceClaimKind,
	SourceClaimSupport,
	SourceScoreDimension,
	SourceTier,
	SourceWeakness
} from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_CORROBORATION_SCORE = 0.35;

type ScoreResult<Dimension extends SourceScoreDimension> = {
	dimension: Dimension;
	score: NormalizedScore;
	reason: string;
};

export type SourceAssessmentInput = {
	contextNeed: ContextNeed;
	source: ContextSource;
	allSources?: readonly ContextSource[];
	now?: number;
};

export function assessSourceForContext({
	contextNeed,
	source,
	allSources = [source],
	now = Date.now()
}: SourceAssessmentInput): SourceAssessment {
	const matchedClaims = getMatchedClaims(contextNeed, source);
	const bestOwnerSignal = getBestOwnerSignal(source.ownerSignals);
	const scoreResults = {
		freshness: scoreFreshness(source, now),
		directness: scoreDirectness(contextNeed, source),
		authority: scoreAuthority(source, bestOwnerSignal),
		ownershipSignal: scoreOwnershipSignal(bestOwnerSignal),
		completeness: scoreCompleteness(contextNeed, source),
		corroboration: scoreCorroboration(contextNeed, source, allSources),
		specificity: scoreSpecificity(matchedClaims),
		historicalReliability: scoreHistoricalReliability(source),
		sensitivity: scoreSensitivity(contextNeed, source, matchedClaims)
	};
	const confidence = toConfidenceScores(scoreResults);
	const risk = toRiskScores(scoreResults);
	const aggregateConfidence = getWeightedConfidence(confidence);
	const aggregateRisk = risk.sensitivity;
	const tier = getSourceTier({ confidence, risk }, aggregateConfidence, aggregateRisk);
	const explanations = toScoreExplanations(scoreResults);

	return {
		contextNeedId: contextNeed.id,
		sourceId: source.id,
		tier,
		scores: { confidence, risk },
		aggregateConfidence,
		aggregateRisk,
		...(bestOwnerSignal ? { bestOwnerSignal } : {}),
		matchedClaims,
		weaknesses: getSourceWeaknesses({ confidence, risk }, matchedClaims),
		explanations
	};
}

export function getSourceTier(
	scores: {
		confidence: ConfidenceScores;
		risk: RiskScores;
	},
	aggregateConfidence: NormalizedScore,
	aggregateRisk: NormalizedScore
): SourceTier {
	if (
		aggregateConfidence >= SOURCE_TIER_POLICY.strong.minConfidence &&
		aggregateRisk <= SOURCE_TIER_POLICY.strong.maxRisk &&
		scores.confidence.directness >= SOURCE_TIER_POLICY.strong.minDirectness &&
		scores.confidence.specificity >= SOURCE_TIER_POLICY.strong.minSpecificity
	) {
		return 'strong';
	}

	if (
		aggregateConfidence >= SOURCE_TIER_POLICY.medium.minConfidence &&
		aggregateRisk <= SOURCE_TIER_POLICY.medium.maxRisk
	) {
		return 'medium';
	}

	return 'weak';
}

function scoreFreshness(source: ContextSource, now: number): ScoreResult<'freshness'> {
	const sourceTimestamp = source.updatedAt ?? source.createdAt;
	const ageDays = Math.max(0, Math.floor((now - sourceTimestamp) / MS_PER_DAY));
	const score = getFreshnessScore(ageDays);

	return {
		dimension: 'freshness',
		score,
		reason: `Source is ${ageDays} day${ageDays === 1 ? '' : 's'} old.`
	};
}

function scoreDirectness(
	contextNeed: ContextNeed,
	source: ContextSource
): ScoreResult<'directness'> {
	const needOpportunityId = contextNeed.opportunity?.id;
	const sourceOpportunityId = source.opportunity?.id;
	const sameClient = Boolean(
		contextNeed.client && source.client && contextNeed.client.id === source.client.id
	);

	if (needOpportunityId && sourceOpportunityId && needOpportunityId === sourceOpportunityId) {
		return {
			dimension: 'directness',
			score: SOURCE_DIRECTNESS_PRIORS.sameOpportunity,
			reason: 'Source is tied to the same opportunity as the context need.'
		};
	}

	if (sameClient && needOpportunityId && sourceOpportunityId && needOpportunityId !== sourceOpportunityId) {
		return {
			dimension: 'directness',
			score: SOURCE_DIRECTNESS_PRIORS.sameClientAdjacentWork,
			reason: 'Source is same-client context from adjacent work.'
		};
	}

	if (sameClient) {
		return {
			dimension: 'directness',
			score: SOURCE_DIRECTNESS_PRIORS.sameClient,
			reason: 'Source is tied to the same client as the context need.'
		};
	}

	return {
		dimension: 'directness',
		score: source.client ? SOURCE_DIRECTNESS_PRIORS.similarClient : SOURCE_DIRECTNESS_PRIORS.generic,
		reason: source.client
			? 'Source is client-specific, but not for the requested client.'
			: 'Source is not tied to a specific matching client.'
	};
}

function scoreAuthority(
	source: ContextSource,
	bestOwnerSignal: OwnerSignal | undefined
): ScoreResult<'authority'> {
	const sourceKindAuthority = SOURCE_KIND_AUTHORITY_PRIORS[source.kind];
	const ownerAuthority = bestOwnerSignal ? getOwnerSignalScore(bestOwnerSignal) : 0;
	const authorBonus = source.createdBy ? 0.04 : 0;
	const score = clampScore(sourceKindAuthority * 0.68 + ownerAuthority * 0.28 + authorBonus);

	return {
		dimension: 'authority',
		score,
		reason: bestOwnerSignal?.owner
			? `${source.kind} authority is backed by ${bestOwnerSignal.owner.name}.`
			: `${source.kind} authority has no clear human owner backing it.`
	};
}

function scoreOwnershipSignal(
	bestOwnerSignal: OwnerSignal | undefined
): ScoreResult<'ownershipSignal'> {
	if (!bestOwnerSignal || bestOwnerSignal.kind === 'unknown') {
		return {
			dimension: 'ownershipSignal',
			score: 0,
			reason: 'No likely human owner was found for validation.'
		};
	}

	return {
		dimension: 'ownershipSignal',
		score: getOwnerSignalScore(bestOwnerSignal),
		reason: bestOwnerSignal.owner
			? `${bestOwnerSignal.owner.name} is a likely validator via ${bestOwnerSignal.kind}.`
			: `A likely validator signal exists via ${bestOwnerSignal.kind}.`
	};
}

function scoreCompleteness(
	contextNeed: ContextNeed,
	source: ContextSource
): ScoreResult<'completeness'> {
	const requiredClaimKinds = contextNeed.requiredClaimKinds;

	if (requiredClaimKinds.length === 0) {
		return {
			dimension: 'completeness',
			score: 0.5,
			reason: 'Context need has no required claim kinds to match.'
		};
	}

	const totalSupport = requiredClaimKinds.reduce(
		(total, claimKind) => total + getBestClaimSupportScore(source.claims, claimKind),
		0
	);
	const score = clampScore(totalSupport / requiredClaimKinds.length);

	return {
		dimension: 'completeness',
		score,
		reason: `${getCoveredClaimKindCount(source.claims, requiredClaimKinds)} of ${requiredClaimKinds.length} required claim kind${requiredClaimKinds.length === 1 ? '' : 's'} are covered.`
	};
}

function scoreCorroboration(
	contextNeed: ContextNeed,
	source: ContextSource,
	allSources: readonly ContextSource[]
): ScoreResult<'corroboration'> {
	const matchedClaimKinds = new Set(
		getMatchedClaims(contextNeed, source)
			.filter(isSupportingClaim)
			.map((claim) => claim.kind)
	);

	if (matchedClaimKinds.size === 0) {
		return {
			dimension: 'corroboration',
			score: 0,
			reason: 'Source has no matching claims to corroborate.'
		};
	}

	const corroboratingSourceCount = allSources.filter(
		(candidateSource) =>
			candidateSource.id !== source.id &&
			candidateSource.claims.some(
				(claim) => matchedClaimKinds.has(claim.kind) && claim.support !== 'weak' && isSupportingClaim(claim)
			)
	).length;

	if (corroboratingSourceCount === 0) {
		return {
			dimension: 'corroboration',
			score: DEFAULT_CORROBORATION_SCORE,
			reason: 'No additional source currently corroborates the same signal.'
		};
	}

	return {
		dimension: 'corroboration',
		score: clampScore(0.62 + corroboratingSourceCount * 0.16),
		reason: `${corroboratingSourceCount} other source${corroboratingSourceCount === 1 ? '' : 's'} corroborate matching claims.`
	};
}

function scoreSpecificity(matchedClaims: readonly SourceClaim[]): ScoreResult<'specificity'> {
	if (matchedClaims.length === 0) {
		return {
			dimension: 'specificity',
			score: 0,
			reason: 'Source has no matching claims with usable detail.'
		};
	}

	const totalSpecificity = matchedClaims.reduce(
		(total, claim) => total + getClaimSupportScore(claim.support),
		0
	);
	const score = clampScore(totalSpecificity / matchedClaims.length);

	return {
		dimension: 'specificity',
		score,
		reason: `${matchedClaims.length} matching claim${matchedClaims.length === 1 ? '' : 's'} found with ${describeClaimSupport(matchedClaims)} support.`
	};
}

function scoreHistoricalReliability(
	source: ContextSource
): ScoreResult<'historicalReliability'> {
	return {
		dimension: 'historicalReliability',
		score: SOURCE_KIND_RELIABILITY_PRIORS[source.kind],
		reason: `${source.kind} uses the configured historical reliability prior.`
	};
}

function scoreSensitivity(
	contextNeed: ContextNeed,
	source: ContextSource,
	matchedClaims: readonly SourceClaim[]
): ScoreResult<'sensitivity'> {
	const sourceSensitivity = SOURCE_SENSITIVITY_PRIORS[source.sensitivity];
	const sourceKindSensitivity = SOURCE_KIND_SENSITIVITY_PRIORS[source.kind];
	const contextSensitivity = SOURCE_SENSITIVITY_PRIORS[contextNeed.sensitivity];
	const maxClaimSensitivity = getMaxClaimSensitivity(matchedClaims);
	const score = clampScore(
		sourceSensitivity * 0.4 +
			sourceKindSensitivity * 0.3 +
			maxClaimSensitivity * 0.2 +
			contextSensitivity * 0.1
	);

	return {
		dimension: 'sensitivity',
		score,
		reason: `${source.kind} source is marked ${source.sensitivity} sensitivity for a ${contextNeed.sensitivity} sensitivity need.`
	};
}

function getFreshnessScore(ageDays: number) {
	if (ageDays <= SOURCE_FRESHNESS_POLICY.recentDays) {
		return 1;
	}

	if (ageDays <= SOURCE_FRESHNESS_POLICY.currentDays) {
		return interpolateScore(ageDays, SOURCE_FRESHNESS_POLICY.recentDays, SOURCE_FRESHNESS_POLICY.currentDays, 1, 0.82);
	}

	if (ageDays <= SOURCE_FRESHNESS_POLICY.agingDays) {
		return interpolateScore(ageDays, SOURCE_FRESHNESS_POLICY.currentDays, SOURCE_FRESHNESS_POLICY.agingDays, 0.82, 0.58);
	}

	if (ageDays <= SOURCE_FRESHNESS_POLICY.staleDays) {
		return interpolateScore(ageDays, SOURCE_FRESHNESS_POLICY.agingDays, SOURCE_FRESHNESS_POLICY.staleDays, 0.58, 0.3);
	}

	return clampScore(
		interpolateScore(ageDays, SOURCE_FRESHNESS_POLICY.staleDays, SOURCE_FRESHNESS_POLICY.staleDays * 2, 0.3, 0.08)
	);
}

function interpolateScore(
	value: number,
	start: number,
	end: number,
	startScore: number,
	endScore: number
) {
	const ratio = (value - start) / (end - start);

	return clampScore(startScore + (endScore - startScore) * ratio);
}

function getMatchedClaims(contextNeed: ContextNeed, source: ContextSource) {
	const requiredClaimKinds = new Set(contextNeed.requiredClaimKinds);

	return source.claims.filter((claim) => requiredClaimKinds.has(claim.kind));
}

function getBestOwnerSignal(ownerSignals: readonly OwnerSignal[]) {
	return [...ownerSignals].sort(
		(first, second) => getOwnerSignalScore(second) - getOwnerSignalScore(first)
	)[0];
}

function getOwnerSignalScore(ownerSignal: OwnerSignal) {
	return clampScore(OWNER_SIGNAL_PRIORS[ownerSignal.kind] * ownerSignal.confidence);
}

function getBestClaimSupportScore(
	claims: readonly SourceClaim[],
	claimKind: SourceClaimKind
) {
	return Math.max(
		0,
		...claims
			.filter((claim) => claim.kind === claimKind)
			.map((claim) => getClaimSupportScore(claim.support))
	);
}

function getCoveredClaimKindCount(
	claims: readonly SourceClaim[],
	requiredClaimKinds: readonly SourceClaimKind[]
) {
	return requiredClaimKinds.filter((claimKind) =>
		claims.some((claim) => claim.kind === claimKind)
	).length;
}

function getClaimSupportScore(support: SourceClaimSupport) {
	if (support === 'direct') {
		return 1;
	}

	if (support === 'inferred') {
		return 0.65;
	}

	return 0.28;
}

function isSupportingClaim(claim: SourceClaim) {
	return (claim.stance ?? 'supports') === 'supports';
}

function getMaxClaimSensitivity(claims: readonly SourceClaim[]) {
	return Math.max(0, ...claims.map((claim) => SOURCE_SENSITIVITY_PRIORS[claim.sensitivity]));
}

function getWeightedConfidence(confidence: ConfidenceScores) {
	return clampScore(
		Object.entries(SOURCE_RANKING_CONFIDENCE_WEIGHTS).reduce(
			(total, [dimension, weight]) =>
				total + confidence[dimension as ConfidenceScoreDimension] * weight,
			0
		)
	);
}

function getSourceWeaknesses(
	scores: { confidence: ConfidenceScores; risk: RiskScores },
	matchedClaims: readonly SourceClaim[]
) {
	const weaknesses: SourceWeakness[] = [];

	for (const [dimension, score] of Object.entries(scores.confidence)) {
		if (score < 0.45) {
			weaknesses.push({
				dimension: dimension as ConfidenceScoreDimension,
				message: getConfidenceWeaknessMessage(dimension as ConfidenceScoreDimension, score, matchedClaims),
				severity: score < 0.25 ? 'high' : 'medium'
			});
		}
	}

	if (scores.risk.sensitivity >= SOURCE_TIER_POLICY.highRisk.minSensitivity) {
		weaknesses.push({
			dimension: 'sensitivity',
			message: 'Source is too sensitive to use without validation or review.',
			severity: 'high'
		});
	}

	return weaknesses;
}

function getConfidenceWeaknessMessage(
	dimension: ConfidenceScoreDimension,
	score: NormalizedScore,
	matchedClaims: readonly SourceClaim[]
) {
	if (dimension === 'completeness' && matchedClaims.length === 0) {
		return 'Source does not answer the required context need.';
	}

	if (dimension === 'freshness') {
		return 'Source may be too stale for confident automation.';
	}

	if (dimension === 'ownershipSignal') {
		return 'Source does not identify a reliable human validator.';
	}

	if (dimension === 'corroboration') {
		return 'Signal is not corroborated by another source.';
	}

	return `${dimension} score is low (${score.toFixed(2)}).`;
}

function toConfidenceScores(
	scoreResults: Record<ConfidenceScoreDimension, ScoreResult<ConfidenceScoreDimension>> & {
		sensitivity: ScoreResult<'sensitivity'>;
	}
) {
	return {
		freshness: scoreResults.freshness.score,
		directness: scoreResults.directness.score,
		authority: scoreResults.authority.score,
		ownershipSignal: scoreResults.ownershipSignal.score,
		completeness: scoreResults.completeness.score,
		corroboration: scoreResults.corroboration.score,
		specificity: scoreResults.specificity.score,
		historicalReliability: scoreResults.historicalReliability.score
	} satisfies ConfidenceScores;
}

function toRiskScores(scoreResults: { sensitivity: ScoreResult<'sensitivity'> }) {
	return {
		sensitivity: scoreResults.sensitivity.score
	} satisfies RiskScores;
}

function toScoreExplanations(
	scoreResults: Record<ConfidenceScoreDimension, ScoreResult<ConfidenceScoreDimension>> & {
		sensitivity: ScoreResult<'sensitivity'>;
	}
) {
	return Object.values(scoreResults).map((result) => ({
		dimension: result.dimension,
		score: result.score,
		reason: result.reason,
		polarity: getScorePolarity(result.dimension, result.score)
	})) satisfies ScoreExplanation[];
}

function getScorePolarity(dimension: SourceScoreDimension, score: NormalizedScore) {
	if (dimension === 'sensitivity') {
		return score >= 0.7 ? 'negative' : score <= 0.35 ? 'positive' : 'neutral';
	}

	return score >= 0.7 ? 'positive' : score < 0.45 ? 'negative' : 'neutral';
}

function describeClaimSupport(claims: readonly SourceClaim[]) {
	const supportKinds = [...new Set(claims.map((claim) => claim.support))];

	return supportKinds.join('/');
}

function clampScore(score: number) {
	return Math.min(
		SOURCE_RANKING_SCORE_RANGE.max,
		Math.max(SOURCE_RANKING_SCORE_RANGE.min, score)
	);
}
