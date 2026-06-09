<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/ui/cn';
	import FloatingTooltip from '$lib/ui/FloatingTooltip.svelte';
	import type { FloatingTooltipPlacement } from '$lib/ui/FloatingTooltip.svelte';
	import { inlineLinkClass as baseInlineLinkClass } from '$lib/ui/link-styles';
	import type { InlineTextContent } from '$lib/ui/inline-text';

	type Props = {
		content: InlineTextContent;
		tooltipIdPrefix: string;
		linkClass?: ClassValue;
		tooltipPlacement?: FloatingTooltipPlacement;
		tooltipTriggerClass?: ClassValue;
	};

	let {
		content,
		tooltipIdPrefix,
		linkClass = '',
		tooltipPlacement = 'bottom-start',
		tooltipTriggerClass = ''
	}: Props = $props();

	const safeTooltipIdPrefix = $derived(tooltipIdPrefix.replace(/[^a-zA-Z0-9_-]/g, '-'));
	const inlineLinkClass = $derived(cn(baseInlineLinkClass, linkClass));
</script>

{#if typeof content === 'string'}
	<span>{content}</span>
{:else}
	{#each content as part, index (`${part.kind}:${index}`)}
		{#if part.kind === 'text'}
			<span>{part.text}</span>
		{:else if part.kind === 'link'}
			<a class={inlineLinkClass} href={resolve(part.href as '/')}>{part.label}</a>
		{:else}
			<FloatingTooltip
				id={`${safeTooltipIdPrefix}-${index}`}
				text={part.tooltipText}
				placement={tooltipPlacement}
			>
				{#snippet trigger({ describedBy })}
					<button
						type="button"
						class={cn(tooltipTriggerClass)}
						aria-label={part.label}
						aria-describedby={describedBy}
					>
						{part.label}
					</button>
				{/snippet}
			</FloatingTooltip>
		{/if}
	{/each}
{/if}
