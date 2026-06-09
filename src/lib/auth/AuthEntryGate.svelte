<script module lang="ts">
	import type { AppHref, AuthEntryHref } from '$lib/app/app-links';
	import type { Snippet } from 'svelte';

	export type AuthEntryFlowContext = {
		returnTo: AppHref | undefined;
		returnButtonHref: string | undefined;
		entryReturnHref: AuthEntryHref | undefined;
	};
</script>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { AUTH_LINKS } from '$lib/app/app-links';
	import AppGateError from '$lib/app/AppGateError.svelte';
	import AppLoadingScreen from '$lib/app/AppLoadingScreen.svelte';
	import {
		buildAuthEntryHref,
		resolveAuthEntryReturnHref,
		resolveAuthExitHref,
		resolveAuthReturnTo,
		resolvePostAuthHref,
		type AuthEntryPathname
	} from '$lib/auth/navigation';
	import {
		createViewerSession,
		isViewerSessionOnboardingStatus,
		provideViewerSession
	} from '$lib/auth/viewer-session.svelte';

	type Props = {
		entry: AuthEntryPathname;
		flow: Snippet<[AuthEntryFlowContext]>;
		signedInOnboarding?: Snippet<[AuthEntryFlowContext]>;
	};

	let { entry, flow, signedInOnboarding }: Props = $props();
	const session = createViewerSession();
	provideViewerSession(session);
	const authEntryKey = $derived(`${session.signedInUserId ?? 'signed-out'}:${entry}`);
	const returnTo = $derived(resolveAuthReturnTo(page.url));
	const postAuthHref = $derived(resolvePostAuthHref(page.url));
	const returnButtonHref = $derived(
		resolveAuthExitHref(page.url, {
			useDefaultWhenMissing: false
		})
	);
	const entryReturnHref = $derived(resolveAuthEntryReturnHref(page.url));
	const gateErrorText = $derived(session.error?.message ?? 'Unable to load your workspace.');
	const joinHref = $derived(
		buildAuthEntryHref(AUTH_LINKS.join.pathname, {
			returnTo,
			fromAuth: entry === AUTH_LINKS.join.pathname ? undefined : entry
		})
	);
	const loginHref = $derived(
		buildAuthEntryHref(AUTH_LINKS.login.pathname, {
			returnTo
		})
	);
	const flowContext = $derived<AuthEntryFlowContext>({
		returnTo,
		returnButtonHref,
		entryReturnHref
	});
	const signedInNeedsWorkspaceOnboarding = $derived(
		entry === AUTH_LINKS.join.pathname && isViewerSessionOnboardingStatus(session.status)
	);
	const shouldRenderSignedInOnboarding = $derived(
		signedInNeedsWorkspaceOnboarding && Boolean(signedInOnboarding)
	);
	const shouldRedirectSignedInToJoin = $derived(
		isViewerSessionOnboardingStatus(session.status) && entry !== AUTH_LINKS.join.pathname
	);
	const shouldRedirectSignedInAuthEntry = $derived(
		session.status === 'ready' && !shouldRenderSignedInOnboarding
	);

	$effect(() => {
		if (session.status === 'deleted') {
			if (!session.isSigningOutDeletedAccount) {
				void session
					.signOutDeletedAccount()
					.then(() => {
						if (entry !== AUTH_LINKS.login.pathname) {
							void goto(resolve(loginHref), { replaceState: true });
						}
					})
					.catch(() => undefined);
			}
			return;
		}

		if (shouldRedirectSignedInToJoin) {
			void goto(resolve(joinHref), { replaceState: true });
			return;
		}

		if (shouldRedirectSignedInAuthEntry) {
			void goto(resolve(postAuthHref), { replaceState: true });
		}
	});
</script>

{#if session.isSigningOutDeletedAccount || session.status === 'deleted' || shouldRedirectSignedInToJoin || shouldRedirectSignedInAuthEntry}
	<AppLoadingScreen />
{:else if shouldRenderSignedInOnboarding}
	{#key authEntryKey}
		{@render signedInOnboarding?.(flowContext)}
	{/key}
{:else if session.status === 'loading'}
	<AppLoadingScreen />
{:else if session.status === 'error'}
	<AppGateError message={gateErrorText} onRetry={session.retry} />
{:else}
	{#key authEntryKey}
		{@render flow(flowContext)}
	{/key}
{/if}
