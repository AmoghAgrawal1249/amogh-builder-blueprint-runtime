import { describe, expect, it } from 'vitest';
import { sourceRankingFixtures } from './index';

function expectUniqueIds(ids: readonly string[]) {
	expect(new Set(ids).size).toBe(ids.length);
}

function expectNormalizedScore(score: number) {
	expect(score).toBeGreaterThanOrEqual(0);
	expect(score).toBeLessThanOrEqual(1);
}

describe('source ranking fixtures', () => {
	it('cover strong, medium, and weak expected source tiers', () => {
		const expectedTiers = sourceRankingFixtures.map((fixture) => fixture.expected?.strongestTier);

		expect(expectedTiers).toContain('strong');
		expect(expectedTiers).toContain('medium');
		expect(expectedTiers).toContain('weak');
	});

	it('use unique fixture, source, claim, and context-need ids', () => {
		expectUniqueIds(sourceRankingFixtures.map((fixture) => fixture.id));
		expectUniqueIds(sourceRankingFixtures.map((fixture) => fixture.contextNeed.id));

		const sourceIds = sourceRankingFixtures.flatMap((fixture) =>
			fixture.sources.map((source) => source.id)
		);
		const claimIds = sourceRankingFixtures.flatMap((fixture) =>
			fixture.sources.flatMap((source) => source.claims.map((claim) => claim.id))
		);

		expectUniqueIds(sourceIds);
		expectUniqueIds(claimIds);
	});

	it('only sets expected source tiers for sources that exist in the fixture', () => {
		for (const fixture of sourceRankingFixtures) {
			const sourceIds = new Set<string>(fixture.sources.map((source) => source.id));
			const expectedSourceIds = Object.keys(fixture.expected?.sourceTiers ?? {});

			for (const expectedSourceId of expectedSourceIds) {
				expect(sourceIds.has(expectedSourceId)).toBe(true);
			}
		}
	});

	it('provides at least one claim matching each context need', () => {
		for (const fixture of sourceRankingFixtures) {
			const sourceClaimKinds = new Set(
				fixture.sources.flatMap((source) => source.claims.map((claim) => claim.kind))
			);

			for (const requiredClaimKind of fixture.contextNeed.requiredClaimKinds) {
				expect(sourceClaimKinds.has(requiredClaimKind)).toBe(true);
			}
		}
	});

	it('keeps source dates valid and owner confidence normalized', () => {
		for (const fixture of sourceRankingFixtures) {
			for (const source of fixture.sources) {
				expect(Number.isFinite(source.createdAt)).toBe(true);
				expect(source.createdAt).toBeGreaterThan(0);

				if (source.updatedAt !== undefined) {
					expect(source.updatedAt).toBeGreaterThanOrEqual(source.createdAt);
				}

				for (const ownerSignal of source.ownerSignals) {
					expectNormalizedScore(ownerSignal.confidence);
				}
			}
		}
	});

	it('models weak partner evidence as sensitive and ownerless', () => {
		const weakFixture = sourceRankingFixtures.find(
			(fixture) => fixture.id === 'weak-sensitive-partner-deck'
		);

		expect(weakFixture).toBeDefined();
		expect(weakFixture?.contextNeed.sensitivity).toBe('high');
		expect(weakFixture?.sources[0]?.sensitivity).toBe('high');
		expect(weakFixture?.sources[0]?.ownerSignals[0]?.kind).toBe('unknown');

		const ownerSignal = weakFixture?.sources[0]?.ownerSignals[0];
		const owner = ownerSignal && 'owner' in ownerSignal ? ownerSignal.owner : undefined;

		expect(owner).toBeUndefined();
	});
});
