import type { EmailDraft } from '@overbase/builder-sdk/email';
import {
	BRING_THE_FIRM_EXAMPLE_ADAPTATION_DRAFT_RULES,
	BRING_THE_FIRM_EXAMPLE_ADAPTATION_OPENING_RULES,
	BRING_THE_FIRM_INITIAL_ANSWER_DRAFT_RULES,
	BRING_THE_FIRM_INITIAL_ANSWER_OPENING_RULES,
	BRING_THE_FIRM_REFINEMENT_CHAT_RULES,
	BRING_THE_FIRM_REFINEMENT_DRAFT_RULES,
	BRING_THE_FIRM_ROUTING_RULES,
	EXAMPLE_FIDELITY_RULES,
	EXECUTIVE_WRITING_RULES
} from '../rules';
import type { BringTheFirmExampleCandidate, BringTheFirmExamplesCandidate } from '../types';

function stringifyPromptData(value: unknown) {
	return JSON.stringify(value, null, 2);
}

function joinPromptLines(lines: readonly string[]) {
	return lines.join('\n');
}

export function buildBringTheFirmRoutingPrompt(params: {
	initialMessage: string;
	examples: BringTheFirmExamplesCandidate[];
}) {
	return {
		systemPrompt: joinPromptLines(BRING_THE_FIRM_ROUTING_RULES),
		userPrompt: [
			'Guided setup answers:',
			params.initialMessage,
			'Available examples:',
			stringifyPromptData(params.examples)
		].join('\n\n')
	};
}

export function buildBringTheFirmExampleAdaptationPrompt(params: {
	initialMessage: string;
	examples: BringTheFirmExamplesCandidate;
	draftExamples: BringTheFirmExampleCandidate[];
}) {
	return {
		systemPrompt: joinPromptLines([
			...BRING_THE_FIRM_EXAMPLE_ADAPTATION_OPENING_RULES,
			EXECUTIVE_WRITING_RULES,
			EXAMPLE_FIDELITY_RULES,
			...BRING_THE_FIRM_EXAMPLE_ADAPTATION_DRAFT_RULES
		]),
		userPrompt: [
			'Guided setup answers:',
			params.initialMessage,
			'Selected examples:',
			stringifyPromptData(params.examples),
			'Candidate email examples:',
			stringifyPromptData(params.draftExamples)
		].join('\n\n')
	};
}

export function buildBringTheFirmInitialAnswerPrompt(params: {
	initialMessage: string;
	initialQuestion: string;
	initialAnswer: string;
	draft: EmailDraft;
}) {
	return {
		systemPrompt: joinPromptLines([
			...BRING_THE_FIRM_INITIAL_ANSWER_OPENING_RULES,
			EXECUTIVE_WRITING_RULES,
			EXAMPLE_FIDELITY_RULES,
			...BRING_THE_FIRM_INITIAL_ANSWER_DRAFT_RULES
		]),
		userPrompt: [
			'Guided setup answers:',
			params.initialMessage,
			'Follow-up question:',
			params.initialQuestion,
			'User answer:',
			params.initialAnswer,
			'Hidden draft JSON:',
			stringifyPromptData(params.draft)
		].join('\n\n')
	};
}

export function buildBringTheFirmRefinementSystemPrompt() {
	return joinPromptLines([
		...BRING_THE_FIRM_REFINEMENT_CHAT_RULES,
		EXECUTIVE_WRITING_RULES,
		...BRING_THE_FIRM_REFINEMENT_DRAFT_RULES,
		EXAMPLE_FIDELITY_RULES
	]);
}

export function buildBringTheFirmRefinementUserPrompt(params: {
	draft: EmailDraft;
}) {
	return [
		'Current visible email draft JSON:',
		JSON.stringify(params.draft),
		'Respond to the user in normal text. If the draft should change, call update_email_draft.'
	].join('\n');
}
