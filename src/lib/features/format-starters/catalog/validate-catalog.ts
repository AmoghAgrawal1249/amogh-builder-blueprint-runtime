import type {
	FormatEmailContent,
	FormatInlineNode
} from '$lib/features/format-starters/domain';
import { isDataSourceId } from '$lib/features/format-starters/data-sources';
import { hasInlineTextContent } from '$lib/ui/inline-text';
import type { FormatStarter } from './types';
import { FORMAT_STARTER_INDUSTRY_TAGS, isFormatStarterIndustryTagId } from './industry-tags';

export type FormatStarterCatalogValidationIssue = {
	formatStarterSlug?: string;
	message: string;
};

export function validateFormatStarterCatalog(
	entries: readonly FormatStarter[]
): FormatStarterCatalogValidationIssue[] {
	const issues: FormatStarterCatalogValidationIssue[] = [];
	const formatStarterSlugs = new Set<string>();
	const sortOrders = new Map<number, string>();

	for (const entry of entries) {
		if (formatStarterSlugs.has(entry.slug)) {
			issues.push({
				formatStarterSlug: entry.slug,
				message: `Duplicate format starter slug "${entry.slug}".`
			});
		}

		formatStarterSlugs.add(entry.slug);

		const existingSortOrderSlug = sortOrders.get(entry.sortOrder);

		if (existingSortOrderSlug) {
			issues.push({
				formatStarterSlug: entry.slug,
				message: `Duplicate sortOrder "${entry.sortOrder}" also used by format starter "${existingSortOrderSlug}".`
			});
		}

		sortOrders.set(entry.sortOrder, entry.slug);
		validateFormatStarterEntry(issues, entry);
	}

	validateSupportedIndustryCoverage(issues, entries);

	return issues;
}

function validateSupportedIndustryCoverage(
	issues: FormatStarterCatalogValidationIssue[],
	entries: readonly FormatStarter[]
) {
	for (const industryTag of FORMAT_STARTER_INDUSTRY_TAGS) {
		const hasVisibleStarter = entries.some(
			(entry) =>
				entry.showInGallery &&
				entry.industryTags.includes(industryTag.id)
		);

		if (!hasVisibleStarter) {
			issues.push({
				message: `Supported industry "${industryTag.id}" must have at least one visible format starter.`
			});
		}
	}
}

function validateFormatStarterEntry(
	issues: FormatStarterCatalogValidationIssue[],
	entry: FormatStarter
) {
	addDuplicateIdIssues(issues, entry.slug, 'data source', entry.dataSourceIds);
	addDuplicateIdIssues(issues, entry.slug, 'industry tag', entry.industryTags);

	for (const dataSourceId of entry.dataSourceIds) {
		if (!isDataSourceId(dataSourceId)) {
			issues.push({
				formatStarterSlug: entry.slug,
				message: `References unknown data source "${dataSourceId}".`
			});
		}
	}

	if (entry.showInGallery && entry.dataSourceIds.length === 0) {
		issues.push({
			formatStarterSlug: entry.slug,
			message: 'Gallery format starters must define at least one data source.'
		});
	}

	for (const industryTag of entry.industryTags) {
		if (!isFormatStarterIndustryTagId(industryTag)) {
			issues.push({
				formatStarterSlug: entry.slug,
				message: `References unknown industry tag "${industryTag}".`
			});
		}
	}

	addDuplicateIdIssues(
		issues,
		entry.slug,
		'starting point',
		entry.startingPoints.map((startingPoint) => startingPoint.id)
	);
	addDuplicateIdIssues(
		issues,
		entry.slug,
		'variable',
		entry.variables.map((variable) => variable.id)
	);
	validateFormatStarterVariables(issues, entry);

	const startingPointIds = new Set(entry.startingPoints.map((startingPoint) => startingPoint.id));
	const variableIds = new Set(entry.variables.map((variable) => variable.id));

	validateFormatStarterSelection(issues, entry, startingPointIds);

	if (!entry.defaultPresentation.title.trim()) {
		issues.push({
			formatStarterSlug: entry.slug,
			message: 'Default presentation must define a title.'
		});
	}

	if (!entry.defaultPresentation.description.trim()) {
		issues.push({
			formatStarterSlug: entry.slug,
			message: 'Default presentation must define a description.'
		});
	}

	if (!entry.sampleEmail.subject.trim()) {
		issues.push({
			formatStarterSlug: entry.slug,
			message: 'Sample email must define a subject.'
		});
	}

	if (entry.sampleEmail.paragraphs.some((paragraph) => !paragraph.trim())) {
		issues.push({
			formatStarterSlug: entry.slug,
			message: 'Sample email paragraphs must not be blank.'
		});
	}

	for (const startingPoint of entry.startingPoints) {
		for (const variableId of listEmailContentVariableIds(startingPoint.emailContent)) {
			if (!variableIds.has(variableId)) {
				issues.push({
					formatStarterSlug: entry.slug,
					message: `Starting point "${startingPoint.id}" references unknown variable "${variableId}".`
				});
			}
		}
	}
}

