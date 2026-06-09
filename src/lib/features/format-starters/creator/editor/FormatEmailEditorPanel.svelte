<script lang="ts">
	import EmailComposeDocument from '$lib/features/email-formats/drafts/EmailComposeDocument.svelte';
	import {
		createDefaultFormatSpreadsheetAttachment,
		normalizeFormatAttachmentName,
		type FormatVariableDefinition
	} from '$lib/features/format-starters/domain';
	import FormatEmailAttachmentField from './FormatEmailAttachmentField.svelte';
	import FormatEmailBodyEditor from './FormatEmailBodyEditor.svelte';
	import FormatEmailRecipientField from './FormatEmailRecipientField.svelte';
	import FormatSpreadsheetAttachmentEditor from './FormatSpreadsheetAttachmentEditor.svelte';
	import type { EmailFormatContentEditPolicy } from '$domain/email-formats';
	import type { FormatContentEditorState } from '../state/format-content-editor-state.svelte';
	import type { FormatVariableInsertionRequest } from '../state/format-creator-state.svelte';
	import type { FormatVariableDragCoordinator } from '../variables/format-variable-drag-coordinator.svelte';

	const EDIT_ALL_CONTENT_FIELDS = {
		title: true,
		to: true,
		cc: true,
		attachment: true,
		body: true
	} satisfies EmailFormatContentEditPolicy;

	const EDIT_NO_CONTENT_FIELDS = {
		title: false,
		to: false,
		cc: false,
		attachment: false,
		body: false
	} satisfies EmailFormatContentEditPolicy;

	type Props = {
		editor: FormatContentEditorState;
		variables: readonly FormatVariableDefinition[];
		dragCoordinator: FormatVariableDragCoordinator;
		editPolicy?: EmailFormatContentEditPolicy;
		readOnly?: boolean;
		variableInsertionRequest?: FormatVariableInsertionRequest | null;
		onVariableInsertionRequestHandled?: (requestId: number) => void;
	};

	let {
		editor,
		variables,
		dragCoordinator,
		editPolicy = EDIT_ALL_CONTENT_FIELDS,
		readOnly = false,
		variableInsertionRequest = null,
		onVariableInsertionRequestHandled
	}: Props = $props();
	const activeEditPolicy = $derived(readOnly ? EDIT_NO_CONTENT_FIELDS : editPolicy);
	const bodyInsertionRequest = $derived(
		variableInsertionRequest?.target === 'body' ? variableInsertionRequest : null
	);
	const spreadsheetInsertionRequest = $derived(
		variableInsertionRequest?.target === 'spreadsheet' ? variableInsertionRequest : null
	);

	function addAttachment() {
		const attachmentName = normalizeFormatAttachmentName(editor.attachmentInputText);

		if (!attachmentName) {
			return;
		}

		editor.addAttachment(createDefaultFormatSpreadsheetAttachment(attachmentName));
	}

	function removeAttachment() {
		editor.removeAttachment((filename) => window.confirm(`Delete ${filename}?`));
	}
</script>

<section
	class="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white text-stone-950"
	aria-label="Create format email editor"
>
	<div
		class={editor.isAttachmentOpen && editor.activeEmailContent.attachment
			? 'min-h-0 flex-1 overflow-hidden'
			: 'min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5 md:py-5'}
	>
		{#if editor.isAttachmentOpen && editor.activeEmailContent.attachment}
			<div class="flex h-full min-h-0 w-full flex-col">
				<FormatSpreadsheetAttachmentEditor
					attachment={editor.activeEmailContent.attachment}
					{variables}
					{dragCoordinator}
					disabled={!activeEditPolicy.attachment}
					variableInsertionRequest={spreadsheetInsertionRequest}
					{onVariableInsertionRequestHandled}
					onAttachmentChange={editor.setOpenAttachment}
					onClose={editor.closeAttachment}
				/>
			</div>
		{:else}
			<div class="mx-auto flex min-h-full w-full max-w-[820px] flex-col">
				<EmailComposeDocument>
					{#snippet to()}
						<FormatEmailRecipientField
							value={editor.toInputText}
							readonlyValue={editor.activeEmailContent.to}
							editable={activeEditPolicy.to}
							ariaLabel="To recipients"
							placeholder="Add recipients"
							onFocus={() => {
								editor.isEditingTo = true;
							}}
							onInput={(value) => editor.setRecipientInput('to', value)}
							onCommit={(value) => editor.commitRecipientInput('to', value)}
						/>
					{/snippet}

					{#snippet cc()}
						<FormatEmailRecipientField
							value={editor.ccInputText}
							readonlyValue={editor.activeEmailContent.cc}
							editable={activeEditPolicy.cc}
							ariaLabel="Cc recipients"
							placeholder="Add Cc recipients"
							onFocus={() => {
								editor.isEditingCc = true;
							}}
							onInput={(value) => editor.setRecipientInput('cc', value)}
							onCommit={(value) => editor.commitRecipientInput('cc', value)}
						/>
					{/snippet}

					{#snippet attachment()}
						<FormatEmailAttachmentField
							attachment={editor.activeEmailContent.attachment}
							inputValue={editor.attachmentInputText}
							editable={activeEditPolicy.attachment}
							onInput={editor.updateAttachmentInput}
							onAdd={addAttachment}
							onOpen={editor.openAttachment}
							onRemove={removeAttachment}
						/>
					{/snippet}

					{#snippet body()}
						<FormatEmailBodyEditor
							body={editor.activeEmailContent.body}
							{variables}
							{dragCoordinator}
							disabled={!activeEditPolicy.body}
							variableInsertionRequest={bodyInsertionRequest}
							{onVariableInsertionRequestHandled}
							onBodyChange={editor.updateBody}
						/>
					{/snippet}
				</EmailComposeDocument>
			</div>
		{/if}
	</div>
</section>
