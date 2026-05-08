import {
	adaptBringTheFirmExample,
	applyBringTheFirmInitialAnswer,
	bringTheFirmManifest,
	getBringTheFirmExamples,
	listBringTheFirmDraftExamples,
	listBringTheFirmExamples,
	routeBringTheFirmBuilderRequest,
	streamBringTheFirmBuilderTurn,
	streamBringTheFirmInitialQuestion
} from '$blueprint';
import type {
	BuilderAppBackgroundJobInput,
	BuilderAppContinueTurnInput,
	BuilderAppOutputEvent,
	BuilderAppStartTurnInput,
	BuilderAppState
} from '@overbase/builder-sdk/app-protocol';
import type { EmailDraft, EmailDraftPatch } from '@overbase/builder-sdk/email';

type EmitEvent = (event: BuilderAppOutputEvent) => Promise<void> | void;

type BringTheFirmAppState = {
	selectedExamplesSlug?: string;
	selectedExampleSlug?: string;
	initialQuestionText?: string;
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

function getBringTheFirmAppState(appState?: BuilderAppState): BringTheFirmAppState {
	const value = isRecord(appState?.value) ? appState.value : {};

	return {
		selectedExamplesSlug: getStringField(value, 'selectedExamplesSlug'),
		selectedExampleSlug: getStringField(value, 'selectedExampleSlug'),
		initialQuestionText: getStringField(value, 'initialQuestionText')
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
	patchIntent: 'none' | 'noop' | 'meaningful';
}): BuilderAppOutputEvent[] {
	return [
		{
			type: 'assistantComplete',
			text:
				result.text.trim() ||
				(result.patchIntent === 'meaningful'
					? 'Updated the draft.'
					: result.patchIntent === 'noop'
						? 'No changes needed.'
						: '')
		},
		{
			type: 'emailDraftPatch',
			patch: result.patch,
			patchIntent: result.patchIntent
		},
		{ type: 'complete' }
	];
}

export async function startTurn(input: BuilderAppStartTurnInput, emit?: EmitEvent) {
	const examples = listBringTheFirmExamples().map(toInitialQuestionExample);

	if (examples.length === 0) {
		throw new Error('No Bring the firm examples are available.');
	}

	const routeResult = await routeBringTheFirmBuilderRequest({
		initialMessage: input.initialMessage,
		examples
	});
	const selectedExamples =
		examples.find((candidate) => candidate.slug === routeResult.examplesSlug) ?? examples[0];
	const questionText = await streamBringTheFirmInitialQuestion({
		initialMessage: input.initialMessage,
		examples: selectedExamples,
		proposedQuestion: routeResult.question,
		handlers: {
			onDelta: async (delta) => {
				await emit?.({ type: 'assistantDelta', text: delta });
				await input.handlers.onAssistantDelta?.(delta);
			}
		}
	});

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

export async function continueTurn(input: BuilderAppContinueTurnInput, emit?: EmitEvent) {
	if (!input.emailDraft && input.preparedEmailDraft) {
		const bringTheFirmState = getBringTheFirmAppState(input.appState);
		const emailDraft = await applyBringTheFirmInitialAnswer({
			initialMessage: input.initialMessage,
			initialQuestion: bringTheFirmState.initialQuestionText ?? '',
			initialAnswer: input.userMessage,
			draft: input.preparedEmailDraft
		});

		return [
			{
				type: 'assistantComplete',
				text: 'I adjusted the draft based on that and put it in the panel.'
			},
			{ type: 'emailDraftReplace', emailDraft },
			{ type: 'complete' }
		] satisfies BuilderAppOutputEvent[];
	}

	if (!input.emailDraft) {
		throw new Error('The visible email draft is unavailable.');
	}

	const result = await streamBringTheFirmBuilderTurn({
		transcript: input.transcript,
		draft: input.emailDraft,
		recentEvents: input.recentEvents,
		handlers: {
			onTextDelta: async (delta) => {
				await emit?.({ type: 'assistantDelta', text: delta });
				await input.handlers.onAssistantDelta?.(delta);
			}
		}
	});

	return toAssistantPatchResultEvents(result);
}

export async function backgroundJob(input: BuilderAppBackgroundJobInput) {
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

	const adapted = await adaptBringTheFirmExample({
		initialMessage: input.initialMessage,
		examples: toInitialQuestionExample(examples),
		draftExamples
	});

	return [
		{
			type: 'emailDraftReplace',
			emailDraft: adapted.emailDraft,
			visible: false
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

export const runtime = {
	manifest: bringTheFirmManifest,
	startTurn,
	continueTurn,
	backgroundJob
};
