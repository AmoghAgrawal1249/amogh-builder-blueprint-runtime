<script lang="ts">
	import { onMount, tick } from 'svelte';
	import CaretDownIcon from 'phosphor-svelte/lib/CaretDownIcon';
	import CheckIcon from 'phosphor-svelte/lib/CheckIcon';
	import { cn } from '$lib/ui/cn';
	import type { ListFilterConfig } from './types';

	type Props = {
		filter: ListFilterConfig;
		class?: string;
	};

	let { filter, class: className = '' }: Props = $props();
	let open = $state(false);
	let triggerElement = $state<HTMLButtonElement | null>(null);
	let panelElement = $state<HTMLDivElement | null>(null);
	let panelTop = $state(0);
	let panelLeft = $state(0);
	let panelWidth = $state(160);
	let panelMaxHeight = $state(240);

	const widthClass = $derived(filter.width === 'wide' ? 'md:w-56' : 'md:w-44');
	const menuId = $derived(`list-filter-${filter.id}`.replace(/[^a-zA-Z0-9_-]/g, '-'));
	const panelStyle = $derived(
		`top: ${panelTop}px; left: ${panelLeft}px; width: ${panelWidth}px; max-height: ${panelMaxHeight}px;`
	);

	onMount(() => {
		document.addEventListener('scroll', updatePanelPosition, true);

		return () => {
			document.removeEventListener('scroll', updatePanelPosition, true);
		};
	});

	$effect(() => {
		if (open) {
			void updatePanelPositionAfterRender();
		}
	});

	function toggleOpen() {
		open = !open;
	}

	function close({ restoreFocus = false } = {}) {
		if (!open) {
			return;
		}

		open = false;

		if (restoreFocus) {
			triggerElement?.focus();
		}
	}

	function updatePanelPosition() {
		if (!triggerElement || !open) {
			return;
		}

		const viewportPadding = 16;
		const triggerGap = 8;
		const triggerRect = triggerElement.getBoundingClientRect();
		const availablePanelWidth = Math.max(160, window.innerWidth - viewportPadding * 2);
		const minPanelWidth = Math.min(Math.max(triggerRect.width, 160), availablePanelWidth);
		const measuredPanelWidth = Math.max(
			minPanelWidth,
			panelElement?.getBoundingClientRect().width ?? 160,
			panelElement?.scrollWidth ?? 160
		);
		const maxPanelHeight = Math.max(120, window.innerHeight - viewportPadding * 2);
		const measuredPanelHeight = Math.min(panelElement?.scrollHeight ?? 0, maxPanelHeight);
		const menuWidth = Math.min(measuredPanelWidth, availablePanelWidth);
		const preferredLeft = triggerRect.right - menuWidth;
		const maxLeft = window.innerWidth - menuWidth - viewportPadding;
		const preferredTop = triggerRect.bottom + triggerGap;
		const maxTop = Math.max(
			viewportPadding,
			window.innerHeight - measuredPanelHeight - viewportPadding
		);

		panelMaxHeight = maxPanelHeight;
		panelWidth = menuWidth;
		panelLeft = Math.max(viewportPadding, Math.min(preferredLeft, maxLeft));
		panelTop = Math.max(viewportPadding, Math.min(preferredTop, maxTop));
	}

	async function updatePanelPositionAfterRender() {
		await tick();
		updatePanelPosition();
	}

	function handleDocumentClick(event: MouseEvent) {
		if (!open) {
			return;
		}

		const target = event.target;

		if (!(target instanceof Node)) {
			return;
		}

		if (triggerElement?.contains(target) || panelElement?.contains(target)) {
			return;
		}

		close();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape' || !open) {
			return;
		}

		event.preventDefault();
		close({ restoreFocus: true });
	}

	function selectOption(optionId: string) {
		filter.onSelect(optionId);
		close({ restoreFocus: true });
	}
</script>

<span class={cn('inline-flex min-w-0', className)}>
	<button
		bind:this={triggerElement}
		type="button"
		class={cn(
			'inline-flex h-8 w-full min-w-0 flex-1 shrink-0 items-center justify-between gap-1.5 whitespace-nowrap rounded-sm border border-stone-200/70 bg-white px-3 text-left text-[0.72rem] font-normal text-stone-950 transition-colors hover:bg-stone-50 md:flex-none md:text-[0.74rem]',
			widthClass
		)}
		aria-haspopup="menu"
		aria-expanded={open}
		aria-controls={open ? menuId : undefined}
		onclick={toggleOpen}
	>
		<span class="min-w-0 truncate">{filter.label}</span>
		<CaretDownIcon aria-hidden="true" size={14} weight="regular" class="shrink-0 text-stone-600" />
	</button>

	{#if open}
		<div
			bind:this={panelElement}
			id={menuId}
			role="menu"
			class="fixed z-50 min-w-40 overflow-x-hidden overflow-y-auto rounded-sm border border-stone-200 bg-white py-1 text-left shadow-lg shadow-stone-950/5"
			style={panelStyle}
		>
			{#each filter.options as option (option.id)}
				<button
					type="button"
					role="menuitemradio"
					aria-checked={option.id === filter.selectedId}
					class="flex h-8 w-full items-center gap-2 px-2.5 text-left text-[0.72rem] font-normal text-stone-700 transition-colors hover:bg-stone-50"
					onclick={() => selectOption(option.id)}
				>
					<span class="flex size-3.5 shrink-0 items-center justify-center text-stone-950">
						{#if option.id === filter.selectedId}
							<CheckIcon aria-hidden="true" size={12} weight="bold" />
						{/if}
					</span>
					<span class="whitespace-nowrap">{option.label}</span>
				</button>
			{/each}
		</div>
	{/if}
</span>

<svelte:document onclick={handleDocumentClick} onkeydown={handleKeydown} />
<svelte:window onresize={updatePanelPosition} />
