import { EVIDENCE_BUNDLE_AGGREGATION_POLICY } from './policy';
import { assessSourceForContext } from './scoring';
import type {
	ContextSource,
	EvidenceAssessment,
	EvidenceBundle,
	NormalizedScore,
	OwnerSignal,
	SourceAssessment,
	SourceClaim,
	SourceClaimKind,
	SourceTier,
	SourceWeakness
} from './types';

type EvidenceBundleAssessmentInput = {
	bundle: EvidenceBundle;
	now?: number;
};

const SOURCE_TIER_RANK = {
	weak: 0,
	medium: 1,
	strong: 2
} as const satisfies Record<SourceTier, number>;

export function assessEvidenceBundle({
	bundle,
	now = Date.now()
}: EvidenceBundleAssessmentInput): EvidenceAssessment {
	const sourceAssessments = bundle.sources.map((source) =>
		assessSourceForContext({
			contextNeed: bundle.contextNeed,
			source,
			allSources: bundle.sources,
			now
		})
	);
	const bestSourceAssessments = getBestSourceAssessments(sourceAssessments);
	const supportingAssessments = sourceAssessments.filter(
		(assessment) => !bestSourceAssessments.some((best) => best.sourceId === assessment.sourceId)
	);

	return {
		bundleId: bundle.id,
		contextNeedId: bundle.contextNeed.id,
		sourceAssessments,
		strongestTier: getStrongestTier(sourceAssessments),
		aggregateConfidence: getBestSourceWeightedScore(
			bestSourceAssessments,
			supportingAssessments,
			'aggregateConfidence'
		),
		aggregateRisk: getBestSourceWeightedScore(
			bestSourceAssessments,
			supportingAssessments,
			'aggregateRisk'
		),
		bestSourceIds: bestSourceAssessments.map((assessment) => assessment.sourceId),
		likelyOwnerSignals: getLikelyOwnerSignals(sourceAssessments),
		corroboratedClaimKinds: getCorroboratedClaimKinds(bundle.sources),
		conflictingClaimKinds: getConflictingClaimKinds(bundle.sources),
		unresolvedWeaknesses: getUnresolvedWeaknesses(sourceAssessments)
	};
}

function getStrongestTier(sourceAssessments: readonly SourceAssessment[]) {
	return sourceAssessments.reduce<SourceTier | null>((strongestTier, assessment) => {
		if (!strongestTier || SOURCE_TIER_RANK[assessment.tier] > SOURCE_TIER_RANK[strongestTier]) {
			return assessment.tier;
		}

		return strongestTier;
	}, null);
}

function getBestSourceAssessments(sourceAssessments: readonly SourceAssessment[]) {
	const bestScore = Math.max(
		-Infinity,
		...sourceAssessments.map((assessment) => assessment.aggregateConfidence)
	);

	return sourceAssessments.filter((assessment) => assessment.aggregateConfidence === bestScore);
}

function getBestSourceWeightedScore(
	bestSourceAssessments: readonly SourceAssessment[],
	supportingAssessments: readonly SourceAssessment[],
	field: 'aggregateConfidence' | 'aggregateRisk'
) {
	if (bestSourceAssessments.length === 0) {
		return 0;
	}

	const bestSourceScore = averageScores(bestSourceAssessments.map((assessment) => assessment[field]));
	const supportingScore = supportingAssessments.length > 0
		? averageScores(supportingAssessments.map((assessment) => assessment[field]))
		: bestSourceScore;

	return clampScore(
		bestSourceScore * EVIDENCE_BUNDLE_AGGREGATION_POLICY.primaryWeight +
			supportingScore * EVIDENCE_BUNDLE_AGGREGATION_POLICY.supportingWeight
	);
}

function getLikelyOwnerSignals(sourceAssessments: readonly SourceAssessment[]) {
	const ownerSignalsByKey = new Map<string, OwnerSignal>();

	for (const assessment of sourceAssessments) {
		const ownerSignal = assessment.bestOwnerSignal;

		if (!ownerSignal || ownerSignal.kind === 'unknown' || !ownerSignal.owner) {
			continue;
		}

		const existingOwnerSignal = ownerSignalsByKey.get(ownerSignal.owner.id);

		if (!existingOwnerSignal || ownerSignal.confidence > existingOwnerSignal.confidence) {
			ownerSignalsByKey.set(ownerSignal.owner.id, ownerSignal);
		}
	}

	return [...ownerSignalsByKey.values()].sort(
		(first, second) => second.confidence - first.confidence
	);
}

function getCorroboratedClaimKinds(sources: readonly ContextSource[]) {
	const supportingSourceIdsByClaimKind = new Map<SourceClaimKind, Set<string>>();

	for (const source of sources) {
		for (const claim of source.claims) {
			if (!isSupportingClaim(claim) || claim.support === 'weak') {
				continue;
			}

			const sourceIds = supportingSourceIdsByClaimKind.get(claim.kind) ?? new Set<string>();
			sourceIds.add(source.id);
			supportingSourceIdsByClaimKind.set(claim.kind, sourceIds);
		}
	}

	return [...supportingSourceIdsByClaimKind.entries()]
		.filter(([, sourceIds]) => sourceIds.size >= 2)
		.map(([claimKind]) => claimKind);
}

function getConflictingClaimKinds(sources: readonly ContextSource[]) {
	const stancesByClaimKind = new Map<SourceClaimKind, Set<'supports' | 'contradicts'>>();

	for (const source of sources) {
		for (const claim of source.claims) {
			const stances = stancesByClaimKind.get(claim.kind) ?? new Set<'supports' | 'contradicts'>();
			stances.add(getClaimStance(claim));
			stancesByClaimKind.set(claim.kind, stances);
		}
	}

	return [...stancesByClaimKind.entries()]
		.filter(([, stances]) => stances.has('supports') && stances.has('contradicts'))
		.map(([claimKind]) => claimKind);
}

function getUnresolvedWeaknesses(sourceAssessments: readonly SourceAssessment[]) {
	const weaknessesByKey = new Map<string, SourceWeakness>();

	for (const assessment of sourceAssessments) {
		if (assessment.tier === 'strong') {
			continue;
		}

		for (const weakness of assessment.weaknesses) {
			const key = `${weakness.dimension}:${weakness.message}`;
			const existingWeakness = weaknessesByKey.get(key);

			if (!existingWeakness || getSeverityRank(weakness.severity) > getSeverityRank(existingWeakness.severity)) {
				weaknessesByKey.set(key, weakness);
			}
		}
	}

	return [...weaknessesByKey.values()].sort(
		(first, second) => getSeverityRank(second.severity) - getSeverityRank(first.severity)
	);
}

function averageScores(scores: readonly NormalizedScore[]) {
	if (scores.length === 0) {
		return 0;
	}

	return scores.reduce((total, score) => total + score, 0) / scores.length;
}

function getClaimStance(claim: SourceClaim) {
	return claim.stance ?? 'supports';
}

function isSupportingClaim(claim: SourceClaim) {
	return getClaimStance(claim) === 'supports';
}

function getSeverityRank(severity: SourceWeakness['severity']) {
	if (severity === 'high') {
		return 2;
	}

	return severity === 'medium' ? 1 : 0;
}

function clampScore(score: number) {
	return Math.min(1, Math.max(0, score));
}
