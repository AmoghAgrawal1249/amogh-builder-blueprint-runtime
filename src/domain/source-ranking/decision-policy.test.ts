import { describe, expect, it } from 'vitest';
import { sourceRankingFixtures } from '$lib/features/source-ranking/fixtures';
import {
	AUTOMATION_DECISION_BLOCKER_KINDS,
	AUTOMATION_DECISION_KINDS,
	AUTOMATION_DECISION_POLICY,
	isAutomationDecisionKind
} from './decision-policy';

describe('automation decision policy scaffold', () => {
	it('defines the four supported automation decision kinds', () => {
		expect(AUTOMATION_DECISION_KINDS).toEqual([
			'autoHandoff',
			'generateContextRequest',
			'needsUserReview',
			'blocked'
		]);
	});

	it('defines blocker kinds needed by the first decision policy', () => {
		expect(AUTOMATION_DECISION_BLOCKER_KINDS).toEqual([
			'missingStrongSource',
			'highRisk',
			'conflictingEvidence',
			'validationRequired',
			'noLikelyOwner',
			'insufficientContext',
			'sensitiveMaterial'
		]);
	});

	it('keeps auto handoff conservative for the first engine implementation', () => {
		expect(AUTOMATION_DECISION_POLICY.autoHandoff.requiresStrongSource).toBe(true);
		expect(AUTOMATION_DECISION_POLICY.autoHandoff.minStrongSourceCount).toBe(1);
		expect(AUTOMATION_DECISION_POLICY.autoHandoff.allowConflicts).toBe(false);
		expect(AUTOMATION_DECISION_POLICY.autoHandoff.allowValidationRequiredClaims).toBe(false);
		expect(AUTOMATION_DECISION_POLICY.autoHandoff.maxAggregateRisk).toBeGreaterThanOrEqual(0);
		expect(AUTOMATION_DECISION_POLICY.autoHandoff.maxAggregateRisk).toBeLessThanOrEqual(1);
	});

	it('captures context-request and review routing rules', () => {
		expect(AUTOMATION_DECISION_POLICY.contextRequest.minSourceTier).toBe('medium');
		expect(AUTOMATION_DECISION_POLICY.contextRequest.requiresLikelyOwner).toBe(true);
		expect(AUTOMATION_DECISION_POLICY.userReview.conflictForcesReview).toBe(true);
		expect(AUTOMATION_DECISION_POLICY.userReview.validationWithoutClearOwnerForcesReview).toBe(true);
		expect(AUTOMATION_DECISION_POLICY.blocked.noOwnerAndWeakEvidenceBlocks).toBe(true);
		expect(AUTOMATION_DECISION_POLICY.blocked.highRiskWithoutValidationPathBlocks).toBe(true);
	});

	it('recognizes supported decision kind strings', () => {
		for (const kind of AUTOMATION_DECISION_KINDS) {
			expect(isAutomationDecisionKind(kind)).toBe(true);
		}

		expect(isAutomationDecisionKind('unsupported')).toBe(false);
	});
});

describe('fixture automation decision truth compatibility', () => {
	it('uses only supported decision kinds in fixture truth labels', () => {
		for (const fixture of sourceRankingFixtures) {
			expect(isAutomationDecisionKind(fixture.expected.automationDecision)).toBe(true);
		}
	});

	it('keeps all decision outcomes represented by fixtures', () => {
		const fixtureDecisionKinds = new Set(
			sourceRankingFixtures.map((fixture) => fixture.expected.automationDecision)
		);

		for (const kind of AUTOMATION_DECISION_KINDS) {
			expect(fixtureDecisionKinds.has(kind)).toBe(true);
		}
	});

	it('keeps decision-specific fixture truth metadata present', () => {
		for (const fixture of sourceRankingFixtures) {
			if (fixture.expected.automationDecision === 'autoHandoff') {
				expect(fixture.expected.primarySourceIds.length).toBeGreaterThan(0);
			}

			if (fixture.expected.automationDecision === 'generateContextRequest') {
				expect(fixture.expected.contextRequestOwnerId).toBeTruthy();
			}

			if (fixture.expected.automationDecision === 'needsUserReview') {
				expect(fixture.expected.reviewPromptKind).toBeTruthy();
			}

			if (fixture.expected.automationDecision === 'blocked') {
				expect(fixture.expected.blockedReason).toBeTruthy();
			}
		}
	});
});
