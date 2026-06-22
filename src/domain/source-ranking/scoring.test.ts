import { describe, expect, it } from 'vitest';
import { sourceRankingFixtures } from '$lib/features/source-ranking/fixtures';
import { assessSourceForContext } from './scoring';
import type {
	ConfidenceScores,
	ContextSource,
	RiskScores,
	SourceAssessment,
	SourceScoreDimension,
	SourceTier
} from './types';

const NOW = Date.parse('2026-06-22T12:00:00Z');

function getFixture(id: string) {
	const fixture = sourceRankingFixtures.find((candidateFixture) => candidateFixture.id === id);

	expect(fixture).toBeDefined();

	return fixture!;
}

function assessFixtureSource(fixtureId: string) {
	const fixture = getFixture(fixtureId);
	const source = fixture.sources[0];

	expect(source).toBeDefined();

	return assessSourceForContext({
		contextNeed: fixture.contextNeed,
		source,
		allSources: fixture.sources,
		now: NOW
	});
}

function expectNormalizedScores(scores: ConfidenceScores | RiskScores) {
	for (const score of Object.values(scores)) {
		expect(score).toBeGreaterThanOrEqual(0);
		expect(score).toBeLessThanOrEqual(1);
	}
}

function expectExplanationDimensions(assessment: SourceAssessment) {
	const dimensions = new Set<SourceScoreDimension>(
		assessment.explanations.map((explanation) => explanation.dimension)
	);

	expect(dimensions).toEqual(
		new Set<SourceScoreDimension>([
			'freshness',
			'directness',
			'authority',
			'ownershipSignal',
			'completeness',
			'corroboration',
			'specificity',
			'historicalReliability',
			'sensitivity'
		])
	);
}

describe('source scoring', () => {
	it.each([
		['strong-current-account-note', 'strong'],
		['medium-old-proposal-with-owner', 'medium'],
		['weak-sensitive-partner-deck', 'weak']
	] satisfies Array<[string, SourceTier]>)('ranks %s as %s', (fixtureId, expectedTier) => {
		const assessment = assessFixtureSource(fixtureId);

		expect(assessment.tier).toBe(expectedTier);
	});

	it('keeps every generated score normalized', () => {
		for (const fixture of sourceRankingFixtures) {
			for (const source of fixture.sources) {
				const assessment = assessSourceForContext({
					contextNeed: fixture.contextNeed,
					source,
					allSources: fixture.sources,
					now: NOW
				});

				expectNormalizedScores(assessment.scores.confidence);
				expectNormalizedScores(assessment.scores.risk);
				expect(assessment.aggregateConfidence).toBeGreaterThanOrEqual(0);
				expect(assessment.aggregateConfidence).toBeLessThanOrEqual(1);
				expect(assessment.aggregateRisk).toBeGreaterThanOrEqual(0);
				expect(assessment.aggregateRisk).toBeLessThanOrEqual(1);
			}
		}
	});

	it('generates an explanation for every score dimension', () => {
		const assessment = assessFixtureSource('strong-current-account-note');

		expectExplanationDimensions(assessment);
		expect(assessment.explanations.every((explanation) => explanation.reason.length > 0)).toBe(true);
	});

	it('matches claims required by the context need', () => {
		const assessment = assessFixtureSource('strong-current-account-note');
		const matchedClaimKinds = assessment.matchedClaims.map((claim) => claim.kind);

		expect(matchedClaimKinds).toContain('implementationRisk');
		expect(matchedClaimKinds).toContain('timelineContext');
	});

	it('creates meaningful weaknesses for weak evidence', () => {
		const assessment = assessFixtureSource('weak-sensitive-partner-deck');
		const weaknessDimensions = assessment.weaknesses.map((weakness) => weakness.dimension);

		expect(assessment.weaknesses.length).toBeGreaterThan(0);
		expect(weaknessDimensions).toContain('ownershipSignal');
		expect(weaknessDimensions).toContain('sensitivity');
		expect(assessment.weaknesses.every((weakness) => weakness.message.length > 0)).toBe(true);
	});

	it('uses injected time to score freshness deterministically', () => {
		const fixture = getFixture('strong-current-account-note');
		const source = fixture.sources[0];
		const freshAssessment = assessSourceForContext({
			contextNeed: fixture.contextNeed,
			source,
			allSources: fixture.sources,
			now: Date.parse('2026-06-15T12:00:00Z')
		});
		const olderAssessment = assessSourceForContext({
			contextNeed: fixture.contextNeed,
			source,
			allSources: fixture.sources,
			now: Date.parse('2027-06-15T12:00:00Z')
		});

		expect(freshAssessment.scores.confidence.freshness).toBeGreaterThan(
			olderAssessment.scores.confidence.freshness
		);
	});

	it('prevents high-sensitivity evidence from being strong even with good confidence', () => {
		const fixture = getFixture('strong-current-account-note');
		const source = fixture.sources[0];
		const highSensitivitySource: ContextSource = {
			...source,
			sensitivity: 'high',
			claims: source.claims.map((claim) => ({ ...claim, sensitivity: 'high' }))
		};
		const assessment = assessSourceForContext({
			contextNeed: fixture.contextNeed,
			source: highSensitivitySource,
			allSources: [highSensitivitySource],
			now: NOW
		});

		expect(assessment.aggregateConfidence).toBeGreaterThanOrEqual(0.78);
		expect(assessment.aggregateRisk).toBeGreaterThan(0.35);
		expect(assessment.tier).not.toBe('strong');
	});
});
