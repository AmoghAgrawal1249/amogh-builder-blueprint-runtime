<script lang="ts">
	import type { ClassValue } from 'clsx';
	import {
		DATA_SOURCE_LOGO_REGISTRY,
		type DataSourceId
	} from '$lib/features/format-starters/data-sources';
	import { cn } from '$lib/ui/cn';

	type Props = {
		dataSourceIds: readonly DataSourceId[];
		class?: ClassValue;
	};

	let { dataSourceIds, class: className }: Props = $props();
	const logos = $derived(
		dataSourceIds.map((id) => ({
			id,
			...DATA_SOURCE_LOGO_REGISTRY[id]
		}))
	);
	const ariaLabel = $derived(
		logos.length > 0 ? `Uses ${formatDataSourceLabels(logos.map((logo) => logo.label))}` : undefined
	);

	function formatDataSourceLabels(labels: readonly string[]) {
		if (labels.length <= 2) {
			return labels.join(' and ');
		}

		return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
	}
</script>

{#if logos.length > 0}
	<div
		class={cn('pointer-events-none flex items-center justify-end', className)}
		role="img"
		aria-label={ariaLabel}
	>
		{#each logos as logo (logo.id)}
			<span
				class="-ml-1 flex size-6 items-center justify-center rounded-full bg-white ring-1 ring-stone-200/80 first:ml-0"
			>
				<img
					src={logo.logoSrc}
					alt=""
					class="size-4 rounded-full object-contain"
					draggable="false"
				/>
			</span>
		{/each}
	</div>
{/if}
