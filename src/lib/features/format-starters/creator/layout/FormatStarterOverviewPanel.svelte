<script lang="ts">
	import CaretDownIcon from 'phosphor-svelte/lib/CaretDownIcon';
	import type { FormatStarter } from '$lib/features/format-starters/catalog';
	import FormatStarterPreviewCard from '$lib/features/format-starters/FormatStarterPreviewCard.svelte';

	type Props = {
		formatStarter: FormatStarter;
	};

	let { formatStarter }: Props = $props();
	let detailsExpanded = $state(false);

	const presentation = $derived(formatStarter.defaultPresentation);
	const componentId = $props.id();
	const detailsId = `${componentId}-details`;
	const detailsGridRows = $derived(detailsExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]');
	const chevronClass = $derived(
		`size-3.5 text-stone-500 transition-transform duration-200 ease-out ${
			detailsExpanded ? 'rotate-180' : ''
		}`
	);
</script>

<aside class="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-stone-50/50 text-stone-950">
	<div class="flex min-h-0 flex-1 items-center justify-center px-5 py-10 md:px-8">
		<article class="w-full max-w-66 rounded-md bg-white px-2.5 pt-5 pb-3 text-stone-950 shadow-sm">
			<FormatStarterPreviewCard
				title={presentation.title}
				description={presentation.description}
				dataSourceIds={formatStarter.dataSourceIds}
				showEmailPreview={false}
			/>

			<div class="px-1 pt-4 pb-2 text-center">
				<button
					type="button"
					class="inline-flex items-center justify-center gap-1.5 rounded-sm px-2 py-1 text-[0.7rem] font-normal text-stone-700 transition-colors hover:bg-stone-100 hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
					aria-expanded={detailsExpanded}
					aria-controls={detailsId}
					onclick={() => {
						detailsExpanded = !detailsExpanded;
					}}
				>
					Learn more
					<CaretDownIcon
						aria-hidden="true"
						size={14}
						weight="regular"
						class={chevronClass}
					/>
				</button>

				<div
					id={detailsId}
					class={`grid ${detailsGridRows} transition-[grid-template-rows] duration-300 ease-out`}
					aria-hidden={!detailsExpanded}
				>
					<div class="min-h-0 overflow-hidden">
						<div
							class="space-y-2 pt-3 text-center text-[0.7rem] leading-relaxed text-stone-500 transition-all duration-300 ease-out"
							class:translate-y-0={detailsExpanded}
							class:opacity-100={detailsExpanded}
							class:translate-y-1={!detailsExpanded}
							class:opacity-0={!detailsExpanded}
						>
							{#each formatStarter.details.paragraphs as paragraph (paragraph)}
								<p>{paragraph}</p>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</article>
	</div>
</aside>
