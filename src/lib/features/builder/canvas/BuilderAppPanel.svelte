<script lang="ts">
	import type { BuilderAppRecord } from '$lib/features/builder/data';
	import BuilderPanelArtwork from '$lib/features/builder/canvas/BuilderPanelArtwork.svelte';

	type Props = {
		app: BuilderAppRecord;
	};

	let { app }: Props = $props();
	const artwork = $derived(app.artwork.panel);
</script>

<aside class="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-zinc-50/50 text-zinc-950">
	<div class="flex min-h-0 flex-1 items-center justify-center px-5 py-10 md:px-8">
		<article class="w-full max-w-66 rounded-sm bg-white p-4 text-zinc-950 shadow-sm">
			<div class="py-5">
				<BuilderPanelArtwork
					backColor={artwork.backColor}
					frontColor={artwork.frontColor}
					icon={artwork.icon}
					iconCenterX={artwork.iconCenterX}
					iconCenterY={artwork.iconCenterY}
				/>
			</div>

			<div class="px-1 pt-1 pb-5 text-center">
				<h2 class="text-sm font-medium tracking-normal text-zinc-950">{app.title}</h2>
				<p class="mt-1 text-xs leading-snug text-zinc-500">{app.description}</p>
			</div>
		</article>
	</div>
</aside>
