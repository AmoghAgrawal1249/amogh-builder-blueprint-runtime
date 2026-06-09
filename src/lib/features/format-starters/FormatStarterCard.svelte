<script lang="ts">
	import { resolve } from '$app/paths';
	import { createFormatLink } from '$lib/app/app-links';
	import FormatStarterPreviewCard, {
		type EmailPreviewFrame
	} from '$lib/features/format-starters/FormatStarterPreviewCard.svelte';
	import type { FormatStarterCardEntry } from '$lib/features/format-starters/catalog';
	import { cn } from '$lib/ui/cn';

	type Props = {
		formatStarter: FormatStarterCardEntry;
		disabled?: boolean;
		emailPreviewFrame?: EmailPreviewFrame;
		showDataSources?: boolean;
		onclick?: (event: MouseEvent) => void;
		onfocus?: () => void;
		onpointerenter?: () => void;
	};

	let {
		formatStarter,
		disabled = false,
		emailPreviewFrame = 'standard',
		showDataSources = true,
		onclick,
		onfocus,
		onpointerenter
	}: Props = $props();
	const link = $derived(createFormatLink(formatStarter.slug));
	const cardClass = $derived(
		cn(
			'format-starter-card block w-full rounded-md p-1.5 text-left outline-none transition-colors focus-visible:bg-stone-100/80 focus-visible:ring-2 focus-visible:ring-stone-300 aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-60',
			'bg-white hover:bg-stone-50'
		)
	);
</script>

<a
	href={resolve(link.routeId, { formatStarterSlug: formatStarter.slug })}
	class={cardClass}
	aria-label={`Start with ${formatStarter.title}`}
	aria-disabled={disabled || undefined}
	tabindex={disabled ? -1 : undefined}
	{onclick}
	{onfocus}
	{onpointerenter}
>
	<FormatStarterPreviewCard
		title={formatStarter.title}
		description={formatStarter.description}
		dataSourceIds={formatStarter.dataSourceIds}
		sampleEmail={formatStarter.sampleEmail}
		{emailPreviewFrame}
		{showDataSources}
	/>
</a>
