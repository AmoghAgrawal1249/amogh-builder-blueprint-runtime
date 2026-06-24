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
		const expectedTiers = sourceRankingFixtures.map((fixture) => fixture.expected.strongestTier);

		expect(expectedTiers).toContain('strong');
		expect(expectedTiers).toContain('medium');
		expect(expectedTiers).toContain('weak');
	});

	it('cover every automation decision truth value', () => {
		const decisions = sourceRankingFixtures.map((fixture) => fixture.expected.automationDecision);

		expect(decisions).toContain('autoHandoff');
		expect(decisions).toContain('generateContextRequest');
		expect(decisions).toContain('needsUserReview');
		expect(decisions).toContain('blocked');
	});

	it('cover the source kinds needed by the prototype', () => {
		const sourceKinds = new Set(
			sourceRankingFixtures.flatMap((fixture) => fixture.sources.map((source) => source.kind))
		);

		expect(sourceKinds).toEqual(
			new Set([
				'accountNote',
				'crmNote',
				'deck',
				'document',
				'email',
				'meeting',
				'opportunityNote',
				'partnerMaterial',
				'proposal'
			])
		);
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
			const expectedSourceIds = Object.keys(fixture.expected.sourceTiers);

			expect(expectedSourceIds.sort()).toEqual([...sourceIds].sort());

			for (const expectedSourceId of expectedSourceIds) {
				expect(sourceIds.has(expectedSourceId)).toBe(true);
			}
		}
	});

	it('stores local truth ids that point to real fixture entities', () => {
		for (const fixture of sourceRankingFixtures) {
			const sourceIds = new Set(fixture.sources.map((source) => source.id));
			const claimIds = new Set(
				fixture.sources.flatMap((source) => source.claims.map((claim) => claim.id))
			);
			const ownerIds = new Set(
				fixture.sources.flatMap((source) =>
					source.ownerSignals.flatMap((ownerSignal) =>
						ownerSignal.owner ? [ownerSignal.owner.id] : []
					)
				)
			);

			for (const sourceId of fixture.expected.primarySourceIds) {
				expect(sourceIds.has(sourceId)).toBe(true);
			}

			for (const claimId of fixture.expected.validatedClaimIds) {
				expect(claimIds.has(claimId)).toBe(true);
			}

			for (const claimId of fixture.expected.weakClaimIds) {
				expect(claimIds.has(claimId)).toBe(true);
			}

			for (const ownerId of fixture.expected.likelyOwnerIds) {
				expect(ownerIds.has(ownerId)).toBe(true);
			}

			if (fixture.expected.contextRequestOwnerId) {
				expect(ownerIds.has(fixture.expected.contextRequestOwnerId)).toBe(true);
			}

			for (const claimKind of fixture.expected.corroboratedClaimKinds ?? []) {
				expect(fixture.contextNeed.requiredClaimKinds).toContain(claimKind);
			}

			for (const claimKind of fixture.expected.conflictingClaimKinds ?? []) {
				expect(fixture.contextNeed.requiredClaimKinds).toContain(claimKind);
			}
		}
	});

	it('stores decision-specific truth metadata', () => {
		for (const fixture of sourceRankingFixtures) {
			if (fixture.expected.automationDecision === 'generateContextRequest') {
				expect(fixture.expected.contextRequestOwnerId).toBeTruthy();
			}

			if (fixture.expected.automationDecision === 'needsUserReview') {
				expect(fixture.expected.reviewPromptKind).toBeTruthy();
				expect(fixture.expected.weakClaimIds.length).toBeGreaterThan(0);
			}

			if (fixture.expected.automationDecision === 'blocked') {
				expect(fixture.expected.blockedReason).toBeTruthy();
				expect(fixture.expected.primarySourceIds).toHaveLength(0);
			}

			if (fixture.expected.automationDecision === 'autoHandoff') {
				expect(fixture.expected.primarySourceIds.length).toBeGreaterThan(0);
				expect(fixture.expected.weakClaimIds).toHaveLength(0);
			}

			expect(fixture.expected.notes.length).toBeGreaterThan(0);
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

	it('includes explicit corroboration and conflict truth cases', () => {
		const corroboratedFixture = sourceRankingFixtures.find(
			(fixture) => fixture.id === 'corroborated-acme-client-concern'
		);
		const conflictFixture = sourceRankingFixtures.find(
			(fixture) => fixture.id === 'conflict-acme-timeline-risk'
		);

		expect(corroboratedFixture?.expected.corroboratedClaimKinds).toEqual([
			'clientConcern',
			'implementationRisk'
		]);
		expect(conflictFixture?.expected.conflictingClaimKinds).toEqual(['implementationRisk']);
		expect(
			conflictFixture?.sources.some((source) =>
				source.claims.some((claim) => claim.stance === 'contradicts')
			)
		).toBe(true);
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
