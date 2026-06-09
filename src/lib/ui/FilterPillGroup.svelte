<script lang="ts" generics="Id extends string">
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/ui/cn';
	import type { PhosphorIcon } from '$lib/ui/icons';

	type FilterIcon = PhosphorIcon;

	type FilterPill = {
		id: Id;
		label: string;
		icon?: FilterIcon;
	};

	type Props = {
		filters: FilterPill[];
		selectedId: Id;
		onSelect: (id: Id) => void;
		class?: ClassValue;
	};

	let { filters, selectedId, onSelect, class: className = '' }: Props = $props();
</script>

<div class={cn('-mx-1 overflow-x-auto px-1', className)}>
	<div class="flex min-w-max items-center gap-1.5 md:min-w-0 md:flex-wrap">
		{#each filters as filter (filter.id)}
			{@const Icon = filter.icon}
			<button
				type="button"
				class={cn(
					'inline-flex h-8 items-center justify-center gap-1.5 rounded-full border px-3 text-[0.76rem] font-normal transition-colors md:px-3.5 md:text-[0.78rem]',
					selectedId === filter.id
						? 'border-stone-950 bg-stone-950 text-white'
						: 'border-stone-200 bg-white text-stone-900 hover:border-stone-300 hover:bg-stone-50'
				)}
				aria-pressed={selectedId === filter.id}
				onclick={() => {
					onSelect(filter.id);
				}}
			>
				{#if Icon}
					<Icon size={14} weight="regular" class="shrink-0" />
				{/if}
				<span>{filter.label}</span>
			</button>
		{/each}
	</div>
</div>
