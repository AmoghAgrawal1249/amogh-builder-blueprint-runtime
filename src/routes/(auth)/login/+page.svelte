<script lang="ts">
	import { AUTH_LINKS } from '$lib/app/app-links';
	import AuthEntryGate from '$lib/auth/AuthEntryGate.svelte';
	import { LoginFlow } from '$lib/auth/login';
</script>

<AuthEntryGate entry={AUTH_LINKS.login.pathname}>
	{#snippet flow({ returnTo, returnButtonHref, entryReturnHref })}
		<LoginFlow {returnTo} {returnButtonHref} {entryReturnHref} />
	{/snippet}
</AuthEntryGate>
