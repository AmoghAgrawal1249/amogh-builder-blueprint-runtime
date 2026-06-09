<script lang="ts">
	import type { Component } from 'svelte';

	type TallModalFeature = {
		icon: Component;
		title: string;
		description: string;
	};

	type Props = {
		features: TallModalFeature[];
	};

	let { features }: Props = $props();
</script>

<div class="grid gap-x-6 gap-y-5 sm:grid-cols-2">
	{#each features as feature (feature.title)}
		{@const Icon = feature.icon}
		<section class="grid grid-cols-[1rem_1fr] gap-x-2.5 gap-y-1.5">
			<Icon size={16} weight="regular" class="mt-px text-stone-500" aria-hidden="true" />
			<h3 class="text-[0.76rem] leading-tight font-medium text-stone-950">{feature.title}</h3>
			<p class="col-start-2 text-[0.69rem] leading-relaxed text-stone-600">
				{feature.description}
			</p>
		</section>
	{/each}
</div>
