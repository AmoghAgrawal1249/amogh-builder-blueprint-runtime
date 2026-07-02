import { describe, expect, it } from 'vitest';
import { sourceRankingFixtures } from '$lib/features/source-ranking/fixtures';
import { assessEvidenceBundle } from './evidence';
import { decideAutomation } from './decide-automation';
import type { EvidenceAssessment, SourceAssessment } from './types';

const NOW = Date.parse('2026-06-22T12:00:00Z');

function getFixture(id: string) {
	const fixture = sourceRankingFixtures.find((candidateFixture) => candidateFixture.id === id);

	expect(fixture).toBeDefined();

	return fixture!;
}

function decideFixture(fixtureId: string) {
	const fixture = getFixture(fixtureId);
	const assessment = assessEvidenceBundle({ bundle: fixture, now: NOW });

	return {
		fixture,
		assessment,
		decision: decideAutomation({ evidenceAssessment: assessment })
	};
}

function getSourceAssessment(assessment: EvidenceAssessment, sourceId: string) {
	const sourceAssessment = assessment.sourceAssessments.find(
		(candidateAssessment) => candidateAssessment.sourceId === sourceId
	);

	expect(sourceAssessment).toBeDefined();

	return sourceAssessment!;
}

function makeConflictUnresolved(assessment: EvidenceAssessment): EvidenceAssessment {
	const oldProposalAssessment = getSourceAssessment(
		assessment,
		'source-acme-old-proposal-timeline-risk'
	);

	return {
		...assessment,
		sourceAssessments: assessment.sourceAssessments.map((sourceAssessment) =>
			sourceAssessment.sourceId === 'source-acme-current-risk-cleared-note'
				? weakenFreshnessAdvantage(sourceAssessment, oldProposalAssessment)
				: sourceAssessment
		)
	};
}

function weakenFreshnessAdvantage(
	strongAssessment: SourceAssessment,
	oldProposalAssessment: SourceAssessment
): SourceAssessment {
	return {
		...strongAssessment,
		aggregateConfidence: oldProposalAssessment.aggregateConfidence + 0.05,
		scores: {
			...strongAssessment.scores,
			confidence: {
				...strongAssessment.scores.confidence,
				freshness: oldProposalAssessment.scores.confidence.freshness + 0.05
			}
		}
	};
}

describe('automation decision engine', () => {
	it('maps every fixture to its expected automation decision', () => {
		for (const fixture of sourceRankingFixtures) {
			const assessment = assessEvidenceBundle({ bundle: fixture, now: NOW });
			const decision = decideAutomation({ evidenceAssessment: assessment });

			expect(decision.kind, fixture.id).toBe(fixture.expected.automationDecision);
			expect(decision.evidenceBundleId).toBe(fixture.id);
			expect(decision.contextNeedId).toBe(fixture.contextNeed.id);
			expect(decision.primarySourceIds, fixture.id).toEqual(fixture.expected.primarySourceIds);
			expect(decision.reason.length).toBeGreaterThan(0);
		}
	});

	it('returns auto handoff with no blockers for strong safe evidence', () => {
		const { decision } = decideFixture('strong-current-account-note');

		expect(decision.kind).toBe('autoHandoff');
		expect(decision.blockers).toEqual([]);
		expect(decision.primarySourceIds).toEqual(['source-acme-crm-note-june']);
	});

	it('returns owner IDs for medium evidence that needs context validation', () => {
		const { decision } = decideFixture('medium-old-proposal-with-owner');

		expect(decision.kind).toBe('generateContextRequest');

		if (decision.kind === 'generateContextRequest') {
			expect(decision.ownerIds).toEqual(['owner-priya-shah']);
		}

		expect(decision.blockers.map((blocker) => blocker.kind)).toContain('missingStrongSource');
	});

	it('does not treat a source uploader as a validation owner', () => {
		const { decision } = decideFixture('weak-similar-client-proposal');

		expect(decision.kind).toBe('needsUserReview');
		expect(decision.primarySourceIds).toEqual(['source-northstar-similar-proposal-2023']);
		expect(decision.blockers.map((blocker) => blocker.kind)).toContain('noLikelyOwner');
	});

	it('routes low-confidence document-author evidence to user review', () => {
		const { decision } = decideFixture('needs-review-document-unclear-owner');

		expect(decision.kind).toBe('needsUserReview');
		expect(decision.blockers.map((blocker) => blocker.kind)).toContain('noLikelyOwner');
	});

	it('blocks weak evidence with no human validation path', () => {
		const { decision } = decideFixture('blocked-generic-deck-no-owner');

		expect(decision.kind).toBe('blocked');
		expect(decision.primarySourceIds).toEqual([]);
		expect(decision.blockers.map((blocker) => blocker.kind)).toContain('noLikelyOwner');
		expect(decision.blockers.some((blocker) => blocker.severity === 'high')).toBe(true);
	});

	it('blocks high-risk ownerless evidence', () => {
		const { decision } = decideFixture('weak-sensitive-partner-deck');

		expect(decision.kind).toBe('blocked');
		expect(decision.blockers.map((blocker) => blocker.kind)).toContain('highRisk');
		expect(decision.blockers.map((blocker) => blocker.kind)).toContain('sensitiveMaterial');
	});

	it('lets fresh strong evidence beat stale weaker conflicting evidence', () => {
		const { decision } = decideFixture('conflict-acme-timeline-risk');

		expect(decision.kind).toBe('autoHandoff');
		expect(decision.primarySourceIds).toEqual(['source-acme-current-risk-cleared-note']);
		expect(decision.blockers).toEqual([]);
	});

	it('routes unresolved conflict to user review', () => {
		const { assessment } = decideFixture('conflict-acme-timeline-risk');
		const unresolvedAssessment = makeConflictUnresolved(assessment);
		const decision = decideAutomation({ evidenceAssessment: unresolvedAssessment });

		expect(decision.kind).toBe('needsUserReview');
		expect(decision.blockers.map((blocker) => blocker.kind)).toContain('conflictingEvidence');
	});
});
