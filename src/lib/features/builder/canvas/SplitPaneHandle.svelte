<script lang="ts">
	import { onMount } from 'svelte';

	type Props = {
		value: number;
		min: number;
		max: number;
		step: number;
		label: string;
		onValueChange: (value: number) => void;
	};

	let {
		value,
		min,
		max,
		step,
		label,
		onValueChange
	}: Props = $props();

	let isDragging = $state(false);
	let startClientX = 0;
	let startValue = 0;

	function clampValue(nextValue: number) {
		return Math.min(Math.max(nextValue, min), max);
	}

	function setDragging(nextIsDragging: boolean) {
		isDragging = nextIsDragging;
		document.body.style.cursor = nextIsDragging ? 'col-resize' : '';
		document.body.style.userSelect = nextIsDragging ? 'none' : '';
	}

	function handlePointerDown(event: PointerEvent) {
		event.preventDefault();
		startClientX = event.clientX;
		startValue = value;
		setDragging(true);
	}

	function handlePointerMove(event: PointerEvent) {
		if (!isDragging) {
			return;
		}

		onValueChange(clampValue(startValue + event.clientX - startClientX));
	}

	function handlePointerEnd() {
		if (!isDragging) {
			return;
		}

		setDragging(false);
	}

	function handleKeydown(event: KeyboardEvent) {
		let nextValue: number;

		switch (event.key) {
			case 'ArrowLeft':
				nextValue = value - step;
				break;
			case 'ArrowRight':
				nextValue = value + step;
				break;
			case 'Home':
				nextValue = min;
				break;
			case 'End':
				nextValue = max;
				break;
			default:
				return;
		}

		event.preventDefault();
		onValueChange(clampValue(nextValue));
	}

	function separatorInteractions(node: HTMLElement) {
		node.addEventListener('pointerdown', handlePointerDown);
		node.addEventListener('keydown', handleKeydown);

		return {
			destroy() {
				node.removeEventListener('pointerdown', handlePointerDown);
				node.removeEventListener('keydown', handleKeydown);
			}
		};
	}

	onMount(() => {
		return () => {
			setDragging(false);
		};
	});
</script>

<svelte:window
	onpointermove={handlePointerMove}
	onpointerup={handlePointerEnd}
	onpointercancel={handlePointerEnd}
/>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class="split-pane-handle"
	class:split-pane-handle--dragging={isDragging}
	role="separator"
	tabindex="0"
	aria-label={label}
	aria-orientation="vertical"
	aria-valuemin={Math.round(min)}
	aria-valuemax={Math.round(max)}
	aria-valuenow={Math.round(value)}
	use:separatorInteractions
>
	<span class="split-pane-handle__line" aria-hidden="true"></span>
	<span class="split-pane-handle__grip" aria-hidden="true"></span>
</div>

<style>
	.split-pane-handle {
		position: relative;
		width: 1px;
		min-width: 1px;
		background: #f1f1f2;
		cursor: col-resize;
		outline: none;
		touch-action: none;
	}

	.split-pane-handle::before {
		position: absolute;
		z-index: 1;
		inset: 0 -0.5rem;
		content: '';
	}

	.split-pane-handle__line {
		position: absolute;
		inset: 0;
		background: #f1f1f2;
	}

	.split-pane-handle__grip {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 3px;
		height: 3.5rem;
		border-radius: 999px;
		background: #e4e4e7;
		opacity: 0;
		transform: translate(-50%, -50%);
		transition:
			opacity 120ms ease,
			background 120ms ease;
	}

	.split-pane-handle:hover .split-pane-handle__grip,
	.split-pane-handle:focus-visible .split-pane-handle__grip,
	.split-pane-handle--dragging .split-pane-handle__grip {
		opacity: 1;
		background: #d4d4d8;
	}
</style>
