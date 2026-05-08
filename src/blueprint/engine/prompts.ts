import type { EmailDraft } from '@overbase/builder-sdk/email';
import {
	buildGuidedEmailInitialAnswerPrompt,
	buildGuidedEmailInitialQuestionPrompt
} from '../guided-email-workflow';
import { bringTheFirmExamples } from '../examples';
import {
	bringTheFirmGuide,
	BRING_THE_FIRM_DRAFT_RULES,
	BRING_THE_FIRM_REFINEMENT_RULES,
	EXAMPLE_FIDELITY_RULES,
	EXECUTIVE_WRITING_RULES
} from '../rules';

function stringifyPromptData(value: unknown) {
	return JSON.stringify(value, null, 2);
}

function joinPromptLines(lines: readonly string[]) {
	return lines.join('\n');
}

export function buildBringTheFirmInitialDraftPrompt(params: { initialMessage: string }) {
	return {
		systemPrompt: joinPromptLines([
			...BRING_THE_FIRM_DRAFT_RULES,
			EXECUTIVE_WRITING_RULES,
			EXAMPLE_FIDELITY_RULES
		]),
		userPrompt: [
			'Builder app: Bring the firm',
			'Guided questions:',
			stringifyPromptData(bringTheFirmGuide.questions),
			'User answers:',
			params.initialMessage,
			'Example email drafts:',
			stringifyPromptData(bringTheFirmExamples)
		].join('\n\n')
	};
}

export function buildBringTheFirmInitialQuestionPrompt(params: { initialMessage: string }) {
	return buildGuidedEmailInitialQuestionPrompt({
		appTitle: 'Bring the firm',
		initialMessage: params.initialMessage,
		guideQuestions: bringTheFirmGuide.questions
	});
}

export function buildBringTheFirmInitialAnswerPrompt(params: {
	initialMessage: string;
	initialQuestion: string;
	initialAnswer: string;
	draft: EmailDraft;
}) {
	return buildGuidedEmailInitialAnswerPrompt({
		appTitle: 'Bring the firm',
		initialMessage: params.initialMessage,
		initialQuestion: params.initialQuestion,
		initialAnswer: params.initialAnswer,
		draft: params.draft,
		guideQuestions: bringTheFirmGuide.questions,
		draftRules: [
			...BRING_THE_FIRM_DRAFT_RULES,
			EXECUTIVE_WRITING_RULES,
			EXAMPLE_FIDELITY_RULES
		]
	});
}

export function buildBringTheFirmRefinementSystemPrompt() {
	return joinPromptLines([
		...BRING_THE_FIRM_REFINEMENT_RULES,
		EXECUTIVE_WRITING_RULES,
		EXAMPLE_FIDELITY_RULES
	]);
}
