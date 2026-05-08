<script lang="ts">
	import { setupAppConvex } from '$lib/backend/convex/setup.svelte';
	import '../app.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	setupAppConvex();
</script>

<svelte:head>
	<title>Bring the Firm</title>
</svelte:head>

<div class="h-dvh min-h-dvh overflow-hidden bg-white text-zinc-950">
	{@render children()}
</div>
