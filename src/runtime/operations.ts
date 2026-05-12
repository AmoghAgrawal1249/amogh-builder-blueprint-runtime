import {
	adaptBringTheFirmExample,
	applyBringTheFirmInitialAnswer,
	bringTheFirmManifest,
	getBringTheFirmExamples,
	listBringTheFirmDraftExamples,
	listBringTheFirmExamples,
	routeBringTheFirmBuilderRequest,
	streamBringTheFirmBuilderTurn
} from '$blueprint';
import type { BringTheFirmAiContext } from '$blueprint';
import { buildBuilderRunSetupPromptText } from '@overbase/builder-sdk/app-protocol';
import type {
	BuilderAppBackgroundJobInput,
	BuilderAppContinueTurnInput,
	BuilderAppOutputEvent,
	BuilderAppStartTurnInput,
	BuilderAppState
} from '@overbase/builder-sdk/app-protocol';
import type { EmailDraft, EmailDraftPatch } from '@overbase/builder-sdk/email';
import { BRING_THE_FIRM_DEFAULT_AI_CONTEXT } from '$blueprint/rules';
import type { RuntimeDependencies } from './dependencies';

type EmitEvent = (event: BuilderAppOutputEvent) => Promise<void> | void;

type BringTheFirmAppState = {
	selectedExamplesSlug?: string;
	selectedExampleSlug?: string;
	initialQuestionText?: string;
	aiContext?: BringTheFirmAiContext;
};

type BuilderAppInitialQuestionExample = {
	slug: string;
	description: string;
	questionGuidance: string;
};

