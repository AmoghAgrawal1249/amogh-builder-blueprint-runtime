import { describe, expect, it } from 'vitest';
import { sourceRankingFixtures } from '$lib/features/source-ranking/fixtures';
import { assessEvidenceBundle } from './evidence';

const NOW = Date.parse('2026-06-22T12:00:00Z');

function getFixture(id: string) {
	const fixture = sourceRankingFixtures.find((candidateFixture) => candidateFixture.id === id);

	expect(fixture).toBeDefined();

	return fixture!;
}

describe('evidence bundle assessment', () => {
	it('assesses every source in the bundle', () => {
		for (const bundle of sourceRankingFixtures) {
			const assessment = assessEvidenceBundle({ bundle, now: NOW });

			expect(assessment.sourceAssessments).toHaveLength(bundle.sources.length);
			expect(assessment.bundleId).toBe(bundle.id);
			expect(assessment.contextNeedId).toBe(bundle.contextNeed.id);
		}
	});

	it('keeps aggregate confidence and risk normalized', () => {
		for (const bundle of sourceRankingFixtures) {
			const assessment = assessEvidenceBundle({ bundle, now: NOW });

			expect(assessment.aggregateConfidence).toBeGreaterThanOrEqual(0);
			expect(assessment.aggregateConfidence).toBeLessThanOrEqual(1);
			expect(assessment.aggregateRisk).toBeGreaterThanOrEqual(0);
			expect(assessment.aggregateRisk).toBeLessThanOrEqual(1);
		}
	});

	it('matches strongest tier truth values without producing automation decisions', () => {
		for (const bundle of sourceRankingFixtures) {
			const assessment = assessEvidenceBundle({ bundle, now: NOW });

			expect(assessment.strongestTier).toBe(bundle.expected.strongestTier);
			expect('automationDecision' in assessment).toBe(false);
		}
	});

	it('detects claim-kind corroboration across multiple sources', () => {
		const bundle = getFixture('corroborated-acme-client-concern');
		const assessment = assessEvidenceBundle({ bundle, now: NOW });

		expect(assessment.corroboratedClaimKinds).toEqual(['clientConcern', 'implementationRisk']);
		expect(assessment.conflictingClaimKinds).toEqual([]);
	});

	it('detects claim-kind conflicts from claim stance', () => {
		const bundle = getFixture('conflict-acme-timeline-risk');
		const assessment = assessEvidenceBundle({ bundle, now: NOW });

		expect(assessment.conflictingClaimKinds).toEqual(['implementationRisk']);
		expect(assessment.corroboratedClaimKinds).toEqual([]);
	});

	it('orders and dedupes likely owner signals by confidence', () => {
		const bundle = getFixture('conflict-acme-timeline-risk');
		const assessment = assessEvidenceBundle({ bundle, now: NOW });
		const ownerIds = assessment.likelyOwnerSignals.map((ownerSignal) => ownerSignal.owner?.id);

		expect(ownerIds).toEqual(['owner-sarah-chen', 'owner-priya-shah']);
	});

	it('surfaces unresolved weaknesses from non-strong sources', () => {
		const bundle = getFixture('weak-sensitive-partner-deck');
		const assessment = assessEvidenceBundle({ bundle, now: NOW });

		expect(assessment.unresolvedWeaknesses.length).toBeGreaterThan(0);
		expect(assessment.unresolvedWeaknesses.map((weakness) => weakness.dimension)).toContain(
			'sensitivity'
		);
	});

	it('uses best-source weighted aggregation instead of a plain average', () => {
		const bundle = getFixture('conflict-acme-timeline-risk');
		const assessment = assessEvidenceBundle({ bundle, now: NOW });
		const plainAverage =
			assessment.sourceAssessments.reduce(
				(total, sourceAssessment) => total + sourceAssessment.aggregateConfidence,
				0
			) / assessment.sourceAssessments.length;

		expect(assessment.bestSourceIds).toEqual(['source-acme-current-risk-cleared-note']);
		expect(assessment.aggregateConfidence).toBeGreaterThan(plainAverage);
	});
});
