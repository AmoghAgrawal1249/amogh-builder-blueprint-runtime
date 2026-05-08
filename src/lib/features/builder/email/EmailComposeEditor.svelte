<script lang="ts">
	import {
		addEditableAttachment,
		removeEditableAttachment,
		type EditableEmailDraft
	} from '$lib/features/builder/email/email-editable-draft';
	import EmailAttachmentCard from '$lib/features/builder/email/EmailAttachmentCard.svelte';
	import EmailComposeDocument from '$lib/features/builder/email/EmailComposeDocument.svelte';

	type Props = {
		editableDraft: EditableEmailDraft;
		disabled?: boolean;
		onDraftChange: (draft: EditableEmailDraft) => void;
	};

	let { editableDraft, disabled = false, onDraftChange }: Props = $props();
	let fireReasonTextareaElement = $state<HTMLTextAreaElement | null>(null);

	function updateDraft(patch: Partial<EditableEmailDraft>) {
		onDraftChange({
			...editableDraft,
			...patch
		});
	}

	function addAttachment() {
		onDraftChange(addEditableAttachment(editableDraft, editableDraft.attachmentInputText));
	}

	function syncFireReasonTextareaHeight() {
		if (!fireReasonTextareaElement) {
			return;
		}

		fireReasonTextareaElement.style.height = '0px';
		fireReasonTextareaElement.style.height = `${fireReasonTextareaElement.scrollHeight}px`;
	}

	$effect(() => {
		void fireReasonTextareaElement;
		void editableDraft.fireReasonText;
		syncFireReasonTextareaHeight();
	});
</script>

<EmailComposeDocument>
	{#snippet to()}
		<input
			value={editableDraft.toText}
			aria-label="To recipients"
			placeholder="Recipients"
			{disabled}
			class="h-8 min-w-0 flex-1 border-0 bg-transparent p-0 text-[0.78rem] text-zinc-800 outline-none placeholder:text-zinc-400 disabled:cursor-default disabled:opacity-60"
			oninput={(event) => updateDraft({ toText: event.currentTarget.value })}
		/>
	{/snippet}

	{#snippet cc()}
		<input
			value={editableDraft.ccText}
			aria-label="Cc recipients"
			placeholder="Cc recipients"
			{disabled}
			class="h-8 min-w-0 flex-1 border-0 bg-transparent p-0 text-[0.78rem] text-zinc-800 outline-none placeholder:text-zinc-400 disabled:cursor-default disabled:opacity-60"
			oninput={(event) => updateDraft({ ccText: event.currentTarget.value })}
		/>
	{/snippet}

	{#snippet attachments()}
		<input
			value={editableDraft.attachmentInputText}
			aria-label="PDF attachment"
			placeholder="Attach a PDF"
			{disabled}
			class="h-8 w-full min-w-0 border-0 bg-transparent p-0 text-[0.82rem] text-zinc-950 outline-none placeholder:text-zinc-500 disabled:cursor-default disabled:opacity-60"
			oninput={(event) => updateDraft({ attachmentInputText: event.currentTarget.value })}
			onkeydown={(event) => {
				if (event.key === 'Enter') {
					event.preventDefault();
					addAttachment();
				}
			}}
		/>

		{#if editableDraft.attachments.length > 0}
			<div class="mt-2 flex flex-wrap gap-2">
				{#each editableDraft.attachments as attachment, attachmentIndex (`${attachment}:${attachmentIndex}`)}
					<EmailAttachmentCard
						filename={attachment}
						removable
						onRemove={() => onDraftChange(removeEditableAttachment(editableDraft, attachmentIndex))}
					/>
				{/each}
			</div>
		{/if}
	{/snippet}

	{#snippet body()}
		<textarea
			value={editableDraft.bodyText}
			aria-label="Email body"
			placeholder="Add email body"
			{disabled}
			class="min-h-72 w-full resize-none border-0 bg-transparent p-0 text-[0.82rem] leading-[1.52] text-zinc-900 outline-none placeholder:text-zinc-500 disabled:cursor-default disabled:opacity-60"
			oninput={(event) => updateDraft({ bodyText: event.currentTarget.value })}
		></textarea>
	{/snippet}

	{#snippet fireReason()}
		<textarea
			bind:this={fireReasonTextareaElement}
			id="email-fire-reason"
			value={editableDraft.fireReasonText}
			rows={1}
			aria-label="Why this email fires"
			placeholder="Describe the trigger rule"
			{disabled}
			class="block w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-[0.76rem] leading-relaxed text-zinc-800 outline-none placeholder:text-zinc-400 disabled:cursor-default disabled:opacity-60"
			oninput={(event) => updateDraft({ fireReasonText: event.currentTarget.value })}
		></textarea>
	{/snippet}
</EmailComposeDocument>
