import {
	applyEmailDraftPatch,
	emailDraftJsonSchema,
	emailDraftPatchJsonSchema,
	normalizeEmailDraft,
	type EmailDraft
} from '@overbase/builder-sdk/email';
import type { InitialDraftParams, RefinementParams } from '@overbase/builder-sdk/app-protocol';
import {
	callStructuredTool,
	getOpenAIConfig,
	getOpenAIErrorMessage,
	getOpenAIHeaders,
	OPENAI_RESPONSES_URL,
	STRUCTURED_MAX_OUTPUT_TOKENS,
	supportsReasoningOptions
} from '@overbase/builder-sdk/openai';
import {
	readEmailBuilderTurnStream,
	readOpenAIStream,
	type ChatReplyStreamHandlers,
	type EmailBuilderTurnStreamResult
} from '@overbase/builder-sdk/streams';

const UPDATE_EMAIL_DRAFT_TOOL_NAME = 'update_email_draft';
const APPLY_INITIAL_ANSWER_TOOL_NAME = 'apply_initial_email_answer';
const INITIAL_QUESTION_MAX_OUTPUT_TOKENS = 300;

type GuidedEmailPrompt = {
	systemPrompt: string;
	userPrompt: string;
};

type GuidedRefinementParams = Pick<
	RefinementParams,
	'draft' | 'recentEvents' | 'transcript' | 'handlers'
>;

function stringifyPromptData(value: unknown) {
	return JSON.stringify(value, null, 2);
}

function joinPromptLines(lines: readonly string[]) {
	return lines.join('\n');
}

export function buildGuidedEmailInitialQuestionPrompt(params: {
	appTitle: string;
	initialMessage: string;
	guideQuestions: unknown;
}) {
	return {
		systemPrompt: joinPromptLines([
			"You are Overbase's guided email notification builder.",
			'Ask exactly one concise follow-up question.',
			'Return only the question text.',
			'Write plainly and directly.',
			'Use the guided setup answers as context.',
			'Do not repeat a question the user already answered in setup.',
			'Ask about the least certain important detail needed before showing the first draft.',
			'Prefer details that affect the email trigger, prioritization, recipients, or presentation.',
			'Do not mention examples, hidden drafts, background jobs, JSON, or internal process.'
		]),
		userPrompt: [
			`Builder app: ${params.appTitle}`,
			'Guided setup questions:',
			stringifyPromptData(params.guideQuestions),
			'Guided setup answers:',
			params.initialMessage
		].join('\n\n')
	};
}

