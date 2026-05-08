<script lang="ts">
	import type { BuilderAppRecord } from '$lib/features/builder/data';
	import CustomEmailBuilderWorkbench from '$lib/features/builder/canvas/CustomEmailBuilderWorkbench.svelte';
	import GuidedBuilderWorkbench from '$lib/features/builder/canvas/GuidedBuilderWorkbench.svelte';
	import type { BuilderGuideDefinition } from '$lib/features/builder/guide/guide-types';

	type Props = {
		app: BuilderAppRecord;
		guide: BuilderGuideDefinition | null;
		initialMessage?: string | null;
	};

	let { app, guide, initialMessage = null }: Props = $props();
	const isCustomEmailBuilder = $derived(app.mode === 'custom');
</script>

{#key app.id}
	{#if isCustomEmailBuilder}
		<CustomEmailBuilderWorkbench {app} {initialMessage} />
	{:else}
		<GuidedBuilderWorkbench {app} {guide} {initialMessage} />
	{/if}
{/key}
