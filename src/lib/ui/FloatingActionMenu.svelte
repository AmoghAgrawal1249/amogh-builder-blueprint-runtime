<script lang="ts">
	import { onMount, tick } from 'svelte';
	import DotsThreeIcon from 'phosphor-svelte/lib/DotsThreeIcon';
	import TrashIcon from 'phosphor-svelte/lib/TrashIcon';
	import { cn } from '$lib/ui/cn';

	export type FloatingActionMenuAction = {
		label: string;
		ariaLabel?: string;
		intent?: 'default' | 'destructive';
		disabled?: boolean;
		onSelect: () => void | Promise<void>;
	};

	type Props = {
		id: string;
		ariaLabel: string;
		disabled?: boolean;
		actions?: FloatingActionMenuAction[];
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		triggerClass?: string;
	};

	let {
		id,
		ariaLabel,
		disabled = false,
		actions = [],
		open = $bindable(false),
		onOpenChange,
		triggerClass = ''
	}: Props = $props();

	let triggerElement = $state<HTMLButtonElement | null>(null);
	let panelElement = $state<HTMLDivElement | null>(null);
	let panelTop = $state(0);
	let panelLeft = $state(0);
	let panelWidth = $state(128);

	const menuId = $derived(id.replace(/[^a-zA-Z0-9_-]/g, '-'));
	const hasActions = $derived(actions.length > 0);
	const isDisabled = $derived(disabled || !hasActions);
	const panelStyle = $derived(
		`top: ${panelTop}px; left: ${panelLeft}px; width: ${panelWidth}px;`
	);

	onMount(() => {
		document.addEventListener('scroll', updatePanelPosition, true);

		return () => {
			document.removeEventListener('scroll', updatePanelPosition, true);
		};
	});

	$effect(() => {
		if (open && isDisabled) {
			setOpen(false);
		}
	});

	$effect(() => {
		if (open) {
			void updatePanelPositionAfterRender();
		}
	});

	function setOpen(nextOpen: boolean) {
		open = nextOpen;
		onOpenChange?.(nextOpen);
	}

	function toggleMenu() {
		if (isDisabled) {
			return;
		}

		setOpen(!open);
	}

	function closeMenu({ restoreFocus = false } = {}) {
		if (!open) {
			return;
		}

		setOpen(false);

		if (restoreFocus) {
			triggerElement?.focus();
		}
	}

	function shouldOpenAbove(triggerRect: DOMRect, panelHeight: number, gap: number, padding: number) {
		const topSpace = triggerRect.top - padding;
		const bottomSpace = window.innerHeight - triggerRect.bottom - padding;

		return bottomSpace < panelHeight + gap && topSpace > bottomSpace;
	}

	function updatePanelPosition() {
		if (!triggerElement || !open) {
			return;
		}

		const viewportPadding = 16;
		const triggerGap = 8;
		const menuWidth = Math.min(128, window.innerWidth - viewportPadding * 2);
		const triggerRect = triggerElement.getBoundingClientRect();
		const panelHeight = panelElement?.getBoundingClientRect().height ?? 0;
		const preferredLeft = triggerRect.right - menuWidth;
		const maxLeft = window.innerWidth - menuWidth - viewportPadding;
		const opensAbove = shouldOpenAbove(triggerRect, panelHeight, triggerGap, viewportPadding);
		const preferredTop = opensAbove
			? triggerRect.top - panelHeight - triggerGap
			: triggerRect.bottom + triggerGap;
		const maxTop = window.innerHeight - panelHeight - viewportPadding;

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

		closeMenu();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape' || !open) {
			return;
		}

		event.preventDefault();
		closeMenu({ restoreFocus: true });
	}

	async function selectAction(action: FloatingActionMenuAction) {
		if (action.disabled) {
			return;
		}

		setOpen(false);
		await action.onSelect();
	}
</script>

<span class="inline-flex items-center">
	<button
		bind:this={triggerElement}
		type="button"
		aria-label={ariaLabel}
		aria-haspopup="menu"
		aria-expanded={open}
		aria-controls={open ? menuId : undefined}
		disabled={isDisabled}
		onclick={toggleMenu}
		class={cn(
			'inline-flex size-7 shrink-0 items-center justify-center whitespace-nowrap rounded-sm text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 disabled:cursor-default disabled:opacity-55 disabled:hover:bg-transparent',
			triggerClass
		)}
	>
		<DotsThreeIcon aria-hidden="true" size={13} weight="bold" />
	</button>

	{#if open}
		<div
			bind:this={panelElement}
			id={menuId}
			role="menu"
			class="fixed z-50 min-w-32 overflow-hidden rounded-sm border border-stone-200 bg-white py-1 text-left shadow-lg shadow-stone-950/5"
			style={panelStyle}
		>
			{#each actions as action, index (`${action.label}-${index}`)}
				<button
					type="button"
					role="menuitem"
					class={cn(
						'flex h-8 w-full items-center gap-2 px-2.5 text-left text-[0.72rem] font-normal transition-colors disabled:cursor-default disabled:opacity-50',
						action.intent === 'destructive'
							? 'text-red-700 hover:bg-red-50'
							: 'text-stone-700 hover:bg-stone-50'
					)}
					aria-label={action.ariaLabel ?? action.label}
					disabled={action.disabled}
					onclick={() => selectAction(action)}
				>
					{#if action.intent === 'destructive'}
						<TrashIcon aria-hidden="true" size={14} weight="regular" />
					{/if}
					<span class="truncate">{action.label}</span>
				</button>
			{/each}
		</div>
	{/if}
</span>

<svelte:document onclick={handleDocumentClick} onkeydown={handleKeydown} />
<svelte:window onresize={updatePanelPosition} />
