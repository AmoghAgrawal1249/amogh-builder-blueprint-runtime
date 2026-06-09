import {
	FORMAT_STARTER_SELECTION_SKIPPED_ANSWER,
	cloneFormatEmailContent,
	type FormatStarterSelectionAnswers,
	type FormatStarterSelectionRule,
	type GuidedStartingPointSelection
} from '$lib/features/format-starters/domain';
import {
	type FormatStartingPoint,
	type FormatStarter
} from './types';

export function resolveFormatStarterContent(
	formatStarter: FormatStarter,
	answers: FormatStarterSelectionAnswers
): FormatStartingPoint | null {
	const { startingPointSelection } = formatStarter;

	if (startingPointSelection.kind === 'fixed-starting-point') {
		return cloneFormatStartingPointById(formatStarter, startingPointSelection.startingPointId);
	}

	if (!hasAnsweredEveryStartingPointSelectionQuestion(startingPointSelection, answers)) {
		return null;
	}

	let bestRule: FormatStarterSelectionRule | null = null;
	let bestSpecificity = -1;

	// Highest answer specificity wins. Starting point rules with equal specificity keep registry order.
	for (const rule of startingPointSelection.rules) {
		const specificity = getRuleSpecificity(rule, answers);

		if (specificity < 0 || specificity <= bestSpecificity) {
			continue;
		}

		bestRule = rule;
		bestSpecificity = specificity;
	}

	if (!bestRule) {
		return null;
	}

	return cloneFormatStartingPointById(formatStarter, bestRule.startingPointId);
}

function hasAnsweredEveryStartingPointSelectionQuestion(
	startingPointSelection: GuidedStartingPointSelection,
	answers: FormatStarterSelectionAnswers
) {
	return startingPointSelection.questions.every((question) =>
		answers[question.id] === FORMAT_STARTER_SELECTION_SKIPPED_ANSWER ||
		question.options.some((option) => option.id === answers[question.id])
	);
}

function getRuleSpecificity(
	rule: FormatStarterSelectionRule,
	answers: FormatStarterSelectionAnswers
) {
	let specificity = 0;

	for (const [questionId, optionId] of Object.entries(rule.answers)) {
		if (answers[questionId] !== optionId) {
			return -1;
		}

		specificity += 1;
	}

	return specificity;
}

function cloneFormatStartingPoint(
	startingPoint: FormatStartingPoint
): FormatStartingPoint {
	return {
		id: startingPoint.id,
		label: startingPoint.label,
		emailContent: cloneFormatEmailContent(startingPoint.emailContent)
	};
}

function cloneFormatStartingPointById(
	formatStarter: FormatStarter,
	startingPointId: string
) {
	const startingPoint = formatStarter.startingPoints.find((entry) => entry.id === startingPointId);

	return startingPoint ? cloneFormatStartingPoint(startingPoint) : null;
}
