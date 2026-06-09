<script lang="ts">
	import XIcon from 'phosphor-svelte/lib/XIcon';
	import { IconButton } from '$lib/ui';
	import {
		formatFormatVariableLabel,
		type FormatVariableDefinition
	} from '$lib/features/format-starters/domain';

	type Props = {
		open: boolean;
		variables: readonly FormatVariableDefinition[];
		onSelect: (variableId: string) => void;
		onClose: () => void;
	};

	let { open, variables, onSelect, onClose }: Props = $props();

	function selectVariable(variableId: string) {
		onSelect(variableId);
		onClose();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (open && event.key === 'Escape') {
			event.preventDefault();
			onClose();
		}
	}
</script>

{#if open}
	<aside
		class="shrink-0 border-t border-stone-200 bg-white shadow-[0_-14px_28px_rgba(28,25,23,0.07)]"
		aria-label="Add variable"
	>
		<header class="flex h-11 items-center justify-between border-b border-stone-100 px-4">
			<h2 class="text-[0.8rem] leading-none font-medium text-stone-950">Add variable</h2>
			<IconButton aria-label="Close variable picker" class="size-7 border-0" onclick={onClose}>
				<XIcon size={16} weight="regular" />
			</IconButton>
		</header>

		<div class="max-h-[42dvh] overflow-y-auto">
			{#each variables as variable (variable.id)}
				<button
					type="button"
					class="flex h-11 w-full items-center justify-start border-b border-stone-100 px-4 text-left text-[0.8rem] leading-none text-stone-900 transition-colors hover:bg-stone-50 active:bg-stone-100"
					onclick={() => selectVariable(variable.id)}
				>
					{formatFormatVariableLabel(variables, variable.id)}
				</button>
			{/each}
		</div>
	</aside>
{/if}

<svelte:document onkeydown={handleKeydown} />
