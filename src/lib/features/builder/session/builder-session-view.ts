import type { Doc } from '$convex/_generated/dataModel';

type SessionMessageView = {
	role: 'user' | 'assistant';
	status: 'pending' | 'streaming' | 'complete' | 'failed';
};

export function builderSessionHasActiveAssistant(messages: SessionMessageView[]) {
	return messages.some(
		(message) =>
			message.role === 'assistant' &&
			(message.status === 'pending' || message.status === 'streaming')
	);
}

export function getOptimisticSendingStatus(session: Doc<'builderSessions'>) {
	return session.status === 'waitingForUser' || session.status === 'ready' ? 'working' : session.status;
}

export function getBuilderSessionMessagingView(params: {
	session: Doc<'builderSessions'> | null;
	messages: SessionMessageView[];
	queryError?: Error | null;
	hasHandle: boolean;
}) {
	const hasActiveAssistant = builderSessionHasActiveAssistant(params.messages);

	return {
		hasActiveAssistant,
		canSendMessage:
			params.hasHandle &&
			!hasActiveAssistant &&
			!params.queryError &&
			Boolean(params.session) &&
			!params.session?.errorText &&
			(params.session?.status === 'waitingForUser' || params.session?.status === 'ready')
	};
}

export function getBuilderSessionEmailDraftView(session: Doc<'builderSessions'> | null) {
	const emailDraft = session?.emailDraft ?? null;

	return {
		emailDraft,
		canEditEmailDraft: Boolean(
			session &&
				emailDraft &&
				session.status === 'ready' &&
				!session.activeTurnJobId
		)
	};
}