function validateFormatStarterVariables(
	issues: FormatStarterCatalogValidationIssue[],
	entry: FormatStarter
) {
	if (entry.variables.length === 0) {
		issues.push({
			formatStarterSlug: entry.slug,
			message: 'Format starters must define at least one variable.'
		});
	}

	for (const variable of entry.variables) {
		if (!variable.id.trim()) {
			issues.push({
				formatStarterSlug: entry.slug,
				message: 'Format starter variables cannot use an empty id.'
			});
		}

		if (!variable.label.trim()) {
			issues.push({
				formatStarterSlug: entry.slug,
				message: `Format starter variable "${variable.id}" must define a label.`
			});
		}
	}
}

function validateFormatStarterSelection(
	issues: FormatStarterCatalogValidationIssue[],
	entry: FormatStarter,
	startingPointIds: ReadonlySet<string>
) {
	const { startingPointSelection } = entry;

	if (startingPointSelection.kind === 'fixed-starting-point') {
		if (!startingPointIds.has(startingPointSelection.startingPointId)) {
			issues.push({
				formatStarterSlug: entry.slug,
				message: `Fixed starting point selection references unknown starting point "${startingPointSelection.startingPointId}".`
			});
		}

		return;
	}

	addDuplicateIdIssues(
		issues,
		entry.slug,
		'question',
		startingPointSelection.questions.map((question) => question.id)
	);
	addDuplicateIdIssues(
		issues,
		entry.slug,
		'starting point rule',
		startingPointSelection.rules.map((rule) => rule.id)
	);

	const questionsById = new Map(
		startingPointSelection.questions.map((question) => [question.id, question])
	);
	const hasFallbackRule = startingPointSelection.rules.some(
		(rule) => Object.keys(rule.answers).length === 0
	);

	if (startingPointSelection.questions.length === 0) {
		issues.push({
			formatStarterSlug: entry.slug,
			message: 'Guided starting point selection must include at least one question.'
		});
	}

	if (!hasFallbackRule) {
		issues.push({
			formatStarterSlug: entry.slug,
			message: 'Missing fallback starting point rule with empty answers.'
		});
	}

	if (
		startingPointSelection.infoBar &&
		(!startingPointSelection.infoBar.label.trim() ||
			!hasInlineTextContent(startingPointSelection.infoBar.content))
	) {
		issues.push({
			formatStarterSlug: entry.slug,
			message: 'Guided starting point selection info bars must define label and content.'
		});
	}

	for (const question of startingPointSelection.questions) {
		if (!question.helpText.trim()) {
			issues.push({
				formatStarterSlug: entry.slug,
				message: `Question "${question.id}" must define help text.`
			});
		}

		addDuplicateIdIssues(
			issues,
			entry.slug,
			`option for question "${question.id}"`,
			question.options.map((option) => option.id)
		);
	}

	for (const rule of startingPointSelection.rules) {
		if (!startingPointIds.has(rule.startingPointId)) {
			issues.push({
				formatStarterSlug: entry.slug,
				message: `Starting point rule "${rule.id}" references unknown starting point "${rule.startingPointId}".`
			});
		}

		for (const [questionId, optionId] of Object.entries(rule.answers)) {
			const question = questionsById.get(questionId);

			if (!question) {
				issues.push({
					formatStarterSlug: entry.slug,
					message: `Starting point rule "${rule.id}" references unknown question "${questionId}".`
				});
				continue;
			}

			if (!question.options.some((option) => option.id === optionId)) {
				issues.push({
					formatStarterSlug: entry.slug,
					message: `Starting point rule "${rule.id}" references unknown option "${optionId}" for question "${questionId}".`
				});
			}
		}
	}
}

function addDuplicateIdIssues(
	issues: FormatStarterCatalogValidationIssue[],
	formatStarterSlug: string,
	kind: string,
	ids: readonly string[]
) {
	const seen = new Set<string>();

	for (const id of ids) {
		if (seen.has(id)) {
			issues.push({ formatStarterSlug, message: `Duplicate ${kind} id "${id}".` });
		}

		seen.add(id);
	}
}

function listEmailContentVariableIds(content: FormatEmailContent) {
	const variableIds = new Set<string>();

	for (const block of content.body) {
		addInlineVariableIds(variableIds, block.content);
	}

	for (const cell of Object.values(content.attachment?.cellsByKey ?? {})) {
		addInlineVariableIds(variableIds, cell);
	}

	return variableIds;
}

function addInlineVariableIds(variableIds: Set<string>, nodes: readonly FormatInlineNode[]) {
	for (const node of nodes) {
		if (node.type === 'variable') {
			variableIds.add(node.variableId);
		}
	}
}
