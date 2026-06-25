import { assessEvidenceBundle } from '$domain/source-ranking';
import { sourceRankingFixtures } from '$lib/features/source-ranking/fixtures';
import type {
	ContextSource,
	EvidenceAssessment,
	EvidenceBundle,
	EvidenceFixture,
	EvidenceFixtureDecisionKind,
	SourceAssessment,
	SourceTier
} from '$domain/source-ranking';

export const DEFAULT_EVIDENCE_LAB_NOW_ISO = '2026-06-22T12:00:00.000Z';

type EvidenceLabViewDataInput = {
	fixtureId?: string | null;
	sourceId?: string | null;
	now?: string | number | null;
	hiddenSourceIds?: readonly string[];
	fixtures?: readonly EvidenceFixture[];
};

export type EvidenceLabFixtureSummary = {
	id: string;
	title: string;
	description: string;
	automationDecision: EvidenceFixtureDecisionKind;
	strongestTier: SourceTier;
	sourceCount: number;
	sourceKinds: readonly string[];
	isSelected: boolean;
};

export type EvidenceLabCoverageSummary = {
	totalFixtures: number;
	sourceKinds: readonly string[];
	automationDecisions: readonly EvidenceFixtureDecisionKind[];
	strongestTiers: readonly SourceTier[];
};

export type EvidenceLabSourceRow = {
	source: ContextSource;
	assessment: SourceAssessment | null;
	expectedTier: SourceTier;
	isHidden: boolean;
};

export type EvidenceLabViewData = {
	now: number;
	nowIso: string;
	nowInputValue: string;
	hasSelectedFixture: boolean;
	selectedFixtureId: string | null;
	selectedSourceId: string | null;
	hiddenSourceIds: readonly string[];
	ignoredHiddenSourceIds: readonly string[];
	ignoredSourceId: string | null;
	fixtures: readonly EvidenceLabFixtureSummary[];
	coverage: EvidenceLabCoverageSummary;
	selected: {
		fixture: EvidenceFixture;
		activeBundle: EvidenceBundle;
		assessment: EvidenceAssessment;
		sourceRows: readonly EvidenceLabSourceRow[];
		selectedSourceRow: EvidenceLabSourceRow | null;
		visibleSourceIds: readonly string[];
	};
};

const DECISION_ORDER: EvidenceFixtureDecisionKind[] = [
	'autoHandoff',
	'generateContextRequest',
	'needsUserReview',
	'blocked'
];

const TIER_ORDER: SourceTier[] = ['strong', 'medium', 'weak'];

