import { describe, expect, it } from 'vitest';
import {
	DEFAULT_EVIDENCE_LAB_NOW_ISO,
	buildEvidenceLabViewData,
	parseEvidenceLabHiddenSourceIds
} from './evidence-lab-view-data';

describe('evidence lab view data', () => {
	it('shows the first fixture data by default without opening the dashboard', () => {
		const viewData = buildEvidenceLabViewData();

		expect(viewData.hasSelectedFixture).toBe(false);
		expect(viewData.selectedFixtureId).toBe(null);
		expect(viewData.nowIso).toBe(DEFAULT_EVIDENCE_LAB_NOW_ISO);
		expect(viewData.selected.assessment.sourceAssessments.length).toBe(
			viewData.selected.fixture.sources.length
		);
	});

	it('falls back safely for unknown fixture ids and invalid dates', () => {
		const viewData = buildEvidenceLabViewData({
			fixtureId: 'missing-fixture',
			now: 'not-a-date'
		});

		expect(viewData.hasSelectedFixture).toBe(false);
		expect(viewData.selectedFixtureId).toBe(null);
		expect(viewData.nowIso).toBe(DEFAULT_EVIDENCE_LAB_NOW_ISO);
	});

	it('opens the dashboard when a valid fixture id is selected', () => {
		const viewData = buildEvidenceLabViewData({ fixtureId: 'conflict-acme-timeline-risk' });

		expect(viewData.hasSelectedFixture).toBe(true);
		expect(viewData.selectedFixtureId).toBe('conflict-acme-timeline-risk');
		expect(viewData.fixtures.find((fixture) => fixture.id === 'conflict-acme-timeline-risk')?.isSelected).toBe(true);
	});

	it('lets now-date affect freshness through the assessed output', () => {
		const freshViewData = buildEvidenceLabViewData({
			fixtureId: 'strong-current-account-note',
			now: '2026-06-15T12:00'
		});
		const staleViewData = buildEvidenceLabViewData({
			fixtureId: 'strong-current-account-note',
			now: '2027-06-15T12:00'
		});
		const freshScore = freshViewData.selected.assessment.sourceAssessments[0]?.scores.confidence.freshness ?? 0;
		const staleScore = staleViewData.selected.assessment.sourceAssessments[0]?.scores.confidence.freshness ?? 0;

		expect(freshScore).toBeGreaterThan(staleScore);
	});

	it('hides selected sources from the assessed bundle', () => {
		const viewData = buildEvidenceLabViewData({
			fixtureId: 'corroborated-acme-client-concern',
			hiddenSourceIds: ['source-acme-meeting-notes-readiness']
		});

		expect(viewData.hiddenSourceIds).toEqual(['source-acme-meeting-notes-readiness']);
		expect(viewData.selected.visibleSourceIds).toEqual(['source-acme-proposal-decision-feedback']);
		expect(viewData.selected.assessment.sourceAssessments).toHaveLength(1);
		expect(viewData.selected.sourceRows.find((row) => row.source.id === 'source-acme-meeting-notes-readiness')?.isHidden).toBe(true);
	});

	it('selects a source reader row when source id exists', () => {
		const viewData = buildEvidenceLabViewData({
			fixtureId: 'corroborated-acme-client-concern',
			sourceId: 'source-acme-proposal-decision-feedback'
		});

		expect(viewData.selectedSourceId).toBe('source-acme-proposal-decision-feedback');
		expect(viewData.ignoredSourceId).toBe(null);
		expect(viewData.selected.selectedSourceRow?.source.title).toBe('Acme final proposal decision feedback');
	});

	it('ignores source reader ids that are not in the selected fixture', () => {
		const viewData = buildEvidenceLabViewData({
			fixtureId: 'corroborated-acme-client-concern',
			sourceId: 'source-not-in-fixture'
		});

		expect(viewData.selectedSourceId).toBe(null);
		expect(viewData.ignoredSourceId).toBe('source-not-in-fixture');
		expect(viewData.selected.selectedSourceRow).toBe(null);
	});

	it('removes corroboration when a corroborating source is hidden', () => {
		const fullViewData = buildEvidenceLabViewData({
			fixtureId: 'corroborated-acme-client-concern'
		});
		const filteredViewData = buildEvidenceLabViewData({
			fixtureId: 'corroborated-acme-client-concern',
			hiddenSourceIds: ['source-acme-meeting-notes-readiness']
		});

		expect(fullViewData.selected.assessment.corroboratedClaimKinds).toEqual([
			'clientConcern',
			'implementationRisk'
		]);
		expect(filteredViewData.selected.assessment.corroboratedClaimKinds).toEqual([]);
	});

	it('returns dashboard coverage for fixtures, source kinds, decisions, and tiers', () => {
		const viewData = buildEvidenceLabViewData();

		expect(viewData.coverage.totalFixtures).toBeGreaterThanOrEqual(10);
		expect(viewData.coverage.sourceKinds).toContain('proposal');
		expect(viewData.coverage.sourceKinds).toContain('partnerMaterial');
		expect(viewData.coverage.automationDecisions).toEqual([
			'autoHandoff',
			'generateContextRequest',
			'needsUserReview',
			'blocked'
		]);
		expect(viewData.coverage.strongestTiers).toEqual(['strong', 'medium', 'weak']);
	});

	it('preserves selected fixture truth metadata', () => {
		const viewData = buildEvidenceLabViewData({ fixtureId: 'conflict-acme-timeline-risk' });

		expect(viewData.selected.fixture.expected.conflictingClaimKinds).toEqual(['implementationRisk']);
		expect(viewData.selected.assessment.conflictingClaimKinds).toEqual(['implementationRisk']);
	});

	it('keeps aggregate confidence and risk normalized', () => {
		const viewData = buildEvidenceLabViewData({ fixtureId: 'conflict-acme-timeline-risk' });

		expect(viewData.selected.assessment.aggregateConfidence).toBeGreaterThanOrEqual(0);
		expect(viewData.selected.assessment.aggregateConfidence).toBeLessThanOrEqual(1);
		expect(viewData.selected.assessment.aggregateRisk).toBeGreaterThanOrEqual(0);
		expect(viewData.selected.assessment.aggregateRisk).toBeLessThanOrEqual(1);
	});

	it('parses comma and repeated hide params', () => {
		const searchParams = new URLSearchParams([
			['hide', 'source-a,source-b'],
			['hide', 'source-c']
		]);

		expect(parseEvidenceLabHiddenSourceIds(searchParams)).toEqual([
			'source-a',
			'source-b',
			'source-c'
		]);
	});
});
