<script lang="ts">
	import { AUTH_LINKS } from '$lib/app/app-links';
	import AuthEntryGate from '$lib/auth/AuthEntryGate.svelte';
	import { JoinFlow } from '$lib/auth/onboarding';
</script>

<AuthEntryGate entry={AUTH_LINKS.join.pathname}>
	{#snippet flow({ returnTo, returnButtonHref, entryReturnHref })}
		<JoinFlow {returnTo} {returnButtonHref} {entryReturnHref} />
	{/snippet}

	{#snippet signedInOnboarding({ returnTo, returnButtonHref, entryReturnHref })}
		<JoinFlow
			{returnTo}
			{returnButtonHref}
			{entryReturnHref}
			initialStep="company"
			isSignedIn
		/>
	{/snippet}
</AuthEntryGate>
