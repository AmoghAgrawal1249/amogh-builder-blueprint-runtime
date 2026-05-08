<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';

	type Props = {
		canGoNext: boolean;
		onNext: () => void;
		onSubmit: () => void | Promise<void>;
	};

	let { canGoNext, onNext, onSubmit }: Props = $props();
	const primaryActionLabel = $derived(canGoNext ? 'Next' : 'Submit');
</script>

<div class="flex items-center gap-2 self-end">
	<button
		type="button"
		class="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-sm border border-zinc-200 bg-white px-3.5 text-[0.72rem] font-medium text-zinc-900 md:text-[0.74rem]"
		disabled
	>
		Skip all
	</button>
	<button
		type="button"
		class="inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-sm bg-zinc-950 px-3.5 text-[0.72rem] font-medium text-white md:text-[0.74rem]"
		onclick={() => {
			if (canGoNext) {
				onNext();
			} else {
				void onSubmit();
			}
		}}
	>
		<span>{primaryActionLabel}</span>
		{#if canGoNext}
			<ArrowRight class="size-3.75" />
		{/if}
	</button>
</div>
