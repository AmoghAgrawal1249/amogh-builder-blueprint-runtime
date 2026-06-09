<script lang="ts">
	import type { ClassValue } from 'clsx';
	import QuestionIcon from 'phosphor-svelte/lib/QuestionIcon';
	import FloatingTooltip, { type FloatingTooltipPlacement } from './FloatingTooltip.svelte';
	import { cn } from './cn';

	type Props = {
		id: string;
		text?: string | null;
		ariaLabel?: string;
		placement?: FloatingTooltipPlacement;
		triggerClass?: ClassValue;
	};

	let {
		id,
		text = null,
		ariaLabel = 'Help',
		placement = 'bottom-start',
		triggerClass = 'grid size-5 place-items-center rounded-[6px] text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 focus-visible:bg-stone-100 focus-visible:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300'
	}: Props = $props();

	const helpText = $derived(text?.trim() ?? '');
</script>

<FloatingTooltip {id} text={helpText} {placement}>
	{#snippet trigger({ describedBy })}
		<button
			type="button"
			class={cn(triggerClass)}
			aria-label={ariaLabel}
			aria-describedby={describedBy}
		>
			<QuestionIcon size={14} weight="regular" />
		</button>
	{/snippet}
</FloatingTooltip>
