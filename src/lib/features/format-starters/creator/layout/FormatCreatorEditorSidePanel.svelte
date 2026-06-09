<script lang="ts">
	import type { FormatVariableDefinition } from '$lib/features/format-starters/domain';
	import FormatCreateActionBar from './FormatCreateActionBar.svelte';
	import FormatVariablePalette from '../variables/FormatVariablePalette.svelte';
	import type { FormatVariableDragCoordinator } from '../variables/format-variable-drag-coordinator.svelte';

	type Props = {
		variables: readonly FormatVariableDefinition[];
		dragCoordinator: FormatVariableDragCoordinator;
		publishDisabled?: boolean;
		publishLabel?: string;
		publishError?: string | null;
		onPublish?: () => void;
		onRestart?: () => void;
	};

	let {
		variables,
		dragCoordinator,
		publishDisabled = true,
		publishLabel = 'Create format',
		publishError = null,
		onPublish,
		onRestart
	}: Props = $props();
</script>

<aside class="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white">
	<FormatVariablePalette {variables} {dragCoordinator} {onRestart} />
	<FormatCreateActionBar
		disabled={publishDisabled}
		label={publishLabel}
		error={publishError}
		onPublish={() => onPublish?.()}
	/>
</aside>
