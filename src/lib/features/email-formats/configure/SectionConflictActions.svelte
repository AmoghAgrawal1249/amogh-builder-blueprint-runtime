<script lang="ts">
	import { Button } from '$lib/ui';

	type Props = {
		conflict: boolean;
		isSaving?: boolean;
		onKeepMine: () => void | Promise<void>;
		onUseLatest: () => void;
	};

	let { conflict, isSaving = false, onKeepMine, onUseLatest }: Props = $props();
</script>

{#if conflict}
	<div class="flex min-w-0 flex-wrap items-center gap-2">
		<p class="min-w-0 text-[0.68rem] leading-snug text-amber-700">
			This section changed elsewhere.
		</p>
		<Button
			variant="secondary"
			class="h-7 px-2.5 text-[0.68rem] text-stone-800"
			disabled={isSaving}
			onclick={() => void onKeepMine()}
		>
			Keep mine
		</Button>
		<Button
			variant="ghost"
			class="h-7 px-2.5 text-[0.68rem] text-stone-700"
			disabled={isSaving}
			onclick={onUseLatest}
		>
			Use latest
		</Button>
	</div>
{/if}
