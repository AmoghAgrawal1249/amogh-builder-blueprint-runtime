import type { InlineTextContent } from '$lib/ui/inline-text';

export const FORMAT_STARTER_SELECTION_SKIPPED_ANSWER = '__skipped__';

export type FormatStarterSelectionOption = {
	id: string;
	label: string;
};

export type FormatStarterSelectionQuestion = {
	id: string;
	title: string;
	helpText: string;
	options: readonly FormatStarterSelectionOption[];
};

export type FormatStarterSelectionAnswers = Record<string, string>;

export type FormatStarterSelectionRule = {
	id: string;
	startingPointId: string;
	answers: Partial<FormatStarterSelectionAnswers>;
};

export type GuidedStartingPointSelection = {
	kind: 'guided';
	intro: string;
	infoBar?: {
		label: string;
		content: InlineTextContent;
	};
	questions: readonly FormatStarterSelectionQuestion[];
	rules: readonly FormatStarterSelectionRule[];
};

export type FixedStartingPointSelection = {
	kind: 'fixed-starting-point';
	startingPointId: string;
};

export type FormatStarterSelection =
	| GuidedStartingPointSelection
	| FixedStartingPointSelection;
