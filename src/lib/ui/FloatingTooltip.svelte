<script lang="ts">
	import { onMount, tick, type Snippet } from 'svelte';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/ui/cn';

	export type FloatingTooltipPlacement =
		| 'bottom'
		| 'bottom-start'
		| 'bottom-end'
		| 'top'
		| 'top-start'
		| 'top-end';

	type Props = {
		id: string;
		text?: string | null;
		placement?: FloatingTooltipPlacement;
		maxWidth?: number;
		fitContent?: boolean;
		class?: ClassValue;
		panelClass?: ClassValue;
		trigger: Snippet<[{ describedBy: string | undefined }]>;
	};

	let {
		id,
		text = null,
		placement = 'bottom-start',
		maxWidth = 288,
		fitContent = false,
		class: className = '',
		panelClass = '',
		trigger
	}: Props = $props();

	let isOpen = $state(false);
	let triggerElement = $state<HTMLSpanElement | null>(null);
	let panelElement = $state<HTMLDivElement | null>(null);
	let closeTimer: ReturnType<typeof setTimeout> | null = null;
	let panelTop = $state(0);
	let panelLeft = $state(0);
	let panelWidth = $state<number | null>(null);

	const tooltipText = $derived(text?.trim() ?? '');
	const tooltipId = $derived(id.replace(/[^a-zA-Z0-9_-]/g, '-'));
	const panelStyle = $derived(
		[
			`top: ${panelTop}px`,
			`left: ${panelLeft}px`,
			`max-width: min(${maxWidth}px, calc(100vw - 32px))`,
			panelWidth ? `width: ${panelWidth}px` : null
		]
			.filter(Boolean)
			.join('; ')
	);

	$effect(() => {
		void id;
		void tooltipText;
		closeTooltip();
	});

	onMount(() => {
		function handleCapturedScroll() {
			if (isOpen) {
				updatePanelPosition();
			}
		}

		document.addEventListener('scroll', handleCapturedScroll, true);

		return () => {
			document.removeEventListener('scroll', handleCapturedScroll, true);
			clearCloseTimer();
		};
	});

	function clearCloseTimer() {
		if (!closeTimer) {
			return;
		}

		clearTimeout(closeTimer);
		closeTimer = null;
	}

	function openTooltip() {
		if (!tooltipText) {
			return;
		}

		clearCloseTimer();
		isOpen = true;
		void updatePanelPositionAfterRender();
	}

	function handleMouseEnter() {
		openTooltip();
	}

	function closeTooltip() {
		clearCloseTimer();
		isOpen = false;
	}

	function scheduleCloseTooltip() {
		clearCloseTimer();
		closeTimer = setTimeout(closeTooltip, 80);
	}

	function handleFocus() {
		const activeElement = document.activeElement;

		if (
			!(activeElement instanceof HTMLElement) ||
			!triggerElement?.contains(activeElement) ||
			!activeElement.matches(':focus-visible')
		) {
			return;
		}

		openTooltip();
	}

	function handleBlur() {
		scheduleCloseTooltip();
	}

	function getPreferredLeft(triggerRect: DOMRect, width: number) {
		if (placement.endsWith('start')) {
			return triggerRect.left;
		}

		if (placement.endsWith('end')) {
			return triggerRect.right - width;
		}

		return triggerRect.left + triggerRect.width / 2 - width / 2;
	}

	function shouldOpenAbove(triggerRect: DOMRect, panelHeight: number, gap: number, padding: number) {
		const wantsTop = placement.startsWith('top');
		const topSpace = triggerRect.top - padding;
		const bottomSpace = window.innerHeight - triggerRect.bottom - padding;

		if (wantsTop) {
			return topSpace >= panelHeight + gap || topSpace > bottomSpace;
		}

		return bottomSpace < panelHeight + gap && topSpace > bottomSpace;
	}

	function updatePanelPosition() {
		if (!triggerElement) {
			return;
		}

		const viewportPadding = 16;
		const triggerGap = 8;
		const triggerRect = triggerElement.getBoundingClientRect();
		const nextPanelWidth = Math.min(maxWidth, window.innerWidth - viewportPadding * 2);
		const panelRect = panelElement?.getBoundingClientRect();
		const measuredPanelWidth = Math.min(panelRect?.width ?? nextPanelWidth, nextPanelWidth);
		const positionedPanelWidth = fitContent ? measuredPanelWidth : nextPanelWidth;
		const panelHeight = panelRect?.height ?? 0;
		const preferredLeft = getPreferredLeft(triggerRect, positionedPanelWidth);
		const maxLeft = window.innerWidth - positionedPanelWidth - viewportPadding;
		const opensAbove = shouldOpenAbove(triggerRect, panelHeight, triggerGap, viewportPadding);
		const preferredTop = opensAbove
			? triggerRect.top - panelHeight - triggerGap
			: triggerRect.bottom + triggerGap;
		const maxTop = window.innerHeight - panelHeight - viewportPadding;

		panelWidth = fitContent ? null : nextPanelWidth;
		panelLeft = Math.max(viewportPadding, Math.min(preferredLeft, maxLeft));
		panelTop = Math.max(viewportPadding, Math.min(preferredTop, maxTop));
	}

	async function updatePanelPositionAfterRender() {
		await tick();
		updatePanelPosition();
	}

	function handleDocumentClick(event: MouseEvent) {
		if (!isOpen || !tooltipText) {
			return;
		}

		const target = event.target;

		if (!(target instanceof Node)) {
			return;
		}

		if (triggerElement?.contains(target) || panelElement?.contains(target)) {
			return;
		}

		closeTooltip();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape' || !isOpen) {
			return;
		}

		event.preventDefault();
		closeTooltip();
		triggerElement
			?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
			?.focus();
	}
</script>

<span
	bind:this={triggerElement}
	role="presentation"
	class={cn('inline-flex items-center', className)}
	onmouseenter={handleMouseEnter}
	onmouseleave={scheduleCloseTooltip}
	onfocusin={handleFocus}
	onfocusout={handleBlur}
>
	{@render trigger({ describedBy: isOpen && tooltipText ? tooltipId : undefined })}

	{#if isOpen && tooltipText}
		<div
			bind:this={panelElement}
			id={tooltipId}
			role="tooltip"
			class={cn(
				'fixed z-50 rounded-sm border border-stone-200 bg-white px-3 py-2 text-left text-[0.74rem] leading-[1.45] whitespace-normal text-stone-700 shadow-sm shadow-stone-950/8',
				fitContent && 'w-max',
				panelClass
			)}
			style={panelStyle}
			onmouseenter={clearCloseTimer}
			onmouseleave={scheduleCloseTooltip}
		>
			{tooltipText}
		</div>
	{/if}
</span>

<svelte:document onclick={handleDocumentClick} onkeydown={handleKeydown} />
<svelte:window onresize={updatePanelPosition} />
