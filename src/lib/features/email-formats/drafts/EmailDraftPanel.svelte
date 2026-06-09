<script lang="ts">
	import {
		createDefaultEmailDraft,
		type EmailDraft
	} from './email-drafts';
	import {
		fromEditableEmailDraft,
		toEditableEmailDraft,
		type EditableEmailDraft
	} from '$lib/features/email-formats/drafts/email-editable-draft';
	import EmailComposeEditor from '$lib/features/email-formats/drafts/EmailComposeEditor.svelte';
	import EmailComposePreview from '$lib/features/email-formats/drafts/EmailComposePreview.svelte';
	import EmailAttachmentSpreadsheetPreview from '$lib/features/email-formats/drafts/EmailAttachmentSpreadsheetPreview.svelte';
	import { Button } from '$lib/ui';

	type Props = {
		draft: EmailDraft;
		emailDraftVersion?: number;
		canEdit?: boolean;
		onSave: (draft: EmailDraft, baseEmailDraftVersion: number) => void | Promise<void>;
	};

	let {
		draft,
		emailDraftVersion = 0,
		canEdit = false,
		onSave
	}: Props = $props();

	let isEditing = $state(false);
	let isSaving = $state(false);
	let saveError = $state<string | null>(null);
	let editableDraft = $state<EditableEmailDraft>(toEditableEmailDraft(createDefaultEmailDraft()));
	let editingBaseEmailDraftVersion = $state(0);
	let isAttachmentOpen = $state(false);
	const openAttachment = $derived(isEditing ? editableDraft.attachment : draft.attachment);

	function beginEdit() {
		editableDraft = toEditableEmailDraft(draft);
		editingBaseEmailDraftVersion = emailDraftVersion;
		saveError = null;
		isEditing = true;
	}

	function cancelEdit() {
		saveError = null;
		isEditing = false;
		isAttachmentOpen = false;
	}

	function showAttachment() {
		isAttachmentOpen = true;
	}

	function closeAttachment() {
		isAttachmentOpen = false;
	}

	function updateOpenAttachment(attachment: NonNullable<EditableEmailDraft['attachment']>) {
		editableDraft = {
			...editableDraft,
			attachment
		};
	}

	async function saveDraft() {
		if (isSaving) {
			return;
		}

		isSaving = true;
		saveError = null;

		try {
			await onSave(fromEditableEmailDraft(editableDraft), editingBaseEmailDraftVersion);
			isEditing = false;
		} catch (error) {
			saveError = error instanceof Error ? error.message : 'Could not save draft edits.';
		} finally {
			isSaving = false;
		}
	}
</script>

<aside class="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white text-stone-950">
	<div
		class={isAttachmentOpen && openAttachment
			? 'min-h-0 flex-1 overflow-hidden'
			: 'min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5 md:py-5'}
	>
		{#if isAttachmentOpen && openAttachment}
			<div class="flex h-full min-h-0 w-full flex-col">
				<EmailAttachmentSpreadsheetPreview
					attachment={openAttachment}
					editable={isEditing}
					disabled={isSaving}
					onAttachmentChange={isEditing ? updateOpenAttachment : undefined}
					onClose={closeAttachment}
				/>
			</div>
		{:else}
			<div class="mx-auto flex min-h-full w-full max-w-[820px] flex-col">
				{#if isEditing}
					<EmailComposeEditor
						{editableDraft}
						disabled={isSaving}
						onDraftChange={(nextDraft) => (editableDraft = nextDraft)}
						onOpenAttachment={showAttachment}
					/>
				{:else}
					<EmailComposePreview {draft} onOpenAttachment={showAttachment} />
				{/if}
			</div>
		{/if}
	</div>

	<div class="shrink-0 border-t border-stone-100 bg-white px-4 py-3 md:px-5">
		{#if saveError}
			<p class="mb-2 text-[0.68rem] leading-snug text-red-600">{saveError}</p>
		{/if}

		<div class="flex items-center justify-end gap-2">
			{#if isEditing}
				<Button
					variant="secondary"
					class="px-3 text-[0.74rem] text-stone-700"
					disabled={isSaving}
					onclick={cancelEdit}
				>
					Cancel
				</Button>
				<Button
					variant="primary"
					class="px-3 text-[0.74rem]"
					disabled={isSaving}
					onclick={() => void saveDraft()}
				>
					{isSaving ? 'Saving...' : 'Save changes'}
				</Button>
			{:else}
				<Button
					variant="secondary"
					class="px-3 text-[0.74rem] text-stone-800"
					disabled={!canEdit}
					onclick={beginEdit}
				>
					Edit email
				</Button>
			{/if}
		</div>
	</div>
</aside>
