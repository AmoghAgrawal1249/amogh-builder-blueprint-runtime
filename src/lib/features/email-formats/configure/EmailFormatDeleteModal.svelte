<script lang="ts">
	import { Button, destructiveButtonClass, ModalShell } from '$lib/ui';

	type Props = {
		open: boolean;
		title: string;
		deleting: boolean;
		error: string | null;
		onClose: () => void;
		onConfirm: () => void | Promise<void>;
	};

	let { open, title, deleting, error, onClose, onConfirm }: Props = $props();
</script>

<ModalShell {open} title="Delete email format" onClose={onClose}>
	<div class="space-y-4">
		<p class="text-sm leading-6 text-stone-700">
			This permanently deletes <span class="font-medium text-stone-950">{title}</span>.
		</p>

		{#if error}
			<p class="text-[0.72rem] leading-5 text-red-700">{error}</p>
		{/if}
	</div>

	{#snippet footer()}
		<Button variant="secondary" disabled={deleting} onclick={onClose}>Cancel</Button>
		<Button disabled={deleting} class={destructiveButtonClass} onclick={onConfirm}>
			{deleting ? 'Deleting...' : 'Delete'}
		</Button>
	{/snippet}
</ModalShell>
