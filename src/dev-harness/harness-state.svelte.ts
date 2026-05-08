import {
	applyEmailDraftPatch,
	type EmailDraft,
	type EmailDraftChangedField,
	type EmailDraftPatch,
	type EmailDraftPatchOperation
} from '@overbase/builder-sdk/email';
import type {
	BuilderAppOutputEvent,
	BuilderAppState
} from '@overbase/builder-sdk/app-protocol';
import { DEFAULT_INITIAL_MESSAGE } from './default-scenario';
import { postRuntimeEvents } from './post-runtime-events';

export type ChatMessage = {
	id: number;
	role: 'user' | 'assistant';
	text: string;
};

type RecentDraftChange = {
	summary: string;
	changedFields: EmailDraftChangedField[];
	createdAt: number;
};

function changedFieldsForPatch(patch: EmailDraftPatch): EmailDraftChangedField[] {
	const fields = patch.operations.map((operation: EmailDraftPatchOperation) => {
		if (operation.type === 'setTo') return 'to';
		if (operation.type === 'setCc') return 'cc';
		if (operation.type === 'setAttachments') return 'attachments';
		if (operation.type === 'setBody') return 'body';
		return 'fireReason';
	});

	return [...new Set(fields)];
}

export function createDevHarnessState() {
	let initialMessage = $state(DEFAULT_INITIAL_MESSAGE);
	let replyText = $state('');
	let messages = $state<ChatMessage[]>([]);
	let preparedDraft = $state<EmailDraft | null>(null);
	let visibleDraft = $state<EmailDraft | null>(null);
	let appState = $state<BuilderAppState>({ version: 1, value: {} });
	let recentDraftChanges = $state<RecentDraftChange[]>([]);
	let isRunning = $state(false);
	let errorText = $state('');
	let nextMessageId = 1;

	const canStart = $derived(!isRunning && Boolean(initialMessage.trim()));
	const canReply = $derived(!isRunning && Boolean(replyText.trim()) && messages.length > 0);
	const latestAssistantIndex = $derived(
		messages.findLastIndex((message) => message.role === 'assistant')
	);

	function reset() {
		messages = [];
		replyText = '';
		preparedDraft = null;
		visibleDraft = null;
		appState = { version: 1, value: {} };
		recentDraftChanges = [];
		errorText = '';
		nextMessageId = 1;
	}

	function createChatMessage(role: ChatMessage['role'], text: string): ChatMessage {
		return {
			id: nextMessageId++,
			role,
			text
		};
	}

	function appendAssistantDelta(delta: string) {
		if (latestAssistantIndex >= 0) {
			const nextMessages = [...messages];
			const current = nextMessages[latestAssistantIndex];
			nextMessages[latestAssistantIndex] = {
				...current,
				text: `${current.text}${delta}`
			};
			messages = nextMessages;
			return;
		}

		messages = [...messages, createChatMessage('assistant', delta)];
	}

	function completeAssistantMessage(text: string) {
		if (!text.trim()) {
			return;
		}

		if (latestAssistantIndex >= 0) {
			const nextMessages = [...messages];
			nextMessages[latestAssistantIndex] = {
				id: nextMessages[latestAssistantIndex].id,
				role: 'assistant',
				text
			};
			messages = nextMessages;
			return;
		}

		messages = [...messages, createChatMessage('assistant', text)];
	}

	function patchAppState(patch: Record<string, unknown>) {
		const currentValue =
			appState.value && typeof appState.value === 'object' && !Array.isArray(appState.value)
				? appState.value
				: {};

		appState = {
			version: appState.version + 1,
			value: {
				...currentValue,
				...patch
			}
		};
	}

	function handleRuntimeEvent(event: BuilderAppOutputEvent) {
		if (event.type === 'assistantDelta') {
			appendAssistantDelta(event.text);
			return;
		}

		if (event.type === 'assistantComplete') {
			completeAssistantMessage(event.text);
			return;
		}

		if (event.type === 'appStateReplace') {
			appState = event.appState;
			return;
		}

		if (event.type === 'appStatePatch') {
			patchAppState(event.patch);
			return;
		}

		if (event.type === 'emailDraftReplace') {
			if (event.visible === false && !visibleDraft) {
				preparedDraft = event.emailDraft;
			} else {
				visibleDraft = event.emailDraft;
			}
			return;
		}

		if (event.type === 'emailDraftPatch' && event.patch && visibleDraft) {
			visibleDraft = applyEmailDraftPatch(visibleDraft, event.patch);
			recentDraftChanges = [
				...recentDraftChanges,
				{
					summary: 'Dev harness applied runtime patch.',
					changedFields: changedFieldsForPatch(event.patch),
					createdAt: Date.now()
				}
			].slice(-5);
			return;
		}

		if (event.type === 'fail') {
			errorText = event.errorText;
		}
	}

	async function runRuntime(body: unknown) {
		await postRuntimeEvents({
			body,
			onEvent: handleRuntimeEvent
		});
	}

	async function start() {
		const normalizedInitialMessage = initialMessage.trim();

		if (!normalizedInitialMessage) {
			return;
		}

		reset();
		isRunning = true;
		messages = [createChatMessage('user', normalizedInitialMessage)];

		try {
			await runRuntime({
				action: 'start',
				input: {
					initialMessage: normalizedInitialMessage,
					appState
				}
			});
		} catch (error) {
			errorText = error instanceof Error ? error.message : 'Runtime request failed.';
		} finally {
			isRunning = false;
		}
	}

	async function sendReply() {
		const userMessage = replyText.trim();

		if (!userMessage) {
			return;
		}

		replyText = '';
		isRunning = true;
		errorText = '';
		messages = [...messages, createChatMessage('user', userMessage)];

		try {
			await runRuntime({
				action: 'continue',
				input: {
					initialMessage,
					userMessage,
					transcript: messages
						.filter((message) => message.text.trim())
						.map((message) => ({
							role: message.role,
							text: message.text
					})),
					emailDraft: visibleDraft ?? undefined,
					preparedEmailDraft: preparedDraft ?? undefined,
					recentEvents: recentDraftChanges,
					appState
				}
			});
		} catch (error) {
			errorText = error instanceof Error ? error.message : 'Runtime request failed.';
		} finally {
			isRunning = false;
		}
	}

	return {
		get initialMessage() {
			return initialMessage;
		},
		set initialMessage(value: string) {
			initialMessage = value;
		},
		get replyText() {
			return replyText;
		},
		set replyText(value: string) {
			replyText = value;
		},
		get messages() {
			return messages;
		},
		get preparedDraft() {
			return preparedDraft;
		},
		get visibleDraft() {
			return visibleDraft;
		},
		get isRunning() {
			return isRunning;
		},
		get errorText() {
			return errorText;
		},
		get canStart() {
			return canStart;
		},
		get canReply() {
			return canReply;
		},
		reset,
		start,
		sendReply
	};
}
