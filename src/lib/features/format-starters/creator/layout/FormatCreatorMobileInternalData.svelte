<script lang="ts">
	import { Button } from '$lib/ui';
	import FormatEmailEditorPanel from '../editor/FormatEmailEditorPanel.svelte';
	import FormatVariablePickerSheet from '../variables/FormatVariablePickerSheet.svelte';
	import FormatCreateActionBar from './FormatCreateActionBar.svelte';
	import type { FormatStarter } from '$lib/features/format-starters/catalog';
	import type { FormatContentEditorState } from '../state/format-content-editor-state.svelte';
	import type { FormatVariableInsertionRequest } from '../state/format-creator-state.svelte';
	import type { FormatVariableDragCoordinator } from '../variables/format-variable-drag-coordinator.svelte';

	type Props = {
		editor: FormatContentEditorState;
		variablePickerOpen: boolean;
		variableInsertionRequest: FormatVariableInsertionRequest | null;
		onVariableInsertionRequest: (variableId: string) => void;
		onVariablePickerOpen: () => void;
		onVariablePickerClose: () => void;
		onVariableInsertionRequestHandled: (requestId: number) => void;
		formatStarter: FormatStarter;
		variableDragCoordinator: FormatVariableDragCoordinator;
		createFormatDisabled: boolean;
		createFormatLabel: string;
		createFormatError: string | null;
		onCreateEmailFormat: () => void;
	};

	let {
		editor,
		variablePickerOpen,
		variableInsertionRequest,
		onVariableInsertionRequest,
		onVariablePickerOpen,
		onVariablePickerClose,
		onVariableInsertionRequestHandled,
		formatStarter,
		variableDragCoordinator,
		createFormatDisabled,
		createFormatLabel,
		createFormatError,
		onCreateEmailFormat
	}: Props = $props();
</script>

<section
	class="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white"
	role="group"
	aria-label="FormatStarter creator"
>
	<div class="min-h-0 flex-1 overflow-y-auto">
		<div class="min-h-[65vh] shrink-0">
			<FormatEmailEditorPanel
				{editor}
				variables={formatStarter.variables}
				dragCoordinator={variableDragCoordinator}
				{variableInsertionRequest}
				{onVariableInsertionRequestHandled}
			/>
		</div>
	</div>
	<FormatVariablePickerSheet
		open={variablePickerOpen}
		variables={formatStarter.variables}
		onSelect={onVariableInsertionRequest}
		onClose={onVariablePickerClose}
	/>
	<FormatCreateActionBar
		disabled={createFormatDisabled}
		label={createFormatLabel}
		error={createFormatError}
		onPublish={onCreateEmailFormat}
		buttonClass="h-10 w-full text-[0.8rem]"
		mobileOrder="secondary-first"
	>
		{#snippet secondaryAction()}
			<Button
				variant="secondary"
				class="h-10 w-full text-[0.8rem]"
				onclick={onVariablePickerOpen}
			>
				Add variable
			</Button>
		{/snippet}
	</FormatCreateActionBar>
</section>
