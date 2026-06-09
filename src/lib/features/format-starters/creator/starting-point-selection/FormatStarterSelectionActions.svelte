<script lang="ts">
	import ArrowRightIcon from 'phosphor-svelte/lib/ArrowRightIcon';
	import { Button } from '$lib/ui';
	import FormatCreatorActionBar from '../layout/FormatCreatorActionBar.svelte';

	type Props = {
		skipActionLabel: string;
		primaryActionLabel: string;
		canGoNext: boolean;
		primaryDisabled: boolean;
		onSkip: () => void;
		onPrimary: () => void;
	};

	let {
		skipActionLabel,
		primaryActionLabel,
		canGoNext,
		primaryDisabled,
		onSkip,
		onPrimary
	}: Props = $props();
</script>

<FormatCreatorActionBar>
	{#snippet secondary()}
		<Button
			variant="secondary"
			class="h-10 w-full border-transparent bg-transparent text-[0.74rem] text-stone-500 hover:bg-stone-50 md:h-8 md:w-auto md:border-stone-200/60 md:bg-white md:px-2.5 md:text-[0.74rem] md:text-stone-900"
			onclick={onSkip}
		>
			{skipActionLabel}
		</Button>
	{/snippet}

	{#snippet primary()}
		<Button
			variant="primary"
			class="h-10 w-full gap-2 text-[0.8rem] md:h-8 md:w-auto md:gap-1.5 md:px-2.5 md:text-[0.74rem]"
			disabled={primaryDisabled}
			onclick={onPrimary}
		>
			<span>{primaryActionLabel}</span>
			{#snippet trailing()}
				{#if canGoNext}
					<ArrowRightIcon size={15} weight="regular" />
				{/if}
			{/snippet}
		</Button>
	{/snippet}
</FormatCreatorActionBar>
