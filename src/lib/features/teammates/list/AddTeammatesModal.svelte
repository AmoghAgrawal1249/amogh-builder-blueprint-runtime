<script lang="ts">
	import { Button, ModalShell } from '$lib/ui';

	type Props = {
		error: string | null;
		isAdding: boolean;
		open: boolean;
		value: string;
		onClose: () => void;
		onSubmit: () => void | Promise<void>;
		onValueChange: (value: string) => void;
	};

	let {
		error,
		isAdding,
		open,
		value,
		onClose,
		onSubmit,
		onValueChange
	}: Props = $props();
</script>

<ModalShell {open} title="Add team members" onClose={onClose}>
	<label for="teammate-emails" class="block text-xs text-stone-950">List team member emails separated by commas</label>
	<textarea
		id="teammate-emails"
		{value}
		placeholder="alex@example.com, sam@example.com, jordan@example.com"
		class="mt-2 min-h-44 w-full resize-y rounded-sm border border-stone-200/80 bg-white px-3 py-3 text-sm leading-[1.45] text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400"
		oninput={(event) => onValueChange(event.currentTarget.value)}
	></textarea>
	{#if error}
		<p class="mt-2 text-[0.72rem] text-red-700">{error}</p>
	{/if}

	{#snippet footer()}
		<Button variant="secondary" disabled={isAdding} onclick={onClose}>Cancel</Button>
		<Button disabled={isAdding} onclick={() => void onSubmit()}>
			{isAdding ? 'Adding...' : 'Add team members'}
		</Button>
	{/snippet}
</ModalShell>
