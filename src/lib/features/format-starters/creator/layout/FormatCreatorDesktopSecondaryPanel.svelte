<script lang="ts">
	import FormatEmailEditorPanel from '../editor/FormatEmailEditorPanel.svelte';
	import FormatStarterOverviewPanel from './FormatStarterOverviewPanel.svelte';
	import type { FormatStarter } from '$lib/features/format-starters/catalog';
	import type { FormatContentEditorState } from '../state/format-content-editor-state.svelte';
	import type { FormatCreatorStep } from '../state/format-creator-state.svelte';
	import type { FormatVariableDragCoordinator } from '../variables/format-variable-drag-coordinator.svelte';

	type Props =
		| {
				step: Extract<FormatCreatorStep, 'starting-point-selection'>;
				formatStarter: FormatStarter;
		  }
		| {
				step: Extract<FormatCreatorStep, 'editor'>;
				editor: FormatContentEditorState;
				formatStarter: FormatStarter;
				variableDragCoordinator: FormatVariableDragCoordinator;
				onVariableInsertionRequestHandled: (requestId: number) => void;
		  };

	let props: Props = $props();
</script>

<section
	class="relative h-full min-h-0 min-w-0 overflow-hidden bg-white"
	role="group"
	aria-label="FormatStarter creator"
>
	{#if props.step === 'starting-point-selection'}
		<div class="absolute inset-0 z-10">
			<FormatStarterOverviewPanel formatStarter={props.formatStarter} />
		</div>
	{:else}
		<div class="absolute inset-0 z-10 opacity-100">
			<FormatEmailEditorPanel
				editor={props.editor}
				variables={props.formatStarter.variables}
				dragCoordinator={props.variableDragCoordinator}
				onVariableInsertionRequestHandled={props.onVariableInsertionRequestHandled}
			/>
		</div>
	{/if}
</section>
