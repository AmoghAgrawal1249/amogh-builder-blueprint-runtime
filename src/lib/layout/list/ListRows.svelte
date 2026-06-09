<script lang="ts" generics="Item extends ListRowItem">
	import type { Snippet } from 'svelte';
	import type { ListRowItem } from './types';
	import ListRowFrame from './ListRowFrame.svelte';

	type Props = {
		items: Item[];
		rowCells: Snippet<[Item]>;
		rowActionsAriaLabel?: string;
	};

	let {
		items,
		rowCells,
		rowActionsAriaLabel = 'Item actions'
	}: Props = $props();

	let openActionsItemId = $state<string | null>(null);
</script>

<div class="bg-white">
	<div role="list" class="divide-y divide-stone-200/70 bg-white">
		{#each items as item (item.id)}
			<ListRowFrame
				{item}
				{rowCells}
				gridClass="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3.5 px-4 py-2.5 md:px-5"
				actionsIdPrefix="list-rows"
				{rowActionsAriaLabel}
				bind:openActionsItemId
			/>
		{/each}
	</div>
</div>
