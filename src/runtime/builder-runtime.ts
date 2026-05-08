import { bringTheFirmApp, bringTheFirmCatalog } from '../external/bring-the-firm';
import type {
	BuilderAppBackgroundJobInput,
	BuilderAppContinueTurnInput,
	BuilderAppOutputEvent,
	BuilderAppStartTurnInput,
	BuilderAppState
} from '@overbase/builder-sdk/app-protocol';
import type { EmailDraftPatch } from '@overbase/builder-sdk/email';

type EmitEvent = (event: BuilderAppOutputEvent) => Promise<void> | void;

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getStringField(value: Record<string, unknown>, field: string) {
	const fieldValue = value[field];

	return typeof fieldValue === 'string' ? fieldValue : undefined;
}

function getInitialQuestionText(appState?: BuilderAppState) {
	const value = isRecord(appState?.value) ? appState.value : {};

	return getStringField(value, 'initialQuestionText') ?? '';
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

export const bringTheFirmManifest = bringTheFirmCatalog;

export async function startTurn(input: BuilderAppStartTurnInput, emit?: EmitEvent) {
	const questionText = await bringTheFirmApp.createInitialQuestion({
		initialMessage: input.initialMessage,
		handlers: {
			onAssistantDelta: async (delta) => {
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
		const emailDraft = await bringTheFirmApp.applyInitialAnswer({
			initialMessage: input.initialMessage,
			initialQuestion: getInitialQuestionText(input.appState),
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

	const result = await bringTheFirmApp.streamRefinementTurn({
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
	const emailDraft = await bringTheFirmApp.createInitialDraft({
		initialMessage: input.initialMessage
	});

	return [
		{
			type: 'emailDraftReplace',
			emailDraft,
			visible: false
		},
		{ type: 'complete' }
	] satisfies BuilderAppOutputEvent[];
}
