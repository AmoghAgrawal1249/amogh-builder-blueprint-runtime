import type { BuilderAppOutputEvent } from '@overbase/builder-sdk/app-protocol';
import {
	applyBuilderHostEvent,
	createInitialBuilderHostState
} from '@overbase/builder-sdk/host';
import {
	bringTheFirmManifest,
	buildGuidedInitialMessage,
	type GuideAnswersByQuestionId,
	type GuideChoiceQuestion,
	type GuideDefinition
} from '$blueprint';
import { postRuntimeEvents } from './post-runtime-events';

export type ChatMessage = {
	id: number;
	role: 'user' | 'assistant';
	text: string;
};

export function createDevHarnessState() {
	const guide: GuideDefinition = bringTheFirmManifest.guide;
	let guideAnswersByQuestionId = $state<GuideAnswersByQuestionId>({});
	let replyText = $state('');
	let messages = $state<ChatMessage[]>([]);
	let hostState = $state(createInitialBuilderHostState());
	let isRunning = $state(false);
	let errorText = $state('');
	let nextMessageId = 1;

	const initialMessage = $derived(
		buildGuidedInitialMessage({
			title: bringTheFirmManifest.title,
			description: bringTheFirmManifest.description,
			guide,
			answersByQuestionId: guideAnswersByQuestionId
		})
	);
	const canStart = $derived(!isRunning && Boolean(initialMessage.trim()));
	const canReply = $derived(!isRunning && Boolean(replyText.trim()) && messages.length > 0);
	const latestAssistantIndex = $derived(
		messages.findLastIndex((message) => message.role === 'assistant')
	);

	function getGuideAnswer(questionId: string) {
		return guideAnswersByQuestionId[questionId] ?? '';
	}

	function setGuideAnswer(questionId: string, value: string) {
		guideAnswersByQuestionId = {
			...guideAnswersByQuestionId,
			[questionId]: value
		};
	}

	function getChoiceCustomAnswer(question: GuideChoiceQuestion) {
		const answer = getGuideAnswer(question.id);

		return question.options.includes(answer) ? '' : answer;
	}

	function resetGuideAnswers() {
		guideAnswersByQuestionId = {};
	}

	function reset() {
		messages = [];
		replyText = '';
		hostState = createInitialBuilderHostState();
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

	function handleRuntimeEvent(event: BuilderAppOutputEvent) {
		if (event.type === 'assistantDelta') {
			appendAssistantDelta(event.text);
			return;
		}

		if (event.type === 'assistantComplete') {
			completeAssistantMessage(event.text);
			return;
		}

		if (event.type === 'fail') {
			errorText = event.errorText;
			return;
		}

		hostState = applyBuilderHostEvent(hostState, event).state;
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
					appState: hostState.appState
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
					emailDraftState: hostState.emailDraftState ?? undefined,
					appState: hostState.appState
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
		get guide() {
			return guide;
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
		get hiddenDraft() {
			return hostState.emailDraftState?.visibility === 'hidden'
				? hostState.emailDraftState.draft
				: null;
		},
		get visibleDraft() {
			return hostState.emailDraftState?.visibility === 'visible'
				? hostState.emailDraftState.draft
				: null;
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
		getGuideAnswer,
		setGuideAnswer,
		getChoiceCustomAnswer,
		resetGuideAnswers,
		reset,
		start,
		sendReply
	};
}

export type DevHarnessState = ReturnType<typeof createDevHarnessState>;