export function buildEvidenceLabViewData({
	fixtureId,
	sourceId,
	now,
	hiddenSourceIds = [],
	fixtures = sourceRankingFixtures
}: EvidenceLabViewDataInput = {}): EvidenceLabViewData {
	if (fixtures.length === 0) {
		throw new Error('Evidence lab requires at least one fixture.');
	}

	const requestedFixtureId = fixtureId?.trim() || null;
	const explicitFixture = fixtures.find((fixture) => fixture.id === requestedFixtureId) ?? null;
	const hasSelectedFixture = explicitFixture !== null;
	const selectedFixture = explicitFixture ?? fixtures[0];
	const selectedSourceIds = new Set(selectedFixture.sources.map((source) => source.id));
	const requestedSourceId = sourceId?.trim() || null;
	const selectedSourceId = requestedSourceId && selectedSourceIds.has(requestedSourceId)
		? requestedSourceId
		: null;
	const ignoredSourceId = requestedSourceId && !selectedSourceId ? requestedSourceId : null;
	const normalizedHiddenSourceIds = [...new Set(hiddenSourceIds)].filter((sourceId) =>
		selectedSourceIds.has(sourceId)
	);
	const ignoredHiddenSourceIds = [...new Set(hiddenSourceIds)].filter(
		(sourceId) => !selectedSourceIds.has(sourceId)
	);
	const activeSources = selectedFixture.sources.filter(
		(source) => !normalizedHiddenSourceIds.includes(source.id)
	);
	const activeBundle: EvidenceBundle = {
		id: selectedFixture.id,
		title: selectedFixture.title,
		...(selectedFixture.description ? { description: selectedFixture.description } : {}),
		contextNeed: selectedFixture.contextNeed,
		sources: activeSources
	};
	const normalizedNow = normalizeEvidenceLabNow(now);
	const assessment = assessEvidenceBundle({ bundle: activeBundle, now: normalizedNow.now });
	const assessmentsBySourceId = new Map(
		assessment.sourceAssessments.map((sourceAssessment) => [
			sourceAssessment.sourceId,
			sourceAssessment
		])
	);

	const sourceRows = selectedFixture.sources.map((source) => ({
		source,
		assessment: assessmentsBySourceId.get(source.id) ?? null,
		expectedTier: selectedFixture.expected.sourceTiers[source.id] ?? 'weak',
		isHidden: normalizedHiddenSourceIds.includes(source.id)
	}));

	return {
		now: normalizedNow.now,
		nowIso: normalizedNow.nowIso,
		nowInputValue: normalizedNow.nowInputValue,
		hasSelectedFixture,
		selectedFixtureId: hasSelectedFixture ? selectedFixture.id : null,
		selectedSourceId,
		hiddenSourceIds: normalizedHiddenSourceIds,
		ignoredHiddenSourceIds,
		ignoredSourceId,
		fixtures: fixtures.map((fixture) => toFixtureSummary(fixture, hasSelectedFixture ? selectedFixture.id : null)),
		coverage: getCoverageSummary(fixtures),
		selected: {
			fixture: selectedFixture,
			activeBundle,
			assessment,
			visibleSourceIds: activeSources.map((source) => source.id),
			sourceRows,
			selectedSourceRow: selectedSourceId
				? sourceRows.find((row) => row.source.id === selectedSourceId) ?? null
				: null
		}
	};
}

export function parseEvidenceLabHiddenSourceIds(searchParams: URLSearchParams) {
	const values = searchParams.getAll('hide');

	return values.flatMap((value) =>
		value
			.split(',')
			.map((sourceId) => sourceId.trim())
			.filter(Boolean)
	);
}

function normalizeEvidenceLabNow(value: string | number | null | undefined) {
	const parsedNow = parseEvidenceLabNow(value);
	const now = Number.isFinite(parsedNow) ? parsedNow : Date.parse(DEFAULT_EVIDENCE_LAB_NOW_ISO);
	const nowIso = new Date(now).toISOString();

	return {
		now,
		nowIso,
		nowInputValue: nowIso.slice(0, 16)
	};
}

function parseEvidenceLabNow(value: string | number | null | undefined) {
	if (typeof value === 'number') {
		return value;
	}

	const normalizedValue = value?.trim();

	if (!normalizedValue) {
		return Date.parse(DEFAULT_EVIDENCE_LAB_NOW_ISO);
	}

	if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalizedValue)) {
		return Date.parse(`${normalizedValue}:00.000Z`);
	}

	return Date.parse(normalizedValue);
}

function toFixtureSummary(
	fixture: EvidenceFixture,
	selectedFixtureId: string | null
): EvidenceLabFixtureSummary {
	return {
		id: fixture.id,
		title: fixture.title,
		description: fixture.description ?? '',
		automationDecision: fixture.expected.automationDecision,
		strongestTier: fixture.expected.strongestTier,
		sourceCount: fixture.sources.length,
		sourceKinds: getSortedUnique(fixture.sources.map((source) => source.kind)),
		isSelected: fixture.id === selectedFixtureId
	};
}

function getCoverageSummary(fixtures: readonly EvidenceFixture[]): EvidenceLabCoverageSummary {
	return {
		totalFixtures: fixtures.length,
		sourceKinds: getSortedUnique(fixtures.flatMap((fixture) => fixture.sources.map((source) => source.kind))),
		automationDecisions: DECISION_ORDER.filter((decision) =>
			fixtures.some((fixture) => fixture.expected.automationDecision === decision)
		),
		strongestTiers: TIER_ORDER.filter((tier) =>
			fixtures.some((fixture) => fixture.expected.strongestTier === tier)
		)
	};
}

function getSortedUnique(values: readonly string[]) {
	return [...new Set(values)].sort((first, second) => first.localeCompare(second));
}
