<script lang="ts">
	import type { FormatVariableDefinition } from '$lib/features/format-starters/domain';
	import FormatEmailEditorPanel from '$lib/features/format-starters/creator/editor/FormatEmailEditorPanel.svelte';
	import type { FormatContentEditorState } from '$lib/features/format-starters/creator/state/format-content-editor-state.svelte';
	import type { FormatVariableDragCoordinator } from '$lib/features/format-starters/creator/variables/format-variable-drag-coordinator.svelte';
	import type { EmailFormatContentEditPolicy } from '$domain/email-formats';
	import { Button } from '$lib/ui';
	import SectionConflictActions from './SectionConflictActions.svelte';

	type Props = {
		editor: FormatContentEditorState | null;
		variables: readonly FormatVariableDefinition[];
		dragCoordinator: FormatVariableDragCoordinator;
		editPolicy: EmailFormatContentEditPolicy | null;
		canSave: boolean;
		conflict: boolean;
		isSaving?: boolean;
		error?: string | null;
		onSave: () => void | Promise<void>;
		onKeepMine: () => void | Promise<void>;
		onUseLatest: () => void;
	};

	let {
		editor,
		variables,
		dragCoordinator,
		editPolicy,
		canSave,
		conflict,
		isSaving = false,
		error = null,
		onSave,
		onKeepMine,
		onUseLatest
	}: Props = $props();
</script>

<section class="flex h-full min-h-0 min-w-0 flex-col bg-white" aria-label="Email format content">
	{#if editor}
		<div class="min-h-0 flex-1 overflow-hidden">
			<FormatEmailEditorPanel {editor} {variables} {dragCoordinator} editPolicy={editPolicy ?? undefined} />
		</div>
		<div class="flex shrink-0 items-center justify-between gap-3 px-4 py-3 md:px-5">
			<div class="min-w-0">
				{#if error}
					<p class="text-[0.68rem] leading-snug text-red-600">{error}</p>
				{/if}
				<SectionConflictActions
					{conflict}
					{isSaving}
					{onKeepMine}
					{onUseLatest}
				/>
			</div>
			<Button
				variant="secondary"
				class="shrink-0 px-3 text-[0.74rem] text-stone-800"
				disabled={!canSave || isSaving}
				onclick={() => void onSave()}
			>
				{isSaving ? 'Saving...' : 'Save'}
			</Button>
		</div>
	{:else}
		<div class="flex h-full items-center justify-center text-[0.74rem] text-stone-500">
			Loading email format...
		</div>
	{/if}
</section>
