import { api } from '$convex/_generated/api';
import type { Doc, Id } from '$convex/_generated/dataModel';
import type { EmailDraft } from '@overbase/builder-sdk/email';
import { useConvexClient, useQuery } from 'convex-svelte';
import {
	getBuilderSessionMessagingView,
	getOptimisticSendingStatus
} from './builder-session-view';

export type BuilderSessionHandle = {
	sessionId: Id<'builderSessions'>;
	resumeToken: string;
	appSlug: string;
	expiresAt: number;
};

export type BuilderSessionMessage = {
	_id: string;
	role: 'user' | 'assistant';
	text: string;
	status: 'pending' | 'streaming' | 'complete' | 'failed';
	jobId?: string;
	errorText?: string;
};

export type BuilderSessionSnapshot = {
	handle: BuilderSessionHandle | null;
	session: Doc<'builderSessions'> | null;
	messages: BuilderSessionMessage[];
};

type ServerBuilderSessionSnapshot = {
	handle: BuilderSessionHandle;
	session: Doc<'builderSessions'>;
	messages: Doc<'builderSessionMessages'>[];
};

type StoredBuilderSessionHandle = Omit<BuilderSessionHandle, 'sessionId'> & {
	sessionId: string;
};

const BUILDER_SESSION_STORAGE_VERSION = 2;

function getStorageKey(appSlug: string) {
	return `overbase:builder-session:v${BUILDER_SESSION_STORAGE_VERSION}:${appSlug}`;
}

function getLegacyStorageKey(appSlug: string) {
	return `overbase:builder-session:${appSlug}`;
}

function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : 'Something went wrong.';
}

function parseStoredHandle(value: unknown): BuilderSessionHandle | null {
	if (!value || typeof value !== 'object') {
		return null;
	}

	const candidate = value as Record<string, unknown>;

	if (
		typeof candidate.sessionId !== 'string' ||
		typeof candidate.resumeToken !== 'string' ||
		typeof candidate.appSlug !== 'string' ||
		typeof candidate.expiresAt !== 'number' ||
		!candidate.sessionId ||
		!candidate.resumeToken ||
		!candidate.appSlug ||
		candidate.expiresAt <= Date.now()
	) {
		return null;
	}

	return candidate as StoredBuilderSessionHandle as BuilderSessionHandle;
}

function readStoredHandle(appSlug: string) {
	if (typeof sessionStorage === 'undefined') {
		return null;
	}

	try {
		return parseStoredHandle(JSON.parse(sessionStorage.getItem(getStorageKey(appSlug)) ?? 'null'));
	} catch {
		return null;
	}
}

function writeStoredHandle(handle: BuilderSessionHandle) {
	if (typeof sessionStorage !== 'undefined') {
		sessionStorage.setItem(getStorageKey(handle.appSlug), JSON.stringify(handle));
	}
}

function clearStoredHandle(appSlug: string) {
	if (typeof sessionStorage !== 'undefined') {
		sessionStorage.removeItem(getStorageKey(appSlug));
		sessionStorage.removeItem(getLegacyStorageKey(appSlug));
	}
}

function toUiSnapshot(snapshot: ServerBuilderSessionSnapshot): BuilderSessionSnapshot {
	return {
		handle: snapshot.handle,
		session: snapshot.session,
		messages: snapshot.messages
	};
}

function createInitialSnapshot(initialMessage: string): BuilderSessionSnapshot | null {
	const normalizedInitialMessage = initialMessage.trim();

	if (!normalizedInitialMessage) {
		return null;
	}

	return {
		handle: null,
		session: null,
		messages: [
			{
				_id: 'local-initial-user',
				role: 'user',
				text: normalizedInitialMessage,
				status: 'complete'
			},
			{
				_id: 'local-initial-assistant',
				role: 'assistant',
				text: '',
				status: 'pending'
			}
		]
	};
}

function getSnapshotUpdatedAt(snapshot: BuilderSessionSnapshot) {
	return snapshot.session?.updatedAt ?? 0;
}

function createLocalMessageId(prefix: string) {
	return `${prefix}-${crypto.randomUUID()}`;
}

function chooseSnapshot(
	localSnapshot: BuilderSessionSnapshot | null,
	liveSnapshot: BuilderSessionSnapshot | null
) {
	if (!localSnapshot) {
		return liveSnapshot;
	}

	if (!liveSnapshot) {
		return localSnapshot;
	}

	if (liveSnapshot.messages.length < localSnapshot.messages.length) {
		return localSnapshot;
	}

	if (getSnapshotUpdatedAt(liveSnapshot) < getSnapshotUpdatedAt(localSnapshot)) {
		return localSnapshot;
	}

	return liveSnapshot;
}

