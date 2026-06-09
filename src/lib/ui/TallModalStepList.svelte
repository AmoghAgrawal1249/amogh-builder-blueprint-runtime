<script lang="ts">
	import type { Snippet } from 'svelte';

	type TallModalStep = {
		id?: string;
		title: string;
		description: string;
	};

	type Props = {
		steps: TallModalStep[];
		renderDescription?: Snippet<[TallModalStep]>;
	};

	let { steps, renderDescription }: Props = $props();
</script>

<div class="space-y-0">
	{#each steps as step, index (step.id ?? step.title)}
		<section class="grid grid-cols-[1.5rem_1fr] gap-x-3">
			<div class="relative flex justify-center">
				<div
					class="z-10 flex size-6 shrink-0 items-center justify-center rounded-full border border-stone-100 bg-stone-50/70 text-[0.66rem] leading-none font-normal text-stone-500"
					aria-hidden="true"
				>
					{index + 1}
				</div>
				{#if index < steps.length - 1}
					<div class="absolute top-6 bottom-0 w-px bg-stone-100" aria-hidden="true"></div>
				{/if}
			</div>
			<div class={index < steps.length - 1 ? 'pb-4' : ''}>
				<h3 class="text-[0.76rem] leading-tight font-medium text-stone-950">{step.title}</h3>
				<p class="mt-1.5 text-[0.69rem] leading-relaxed text-stone-600">
					{#if renderDescription}
						{@render renderDescription(step)}
					{:else}
						{step.description}
					{/if}
				</p>
			</div>
		</section>
	{/each}
</div>
