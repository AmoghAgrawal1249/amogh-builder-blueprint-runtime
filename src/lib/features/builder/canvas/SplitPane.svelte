<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import SplitPaneHandle from '$lib/features/builder/canvas/SplitPaneHandle.svelte';
	import { BUILDER_CANVAS_SPLIT } from '$lib/features/builder/canvas/split-pane';

	type Props = {
		primary?: Snippet;
		secondary?: Snippet;
		minPrimary?: number;
		minSecondary?: number;
		defaultRatio?: number;
		mobileBreakpoint?: number;
		keyboardStep?: number;
		handleWidth?: number;
		label?: string;
	};

	let {
		primary,
		secondary,
		minPrimary = BUILDER_CANVAS_SPLIT.minPrimary,
		minSecondary = BUILDER_CANVAS_SPLIT.minSecondary,
		defaultRatio = BUILDER_CANVAS_SPLIT.defaultRatio,
		mobileBreakpoint = BUILDER_CANVAS_SPLIT.mobileBreakpoint,
		keyboardStep = BUILDER_CANVAS_SPLIT.keyboardStep,
		handleWidth = BUILDER_CANVAS_SPLIT.handleWidth,
		label = 'Resize panels'
	}: Props = $props();

	let containerElement = $state<HTMLElement | null>(null);
	let containerWidth = $state(0);
	let primaryWidth = $state(0);
	let primaryRatio = $state(0);
	let hasMeasured = $state(false);

	const isDesktop = $derived(containerWidth >= mobileBreakpoint);
	const maxPrimaryWidth = $derived(Math.max(minPrimary, containerWidth - handleWidth - minSecondary));

	function clampPrimaryWidth(width: number, totalWidth: number) {
		const maxWidth = Math.max(minPrimary, totalWidth - handleWidth - minSecondary);

		return Math.min(Math.max(width, minPrimary), maxWidth);
	}

	function syncPrimaryWidth() {
		if (!isDesktop || containerWidth <= 0) {
			return;
		}

		primaryWidth = clampPrimaryWidth(containerWidth * primaryRatio, containerWidth);
	}

	function handlePrimaryWidthChange(nextWidth: number) {
		if (containerWidth <= 0) {
			return;
		}

		const clampedWidth = clampPrimaryWidth(nextWidth, containerWidth);
		primaryWidth = clampedWidth;
		primaryRatio = clampedWidth / containerWidth;
	}

	onMount(() => {
		if (!containerElement) {
			return;
		}

		primaryRatio = defaultRatio;

		function updateContainerWidth() {
			if (!containerElement) {
				return;
			}

			containerWidth = containerElement.getBoundingClientRect().width;
			hasMeasured = true;
		}

		const observer = new ResizeObserver(updateContainerWidth);
		observer.observe(containerElement);
		updateContainerWidth();

		return () => {
			observer.disconnect();
		};
	});

	$effect(() => {
		void containerWidth;
		void isDesktop;
		syncPrimaryWidth();
	});
</script>

<div
	bind:this={containerElement}
	class="split-pane"
	class:split-pane--desktop={hasMeasured && isDesktop}
	style={`--split-pane-primary-width: ${primaryWidth}px; --split-pane-handle-width: ${handleWidth}px;`}
>
	{#if hasMeasured}
		{#if isDesktop}
			<section class="split-pane__primary">
				{@render primary?.()}
			</section>

			<SplitPaneHandle
				value={primaryWidth}
				min={minPrimary}
				max={maxPrimaryWidth}
				step={keyboardStep}
				{label}
				onValueChange={handlePrimaryWidthChange}
			/>

			<section class="split-pane__secondary">
				{@render secondary?.()}
			</section>
		{:else}
			<section class="split-pane__primary">
				{@render primary?.()}
			</section>
		{/if}
	{/if}
</div>

<style>
	.split-pane {
		display: flex;
		min-height: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: white;
	}

	.split-pane--desktop {
		display: grid;
		grid-template-columns:
			minmax(0, var(--split-pane-primary-width))
			var(--split-pane-handle-width)
			minmax(0, 1fr);
	}

	.split-pane__primary,
	.split-pane__secondary {
		min-width: 0;
		min-height: 0;
		overflow: hidden;
	}
</style>
