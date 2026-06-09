import { api } from '$convex/_generated/api';
import type { Doc } from '$convex/_generated/dataModel';
import type { ViewerIdentity } from '$lib/app/current-workspace.svelte';
import { getContext, setContext } from 'svelte';
import { useConvexClient, useQuery } from 'convex-svelte';
import { useClerkContext } from 'svelte-clerk';

export type ViewerSessionStatus =
	| 'loading'
	| 'signedOut'
	| 'deleted'
	| 'needsOnboarding'
	| 'onboardingIncomplete'
	| 'ready'
	| 'error';
export type ViewerOnboardingSessionStatus = 'needsOnboarding' | 'onboardingIncomplete';
type ClerkSessionState = 'loading' | 'signedOut' | 'signedIn';
type ConvexAuthState = 'pending' | 'authenticated' | 'failed';

export type ViewerWorkspace = {
	user: Doc<'users'>;
	workspace: Doc<'workspaces'>;
	identity: ViewerIdentity;
};

const VIEWER_SESSION_CONTEXT = Symbol('viewer-session');

function getErrorMessage(error: unknown, fallback: string) {
	return error instanceof Error ? error.message : fallback;
}

export function isViewerSessionOnboardingStatus(
	status: ViewerSessionStatus
): status is ViewerOnboardingSessionStatus {
	return status === 'needsOnboarding' || status === 'onboardingIncomplete';
}

export function createViewerSession() {
	const client = useConvexClient();
	const clerk = useClerkContext();
	let authVersion = 0;
	let authRetryNonce = $state(0);
	let convexAuthState = $state<ConvexAuthState>('pending');
	let tokenErrorText = $state<string | null>(null);
	let convexAuthErrorText = $state<string | null>(null);
	let deletedAccountSignOutErrorText = $state<string | null>(null);
	let deletedAccountSignOutStarted = $state(false);
	let isSigningOutDeletedAccount = $state(false);
	const signedInUserId = $derived(clerk.auth.userId ?? null);
	const clerkSessionState = $derived.by<ClerkSessionState>(() => {
		if (!clerk.isLoaded) {
			return 'loading';
		}

		return signedInUserId ? 'signedIn' : 'signedOut';
	});
	const shouldLoadCurrentUser = $derived(
		clerkSessionState === 'signedIn' && convexAuthState === 'authenticated'
	);
	const viewerAccountStateQuery = useQuery(api.auth.viewerAccountState, () =>
		shouldLoadCurrentUser ? {} : 'skip'
	);
	const accountState = $derived(viewerAccountStateQuery.data ?? null);
	const viewer = $derived.by<ViewerWorkspace | null>(() => {
		const state = accountState;

		if (!state || state.kind !== 'ready') {
			return null;
		}

		return {
			user: state.user,
			workspace: state.workspace,
			identity: state.identity
		};
	});
	const error = $derived.by<Error | null>(() => {
		const message = tokenErrorText ?? convexAuthErrorText ?? deletedAccountSignOutErrorText;

		if (message) {
			return new Error(message);
		}

		return viewerAccountStateQuery.error ?? null;
	});
	const status = $derived.by<ViewerSessionStatus>(() => {
		if (clerkSessionState === 'loading') {
			return 'loading';
		}

		if (clerkSessionState === 'signedOut') {
			return 'signedOut';
		}

		if (convexAuthState === 'failed') {
			return 'error';
		}

		if (deletedAccountSignOutErrorText || viewerAccountStateQuery.error) {
			return 'error';
		}

		if (convexAuthState === 'pending') {
			return 'loading';
		}

		if (viewerAccountStateQuery.isLoading) {
			return 'loading';
		}

		return accountState?.kind ?? 'loading';
	});

	function retry() {
		tokenErrorText = null;
		convexAuthErrorText = null;
		deletedAccountSignOutErrorText = null;
		deletedAccountSignOutStarted = false;
		authRetryNonce += 1;
	}

	function reset() {
		tokenErrorText = null;
		convexAuthErrorText = null;
		deletedAccountSignOutErrorText = null;
		deletedAccountSignOutStarted = false;
	}

	async function signOut() {
		reset();
		await clerk.clerk?.signOut();
	}

	async function signOutDeletedAccount() {
		if (isSigningOutDeletedAccount || deletedAccountSignOutStarted) {
			return;
		}

		reset();
		deletedAccountSignOutStarted = true;
		isSigningOutDeletedAccount = true;

		try {
			await clerk.clerk?.signOut();
		} catch (error) {
			deletedAccountSignOutStarted = false;
			deletedAccountSignOutErrorText = getErrorMessage(error, 'Unable to sign out deleted account.');
			throw error;
		} finally {
			isSigningOutDeletedAccount = false;
		}
	}

	$effect(() => {
		const userId = signedInUserId;
		const session = clerk.session;
		const retryNonce = authRetryNonce;
		const version = (authVersion += 1);

		void retryNonce;
		convexAuthState = 'pending';
		tokenErrorText = null;
		convexAuthErrorText = null;

		if (!clerk.isLoaded) {
			return;
		}

		if (!userId) {
			client.setAuth(async () => null);
			return;
		}

		if (!session) {
			return;
		}

		client.setAuth(async () => {
			let token: string | null;

			try {
				token = await session.getToken({ template: 'convex' });
			} catch (error) {
				tokenErrorText = getErrorMessage(error, 'Unable to get a Convex auth token from Clerk.');
				return null;
			}

			if (!token) {
				tokenErrorText =
					'Unable to get a Convex auth token from Clerk. Check the Clerk JWT template named "convex".';
			}

			return token ?? null;
		}, (isAuthenticated) => {
			if (version !== authVersion) {
				return;
			}

			if (isAuthenticated) {
				convexAuthState = 'authenticated';
				convexAuthErrorText = null;
				return;
			}

			convexAuthState = 'failed';
			convexAuthErrorText =
				tokenErrorText ??
				'Unable to authenticate with Convex. Check the Clerk JWT template named "convex".';
		});
	});

	$effect(() => {
		if (status !== 'deleted' && !isSigningOutDeletedAccount) {
			deletedAccountSignOutStarted = false;
		}
	});

	return {
		get status() {
			return status;
		},
		get isSignedIn() {
			return Boolean(signedInUserId);
		},
		get signedInUserId() {
			return signedInUserId;
		},
		get accountState() {
			return accountState;
		},
		get viewer() {
			return viewer;
		},
		get isSigningOutDeletedAccount() {
			return isSigningOutDeletedAccount;
		},
		get error() {
			return error;
		},
		retry,
		reset,
		signOut,
		signOutDeletedAccount
	};
}

export type ViewerSession = ReturnType<typeof createViewerSession>;

export function provideViewerSession(session: ViewerSession) {
	setContext(VIEWER_SESSION_CONTEXT, session);
}

export function useViewerSession() {
	const session = getContext<ViewerSession | undefined>(VIEWER_SESSION_CONTEXT);

	if (!session) {
		throw new Error('No viewer session context was found.');
	}

	return session;
}