export function buildGuidedEmailInitialAnswerPrompt(params: {
	appTitle: string;
	initialMessage: string;
	initialQuestion: string;
	initialAnswer: string;
	draft: EmailDraft;
	guideQuestions: unknown;
	draftRules: readonly string[];
}) {
	return {
		systemPrompt: joinPromptLines([
			'You make the first minor adjustment to a hidden email notification draft after the user answers one follow-up question.',
			'Return the complete updated draft.',
			...params.draftRules,
			'Preserve useful structure from the hidden draft.',
			'Only change fields affected by the answer or obvious fit improvements.',
			'Do not rewrite, paraphrase, or generalize existing email body text unless the answer directly requires changing that text.',
			'Preserve concrete facts already present in the hidden draft unless the answer contradicts them.',
			'If the answer is vague, uncertain, or expresses no preference, do not invent a narrower scope or erase useful draft specifics.',
			'Keep the draft concise and operational.'
		]),
		userPrompt: [
			`Builder app: ${params.appTitle}`,
			'Guided setup questions:',
			stringifyPromptData(params.guideQuestions),
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

export async function streamGuidedEmailInitialQuestion(params: {
	prompt: GuidedEmailPrompt;
	handlers: ChatReplyStreamHandlers;
}) {
	const { apiKey, model, reasoningEffort } = getOpenAIConfig('fast');
	const response = await fetch(OPENAI_RESPONSES_URL, {
		method: 'POST',
		headers: getOpenAIHeaders(apiKey),
		body: JSON.stringify({
			model,
			input: [
				{
					role: 'system',
					content: params.prompt.systemPrompt
				},
				{
					role: 'user',
					content: params.prompt.userPrompt
				}
			],
			...(supportsReasoningOptions(model) ? { reasoning: { effort: reasoningEffort } } : {}),
			max_output_tokens: INITIAL_QUESTION_MAX_OUTPUT_TOKENS,
			store: false,
			stream: true
		})
	});

	if (!response.ok) {
		throw new Error(await getOpenAIErrorMessage(response));
	}

	return await readOpenAIStream(response, params.handlers);
}

export async function createGuidedEmailInitialDraft(params: {
	prompt: GuidedEmailPrompt;
	toolName: string;
	toolDescription: string;
}) {
	const result = await callStructuredTool<{ emailDraft: EmailDraft }>({
		systemPrompt: params.prompt.systemPrompt,
		userPrompt: params.prompt.userPrompt,
		toolName: params.toolName,
		toolDescription: params.toolDescription,
		toolParameters: {
			type: 'object',
			additionalProperties: false,
			properties: {
				emailDraft: emailDraftJsonSchema
			},
			required: ['emailDraft']
		}
	});

	return normalizeEmailDraft(result.emailDraft);
}

export async function applyGuidedEmailInitialAnswer(params: {
	prompt: GuidedEmailPrompt;
	toolDescription: string;
}) {
	const result = await callStructuredTool<{ emailDraft: EmailDraft }>({
		systemPrompt: params.prompt.systemPrompt,
		userPrompt: params.prompt.userPrompt,
		toolName: APPLY_INITIAL_ANSWER_TOOL_NAME,
		toolDescription: params.toolDescription,
		toolParameters: {
			type: 'object',
			additionalProperties: false,
			properties: {
				emailDraft: emailDraftJsonSchema
			},
			required: ['emailDraft']
		}
	});

	return normalizeEmailDraft(result.emailDraft);
}

function buildRefinementUserPrompt(params: {
	draft: EmailDraft;
	recentEvents: RefinementParams['recentEvents'];
}) {
	return [
		'Current visible email draft JSON:',
		JSON.stringify(params.draft),
		params.recentEvents.length > 0
			? ['Recent email draft events:', JSON.stringify(params.recentEvents)].join('\n')
			: 'Recent email draft events: []',
		'Respond to the user in normal text. If the draft should change, call update_email_draft.'
	].join('\n');
}

export async function streamGuidedEmailRefinementTurn(
	params: {
		systemPrompt: string;
	} & GuidedRefinementParams
): Promise<EmailBuilderTurnStreamResult> {
	const { apiKey, model, reasoningEffort } = getOpenAIConfig();
	const response = await fetch(OPENAI_RESPONSES_URL, {
		method: 'POST',
		headers: getOpenAIHeaders(apiKey),
		body: JSON.stringify({
			model,
			input: [
				{
					role: 'system',
					content: params.systemPrompt
				},
				...params.transcript.map((message) => ({
					role: message.role,
					content: message.text
				})),
				{
					role: 'user',
					content: buildRefinementUserPrompt({
						draft: params.draft,
						recentEvents: params.recentEvents
					})
				}
			],
			tools: [
				{
					type: 'function',
					name: UPDATE_EMAIL_DRAFT_TOOL_NAME,
					description: 'Patch the visible email notification draft.',
					parameters: emailDraftPatchJsonSchema,
					strict: true
				}
			],
			parallel_tool_calls: false,
			...(supportsReasoningOptions(model) ? { reasoning: { effort: reasoningEffort } } : {}),
			max_output_tokens: STRUCTURED_MAX_OUTPUT_TOKENS,
			store: false,
			stream: true
		})
	});

	if (!response.ok) {
		throw new Error(await getOpenAIErrorMessage(response));
	}

	const result = await readEmailBuilderTurnStream(response, params.handlers);
	const normalizedDraft = normalizeEmailDraft(params.draft);
	const meaningfulOperations =
		result.patch?.operations.filter((operation) => {
			const nextDraft = applyEmailDraftPatch(params.draft, { operations: [operation] });
			return JSON.stringify(nextDraft) !== JSON.stringify(normalizedDraft);
		}) ?? null;
	const patchIntent = result.patch
		? meaningfulOperations && meaningfulOperations.length > 0
			? 'meaningful'
			: 'noop'
		: 'none';

	return {
		...result,
		patch:
			patchIntent === 'meaningful' && meaningfulOperations
				? {
						operations: meaningfulOperations
					}
				: null,
		patchIntent
	};
}

export type { InitialDraftParams, RefinementParams };
