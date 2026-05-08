<script lang="ts">
	import { cn } from '$lib/components/chrome/shared/cn';

	type Props = {
		step: number;
		totalSteps: number;
		canGoPrevious: boolean;
		canGoNext: boolean;
		onPrevious: () => void;
		onNext: () => void;
	};

	let { step, totalSteps, canGoPrevious, canGoNext, onPrevious, onNext }: Props = $props();
	const pageLabel = $derived(`${step} of ${totalSteps}`);
	const showPager = $derived(totalSteps > 1);
</script>

{#if showPager}
	<div class="flex shrink-0 items-center gap-1 text-[0.72rem] text-zinc-500">
		<button
			type="button"
			aria-label="Previous question"
			class={cn(
				'grid size-5 place-items-center rounded-[6px] disabled:cursor-default disabled:hover:bg-transparent',
				canGoPrevious ? 'text-zinc-500 hover:bg-zinc-100' : 'text-zinc-300'
			)}
			disabled={!canGoPrevious}
			onclick={onPrevious}
		>
			<span class="text-[1rem] leading-none">‹</span>
		</button>
		<span>{pageLabel}</span>
		<button
			type="button"
			aria-label="Next question"
			class={cn(
				'grid size-5 place-items-center rounded-[6px] disabled:cursor-default disabled:hover:bg-transparent',
				canGoNext ? 'text-zinc-500 hover:bg-zinc-100' : 'text-zinc-300'
			)}
			disabled={!canGoNext}
			onclick={onNext}
		>
			<span class="text-[1rem] leading-none">›</span>
		</button>
	</div>
{/if}
