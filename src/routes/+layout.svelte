<script lang="ts">
	import '../app.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<title>Bring the Firm</title>
</svelte:head>

<div class="h-dvh min-h-dvh overflow-hidden bg-white text-zinc-950">
	{@render children()}
</div>
