<script lang="ts">
	import { cn } from '$lib/ui/cn';
	import type { ListFilterConfig } from './types';
	import ListActionButton from './ListActionButton.svelte';
	import ListFilterControl from './ListFilterControl.svelte';
	import ListSearchInput from './ListSearchInput.svelte';

	type Props = {
		searchPlaceholder?: string;
		searchAriaLabel?: string;
		searchValue?: string;
		onSearchValueChange?: (value: string) => void;
		filters?: readonly ListFilterConfig[];
		actionLabel?: string;
		onAction?: () => void;
		class?: string;
	};

	let {
		searchPlaceholder,
		searchAriaLabel,
		searchValue = '',
		onSearchValueChange,
		filters = [],
		actionLabel,
		onAction,
		class: className = ''
	}: Props = $props();
</script>

<div class={cn('flex w-full flex-col gap-2 md:flex-row md:items-center md:gap-2.5', className)}>
	{#if searchPlaceholder}
		<ListSearchInput
			placeholder={searchPlaceholder}
			ariaLabel={searchAriaLabel}
			value={searchValue}
			onValueChange={onSearchValueChange}
			readonly={!onSearchValueChange}
			class="w-full md:min-w-0 md:flex-1"
		/>
	{/if}

	<div
		class={cn(
			'items-center gap-2 md:gap-2.5',
			searchPlaceholder ? 'hidden md:flex md:shrink-0' : 'flex w-full justify-end md:w-auto'
		)}
	>
		{#each filters as filter (filter.id)}
			<ListFilterControl {filter} class="flex-1 md:flex-none" />
		{/each}

		{#if actionLabel}
			<ListActionButton label={actionLabel} class="flex-1 md:flex-none" onclick={onAction} />
		{/if}
	</div>
</div>