export function createBuilderSessionController(
	appSlug: string,
	readInitialMessage: () => string = () => ''
) {
	const client = useConvexClient();
	const initialSnapshot = createInitialSnapshot(readInitialMessage());
	let handle = $state<BuilderSessionHandle | null>(null);
	let localSnapshot = $state<BuilderSessionSnapshot | null>(initialSnapshot);
	let error = $state<string | null>(null);
	let jobVersion = 0;

	const liveSnapshotQuery = useQuery(api.builderSessions.getSessionSnapshot, () =>
		handle ? { sessionId: handle.sessionId, resumeToken: handle.resumeToken } : 'skip'
	);
	const liveSnapshot = $derived(liveSnapshotQuery.data ? toUiSnapshot(liveSnapshotQuery.data) : null);
	const snapshot = $derived(chooseSnapshot(localSnapshot, liveSnapshot));
	const messages = $derived(snapshot?.messages ?? []);
	const session = $derived(snapshot?.session ?? null);
	const messagingView = $derived(
		getBuilderSessionMessagingView({
			session,
			messages,
			queryError: liveSnapshotQuery.error ?? null,
			hasHandle: Boolean(handle)
		})
	);

	function isCurrentJob(version: number) {
		return version === jobVersion;
	}

	function setServerSnapshot(nextSnapshot: ServerBuilderSessionSnapshot) {
		const uiSnapshot = toUiSnapshot(nextSnapshot);
		handle = nextSnapshot.handle;
		localSnapshot = uiSnapshot;
		writeStoredHandle(nextSnapshot.handle);
	}

	function clearLocal() {
		handle = null;
		localSnapshot = null;
		error = null;
		clearStoredHandle(appSlug);
	}

	async function start(message?: string) {
		const normalizedInitialMessage = (message ?? readInitialMessage()).trim();

		if (!normalizedInitialMessage) {
			throw new Error('Message text is required.');
		}

		const job = (jobVersion += 1);
		error = null;
		handle = null;
		localSnapshot = localSnapshot ?? createInitialSnapshot(normalizedInitialMessage);

		try {
			const result = await client.mutation(api.builderSessions.startSession, {
				appSlug,
				initialMessage: normalizedInitialMessage
			});

			if (isCurrentJob(job)) {
				setServerSnapshot(result);
			}

			return result.handle;
		} catch (startError) {
			if (isCurrentJob(job)) {
				error = getErrorMessage(startError);
			}

			throw startError;
		}
	}

	async function resumeStored() {
		const storedHandle = readStoredHandle(appSlug);

		if (!storedHandle || storedHandle.appSlug !== appSlug) {
			clearLocal();
			return null;
		}

		const job = (jobVersion += 1);
		error = null;

		try {
			const result = await client.mutation(api.builderSessions.resumeSession, {
				sessionId: storedHandle.sessionId,
				resumeToken: storedHandle.resumeToken
			});

			if (!result) {
				if (isCurrentJob(job)) {
					clearLocal();
				}

				return null;
			}

			if (isCurrentJob(job)) {
				setServerSnapshot(result);
			}

			return result.handle;
		} catch (resumeError) {
			if (isCurrentJob(job)) {
				error = getErrorMessage(resumeError);
			}

			throw resumeError;
		}
	}

	async function send(text: string) {
		const normalizedText = text.trim();

		if (!handle) {
			throw new Error('Builder session not found.');
		}

		if (!normalizedText) {
			return handle;
		}

		const job = (jobVersion += 1);
		const previousLocalSnapshot = localSnapshot;
		const currentSnapshot = snapshot;
		const localJobId = createLocalMessageId('local-job');
		const now = Date.now();

		error = null;

		if (currentSnapshot) {
			localSnapshot = {
				...currentSnapshot,
				session: currentSnapshot.session
					? {
							...currentSnapshot.session,
							status: getOptimisticSendingStatus(currentSnapshot.session),
							activeTurnJobId: localJobId as Id<'builderSessionJobs'>,
							updatedAt: now
						}
					: currentSnapshot.session,
				messages: [
					...currentSnapshot.messages,
					{
						_id: createLocalMessageId('local-user'),
						role: 'user',
						text: normalizedText,
						status: 'complete'
					},
					{
						_id: createLocalMessageId('local-assistant'),
						role: 'assistant',
						text: '',
						status: 'pending',
						jobId: localJobId
					}
				]
			};
		}

		try {
			const result = await client.mutation(api.builderSessions.sendMessage, {
				sessionId: handle.sessionId,
				resumeToken: handle.resumeToken,
				text: normalizedText
			});

			if (isCurrentJob(job)) {
				setServerSnapshot(result);
			}

			return result.handle;
		} catch (sendError) {
			if (isCurrentJob(job)) {
				localSnapshot = previousLocalSnapshot;
			}

			throw sendError;
		}
	}

	async function saveEmailDraft(emailDraft: EmailDraft, baseEmailDraftVersion: number) {
		if (!handle) {
			throw new Error('Builder session not found.');
		}

		const result = await client.mutation(api.builderSessions.saveEmailDraft, {
			sessionId: handle.sessionId,
			resumeToken: handle.resumeToken,
			baseEmailDraftVersion,
			emailDraft
		});

		if (result.snapshot) {
			setServerSnapshot(result.snapshot);
		}

		return result;
	}

	return {
		get handle() {
			return snapshot?.handle ?? handle;
		},
		get session() {
			return session;
		},
		get messages() {
			return messages;
		},
		get error() {
			return error;
		},
		get queryError() {
			return liveSnapshotQuery.error ?? null;
		},
		get canSend() {
			return messagingView.canSendMessage;
		},
		resumeStored,
		saveEmailDraft,
		start,
		send
	};
}
