<script lang="ts">
	import BuilderCanvas from '$lib/features/builder/canvas/BuilderCanvas.svelte';
	import BuilderDesktopOnly from '$lib/features/builder/canvas/BuilderDesktopOnly.svelte';
	import { toBuilderAppRecord, toBuilderGuideDefinition } from '$lib/features/builder/data';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const app = $derived(toBuilderAppRecord(data.app));
	const guide = $derived(toBuilderGuideDefinition(data.guide));
</script>

<BuilderDesktopOnly>
	<BuilderCanvas {app} {guide} />
</BuilderDesktopOnly>
