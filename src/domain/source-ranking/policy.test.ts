import { describe, expect, it } from 'vitest';
import {
	OWNER_SIGNAL_PRIORS,
	SOURCE_DIRECTNESS_PRIORS,
	EVIDENCE_BUNDLE_AGGREGATION_POLICY,
	SOURCE_FRESHNESS_POLICY,
	SOURCE_KIND_AUTHORITY_PRIORS,
	SOURCE_KIND_RELIABILITY_PRIORS,
	SOURCE_KIND_SENSITIVITY_PRIORS,
	SOURCE_RANKING_CONFIDENCE_WEIGHTS,
	SOURCE_RANKING_SCORE_RANGE,
	SOURCE_SENSITIVITY_PRIORS,
	SOURCE_TIER_POLICY
} from './policy';

function expectNormalizedScore(score: number) {
	expect(score).toBeGreaterThanOrEqual(SOURCE_RANKING_SCORE_RANGE.min);
	expect(score).toBeLessThanOrEqual(SOURCE_RANKING_SCORE_RANGE.max);
}

function expectNormalizedScores(scores: Record<string, number>) {
	for (const score of Object.values(scores)) {
		expectNormalizedScore(score);
	}
}

describe('source ranking policy', () => {
	it('uses normalized confidence weights that sum to one', () => {
		expectNormalizedScores(SOURCE_RANKING_CONFIDENCE_WEIGHTS);

		const totalWeight = Object.values(SOURCE_RANKING_CONFIDENCE_WEIGHTS).reduce(
			(total, weight) => total + weight,
			0
		);

		expect(totalWeight).toBeCloseTo(1, 8);
	});

	it('keeps all source priors in the normalized score range', () => {
		expectNormalizedScores(SOURCE_DIRECTNESS_PRIORS);
		expectNormalizedScores(SOURCE_KIND_AUTHORITY_PRIORS);
		expectNormalizedScores(SOURCE_KIND_RELIABILITY_PRIORS);
		expectNormalizedScores(SOURCE_KIND_SENSITIVITY_PRIORS);
		expectNormalizedScores(OWNER_SIGNAL_PRIORS);
		expectNormalizedScores(SOURCE_SENSITIVITY_PRIORS);
	});

	it('keeps tier thresholds ordered by strictness', () => {
		expect(SOURCE_TIER_POLICY.strong.minConfidence).toBeGreaterThan(
			SOURCE_TIER_POLICY.medium.minConfidence
		);
		expect(SOURCE_TIER_POLICY.strong.maxRisk).toBeLessThan(
			SOURCE_TIER_POLICY.medium.maxRisk
		);
		expect(SOURCE_TIER_POLICY.highRisk.minSensitivity).toBeGreaterThan(
			SOURCE_TIER_POLICY.strong.maxRisk
		);
	});

	it('keeps freshness thresholds in chronological order', () => {
		expect(SOURCE_FRESHNESS_POLICY.recentDays).toBeLessThan(
			SOURCE_FRESHNESS_POLICY.currentDays
		);
		expect(SOURCE_FRESHNESS_POLICY.currentDays).toBeLessThan(
			SOURCE_FRESHNESS_POLICY.agingDays
		);
		expect(SOURCE_FRESHNESS_POLICY.agingDays).toBeLessThan(
			SOURCE_FRESHNESS_POLICY.staleDays
		);
	});

	it('uses a normalized evidence bundle aggregation split', () => {
		expectNormalizedScore(EVIDENCE_BUNDLE_AGGREGATION_POLICY.primaryWeight);
		expectNormalizedScore(EVIDENCE_BUNDLE_AGGREGATION_POLICY.supportingWeight);
		expect(
			EVIDENCE_BUNDLE_AGGREGATION_POLICY.primaryWeight +
				EVIDENCE_BUNDLE_AGGREGATION_POLICY.supportingWeight
		).toBeCloseTo(1, 8);
		expect(EVIDENCE_BUNDLE_AGGREGATION_POLICY.primaryWeight).toBeGreaterThan(
			EVIDENCE_BUNDLE_AGGREGATION_POLICY.supportingWeight
		);
	});
});
