<script lang="ts">
	import { APP_CONFIG } from '$lib/app/app-config';
	import AppProviders from '$lib/app/AppProviders.svelte';
	import '../app.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<title>{APP_CONFIG.name}</title>
</svelte:head>

<AppProviders>
	{@render children()}
</AppProviders>