type BuilderAppDraftExample = {
	slug: string;
	description: string;
	matchSignals: string[];
	emailDraft: EmailDraft;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getStringField(value: Record<string, unknown>, field: string) {
	const fieldValue = value[field];

	return typeof fieldValue === 'string' ? fieldValue : undefined;
}

function getNonEmptyStringField(value: Record<string, unknown>, field: string) {
	const fieldValue = getStringField(value, field)?.trim();

	return fieldValue ? fieldValue : undefined;
}

function normalizeBringTheFirmAiContext(
	aiContext?: BringTheFirmAiContext
): BringTheFirmAiContext | undefined {
	const normalized = {
		personContext: aiContext?.personContext?.trim() || undefined,
		conversationReason: aiContext?.conversationReason?.trim() || undefined,
		notificationUse: aiContext?.notificationUse?.trim() || undefined
	};

	return Object.values(normalized).some(Boolean) ? normalized : undefined;
}

export function parseBringTheFirmAiContextFromAppState(
	appState?: BuilderAppState
): BringTheFirmAiContext | undefined {
	const value = isRecord(appState?.value) ? appState.value : {};
	const aiContext = isRecord(value.aiContext) ? value.aiContext : {};
	const parsed = {
		personContext: getNonEmptyStringField(aiContext, 'personContext'),
		conversationReason: getNonEmptyStringField(aiContext, 'conversationReason'),
		notificationUse: getNonEmptyStringField(aiContext, 'notificationUse')
	};

	return Object.values(parsed).some(Boolean) ? parsed : undefined;
}

function getBringTheFirmAiContext(appState?: BuilderAppState) {
	const defaultAiContext = normalizeBringTheFirmAiContext(BRING_THE_FIRM_DEFAULT_AI_CONTEXT);
	const appStateAiContext = parseBringTheFirmAiContextFromAppState(appState);

	return normalizeBringTheFirmAiContext({
		...defaultAiContext,
		...appStateAiContext
	});
}

export function getBringTheFirmAppState(appState?: BuilderAppState): BringTheFirmAppState {
	const value = isRecord(appState?.value) ? appState.value : {};

	return {
		selectedExamplesSlug: getStringField(value, 'selectedExamplesSlug'),
		selectedExampleSlug: getStringField(value, 'selectedExampleSlug'),
		initialQuestionText: getStringField(value, 'initialQuestionText'),
		aiContext: getBringTheFirmAiContext(appState)
	};
}

function toInitialQuestionExample(examples: {
	slug: string;
	description: string;
	questionGuidance: string;
}): BuilderAppInitialQuestionExample {
	return {
		slug: examples.slug,
		description: examples.description,
		questionGuidance: examples.questionGuidance
	};
}

function toDraftExample(example: {
	slug: string;
	description: string;
	matchSignals: string[];
	emailDraft: EmailDraft;
}): BuilderAppDraftExample {
	return {
		slug: example.slug,
		description: example.description,
		matchSignals: example.matchSignals,
		emailDraft: example.emailDraft
	};
}

function toAssistantPatchResultEvents(result: {
	text: string;
	patch: EmailDraftPatch | null;
}): BuilderAppOutputEvent[] {
	return [
		{
			type: 'assistantComplete',
			text: result.text.trim() || (result.patch ? 'Updated the draft.' : 'No changes needed.')
		},
		{
			type: 'emailDraftPatch',
			patch: result.patch
		},
		{ type: 'complete' }
	];
}

export function createBringTheFirmRuntime(deps: RuntimeDependencies) {
	async function startTurn(input: BuilderAppStartTurnInput) {
		const fastOpenAIConfig = deps.getOpenAIConfig('fast');
		const examples = listBringTheFirmExamples().map(toInitialQuestionExample);

		if (examples.length === 0) {
			throw new Error('No Bring the firm examples are available.');
		}

		const bringTheFirmState = getBringTheFirmAppState(input.appState);
		const setupPromptText = buildBuilderRunSetupPromptText(input.setup);
		const routeResult = await routeBringTheFirmBuilderRequest({
			setupPromptText,
			examples,
			aiContext: bringTheFirmState.aiContext,
			openAIConfig: fastOpenAIConfig
		});
		const selectedExamples =
			examples.find((candidate) => candidate.slug === routeResult.examplesSlug) ?? examples[0];
		const questionText = routeResult.publicQuestion;

		return [
			{ type: 'assistantComplete', text: questionText },
			{
				type: 'appStatePatch',
				patch: {
					selectedExamplesSlug: selectedExamples.slug,
					initialQuestionText: questionText
				}
			},
			{ type: 'enqueueBackgroundJob' },
			{ type: 'waitForUser' },
			{ type: 'complete' }
		] satisfies BuilderAppOutputEvent[];
	}

	async function continueTurn(input: BuilderAppContinueTurnInput, emit?: EmitEvent) {
		const openAIConfig = deps.getOpenAIConfig();
		const draftState = input.emailDraftState;

		if (draftState?.visibility === 'hidden') {
			const bringTheFirmState = getBringTheFirmAppState(input.appState);
			const setupPromptText = buildBuilderRunSetupPromptText(input.setup);
			const emailDraft = await applyBringTheFirmInitialAnswer({
				setupPromptText,
				initialQuestion: bringTheFirmState.initialQuestionText ?? '',
				initialAnswer: input.userMessage,
				draft: draftState.draft,
				aiContext: bringTheFirmState.aiContext,
				openAIConfig
			});

			return [
				{
					type: 'assistantComplete',
					text: 'I adjusted the draft based on that and put it in the panel.'
				},
				{ type: 'emailDraftSet', emailDraft, visibility: 'visible' },
				{ type: 'complete' }
			] satisfies BuilderAppOutputEvent[];
		}

		if (draftState?.visibility !== 'visible') {
			throw new Error('The visible email draft is unavailable.');
		}

		const result = await streamBringTheFirmBuilderTurn({
			transcript: input.transcript,
			draft: draftState.draft,
			aiContext: getBringTheFirmAppState(input.appState).aiContext,
			openAIConfig,
			handlers: {
				onTextDelta: async (delta) => {
					await emit?.({ type: 'assistantDelta', text: delta });
					await input.handlers.onAssistantDelta?.(delta);
				}
			}
		});

		return toAssistantPatchResultEvents(result);
	}

	async function backgroundJob(input: BuilderAppBackgroundJobInput) {
		const openAIConfig = deps.getOpenAIConfig();
		const bringTheFirmState = getBringTheFirmAppState(input.appState);
		const selectedExamplesSlug = bringTheFirmState.selectedExamplesSlug;

		if (!selectedExamplesSlug) {
			throw new Error('The selected examples are unavailable.');
		}

		const examples = getBringTheFirmExamples(selectedExamplesSlug);

		if (!examples) {
			throw new Error('The selected examples are unavailable.');
		}

		const draftExamples = listBringTheFirmDraftExamples(selectedExamplesSlug).map(toDraftExample);

		if (draftExamples.length === 0) {
			throw new Error('No Bring the firm draft examples are available for these examples.');
		}

		const setupPromptText = buildBuilderRunSetupPromptText(input.setup);
		const adapted = await adaptBringTheFirmExample({
			setupPromptText,
			examples: toInitialQuestionExample(examples),
			draftExamples,
			aiContext: bringTheFirmState.aiContext,
			openAIConfig
		});

		return [
			{
				type: 'emailDraftSet',
				emailDraft: adapted.emailDraft,
				visibility: 'hidden'
			},
			{
				type: 'appStatePatch',
				patch: {
					selectedExampleSlug: adapted.exampleSlug
				}
			},
			{ type: 'complete' }
		] satisfies BuilderAppOutputEvent[];
	}

	return {
		manifest: bringTheFirmManifest,
		startTurn,
		continueTurn,
		backgroundJob
	};
}
