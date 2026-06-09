<script lang="ts">
	import EmailAttachmentCard from '$lib/features/email-formats/drafts/EmailAttachmentCard.svelte';
	import type { FormatSpreadsheetAttachment } from '$lib/features/format-starters/domain';

	type Props = {
		attachment: FormatSpreadsheetAttachment | null;
		inputValue: string;
		editable: boolean;
		onInput: (value: string) => void;
		onAdd: () => void;
		onOpen: () => void;
		onRemove: () => void;
	};

	let {
		attachment,
		inputValue,
		editable,
		onInput,
		onAdd,
		onOpen,
		onRemove
	}: Props = $props();
</script>

{#if attachment}
	<EmailAttachmentCard
		filename={attachment.filename}
		removable={editable}
		{onOpen}
		onRemove={editable ? onRemove : undefined}
	/>
{:else if !editable}
	<p class="min-w-0 text-[0.79rem] text-stone-400">No attachment</p>
{:else}
	<input
		value={inputValue}
		aria-label="Spreadsheet attachment"
		placeholder="Attach a spreadsheet"
		class="w-full min-w-0 border-0 bg-transparent p-0 text-[0.79rem] text-stone-800 outline-none placeholder:text-stone-400"
		oninput={(event) => {
			onInput(event.currentTarget.value);
		}}
		onkeydown={(event) => {
			if (event.key === 'Enter') {
				event.preventDefault();
				onAdd();
			}
		}}
	/>
{/if}
