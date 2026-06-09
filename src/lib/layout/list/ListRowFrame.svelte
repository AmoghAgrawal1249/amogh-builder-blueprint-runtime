<script lang="ts" generics="Item extends ListRowItem">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import { FloatingActionMenu } from '$lib/ui';
	import { cn } from '$lib/ui/cn';
	import type { ListRowItem } from './types';

	type Props = {
		item: Item;
		rowCells: Snippet<[Item]>;
		gridClass: string;
		actionsIdPrefix: string;
		rowActionsAriaLabel: string;
		openActionsItemId: string | null;
		leading?: Snippet<[Item]>;
		noActionsContentClass?: string;
	};

	let {
		item,
		rowCells,
		gridClass,
		actionsIdPrefix,
		rowActionsAriaLabel,
		openActionsItemId = $bindable<string | null>(),
		leading,
		noActionsContentClass = 'col-span-2'
	}: Props = $props();

	function hasRowActions(item: Item) {
		return Boolean(item.actions?.length);
	}

	function setRowActionsOpen(itemId: string, open: boolean) {
		openActionsItemId = open ? itemId : null;
	}

	function handleRowClick(item: Item, event: MouseEvent) {
		if (!item.href) {
			return;
		}

		const target = event.target;

		if (target instanceof Element && target.closest('a, button, input, label')) {
			return;
		}

		void goto(resolve(item.href));
	}

	function preloadItem(item: Item) {
		item.onPreload?.();
	}

	function rowClass(item: Item) {
		return cn(gridClass, item.href && 'cursor-pointer');
	}
</script>

<!-- The nested content owns the real link; this preserves pointer row-click without making the row a fake interactive parent around controls. -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<div
	role="listitem"
	class={rowClass(item)}
	onpointerenter={item.onPreload ? () => preloadItem(item) : undefined}
	onfocusin={item.onPreload ? () => preloadItem(item) : undefined}
	ontouchstart={item.onPreload ? () => preloadItem(item) : undefined}
	onclick={item.href ? (event) => handleRowClick(item, event) : undefined}
>
	{@render leading?.(item)}

	<div class={cn('min-w-0', !hasRowActions(item) && noActionsContentClass)}>
		{@render rowCells(item)}
	</div>

	{#if hasRowActions(item)}
		<div class="flex h-9 items-center justify-self-end">
			<FloatingActionMenu
				id={`${actionsIdPrefix}-${item.id}-actions`}
				ariaLabel={item.actionsAriaLabel ?? rowActionsAriaLabel}
				actions={item.actions ?? []}
				open={openActionsItemId === item.id}
				onOpenChange={(open) => setRowActionsOpen(item.id, open)}
			/>
		</div>
	{/if}
</div>
