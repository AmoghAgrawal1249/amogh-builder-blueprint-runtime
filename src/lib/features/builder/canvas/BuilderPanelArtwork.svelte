<script lang="ts">
	import type { ComponentType } from 'svelte';

	type Props = {
		backColor: string;
		frontColor: string;
		icon: ComponentType;
		iconCenterX: string;
		iconCenterY: string;
	};

	let { backColor, frontColor, icon: Icon, iconCenterX, iconCenterY }: Props = $props();
</script>

<div
	class="panel-artwork"
	style:--panel-artwork-back={backColor}
	style:--panel-artwork-front={frontColor}
	style:--panel-artwork-icon-x={iconCenterX}
	style:--panel-artwork-icon-y={iconCenterY}
	aria-hidden="true"
>
	<svg class="panel-artwork__shapes" viewBox="0 0 220 180" fill="none">
		<path
			d="M33 67C33 61.5 36.6 56.7 41.8 55.2L142.8 26.5C149.1 24.7 155.3 29.3 155.3 35.9C155.3 42.4 161.5 47.1 167.8 45.3L178.3 42.3C184.6 40.5 190.8 45.2 190.8 51.7V134.3C190.8 139.8 187.2 144.6 182 146.1L95.4 170.7C89.1 172.5 82.9 167.8 82.9 161.3C82.9 154.8 76.7 150.1 70.4 151.9L45.5 158.9C39.2 160.7 33 156.1 33 149.5V67Z"
			fill="var(--panel-artwork-back)"
		/>
		<path
			d="M53 48.9C53 43.3 56.7 38.5 62.1 37.1L164.8 9.6C171 7.9 177.1 12.6 177.1 19.1C177.1 25.6 183.3 30.3 189.6 28.5L198 26.2C204.3 24.5 210.5 29.2 210.5 35.7V119.9C210.5 125.5 206.8 130.3 201.4 131.7L115.8 154.6C109.5 156.3 103.4 151.6 103.4 145.1C103.4 138.6 97.2 133.9 90.9 135.7L65.5 142.5C59.2 144.2 53 139.5 53 133V48.9Z"
			fill="var(--panel-artwork-front)"
		/>
	</svg>

	<div class="panel-artwork__icon">
		<Icon />
	</div>
</div>

<style>
	.panel-artwork {
		position: relative;
		margin-inline: auto;
		width: min(6.75rem, 52%);
		aspect-ratio: 1.22;
	}

	.panel-artwork__shapes {
		display: block;
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.panel-artwork__icon {
		position: absolute;
		top: var(--panel-artwork-icon-y);
		left: var(--panel-artwork-icon-x);
		width: 1.8rem;
		height: 1.8rem;
		color: #09090b;
		stroke-width: 2.15;
		transform: translate(-50%, -50%);
	}

	.panel-artwork__icon :global(svg) {
		width: 100%;
		height: 100%;
		stroke-width: inherit;
	}
</style>
