<script lang="ts">
	import { onMount } from 'svelte';
	import { InfoBar, InfoBarAction } from '$lib/ui';
	import {
		formatFormatVariableLabel,
		type FormatVariableDefinition
	} from '$lib/features/format-starters/domain';
	import type { FormatVariableDragCoordinator } from './format-variable-drag-coordinator.svelte';

	const TIP_STORAGE_KEY = 'overbase-format-variable-tip-index';

	type VariablePaletteTipPart =
		| { kind: 'text'; text: string }
		| { kind: 'link'; label: string; href: `/${string}` }
		| { kind: 'button'; label: string; onclick: () => void };

	type VariablePaletteTip = {
		id: string;
		content: readonly VariablePaletteTipPart[];
	};

	type Props = {
		variables: readonly FormatVariableDefinition[];
		dragCoordinator: FormatVariableDragCoordinator;
		onVariableSelect?: (variableId: string) => void;
		onRestart?: () => void;
	};

	let { variables, dragCoordinator, onVariableSelect, onRestart }: Props = $props();
	let activeTip = $state<VariablePaletteTip>(createVariablePaletteTips()[0]);
	const isSelectable = $derived(Boolean(onVariableSelect));

	onMount(() => {
		activeTip = chooseNextTip();
	});

	function createVariablePaletteTips() {
		const tips: VariablePaletteTip[] = [
			{
				id: 'format',
				content: [
					{
						kind: 'text',
						text: "You're only creating the email format here. Rules and data are added separately."
					}
				]
			},
			{
				id: 'format-again',
				content: [
					{
						kind: 'text',
						text: "You're only creating the email format here. Rules and data are added separately."
					}
				]
			}
		];

		if (onRestart) {
			tips.push({
				id: 'restart',
				content: [
					{ kind: 'button', label: 'Restart', onclick: onRestart },
					{
						kind: 'text',
						text: ' the process and pick different answers to see other versions of this format.'
					}
				]
			});
		}

		return tips;
	}

	function chooseNextTip() {
		const tips = createVariablePaletteTips();

		try {
			const storedIndex = Number.parseInt(localStorage.getItem(TIP_STORAGE_KEY) ?? '0', 10);
			const tipIndex = Number.isFinite(storedIndex) ? storedIndex : 0;
			const nextTip = tips[tipIndex % tips.length];
			localStorage.setItem(
				TIP_STORAGE_KEY,
				((tipIndex + 1) % tips.length).toString()
			);
			return nextTip;
		} catch {
			return tips[0];
		}
	}

	function startDrag(event: DragEvent, variable: FormatVariableDefinition) {
		dragCoordinator.startPaletteDrag(event, {
			...variable,
			label: formatFormatVariableLabel(variables, variable.id)
		});
	}
</script>

<div class="min-h-0 flex-1 overflow-y-auto px-5 py-5">
	<p class="mt-2 text-[0.79rem] leading-[1.55] text-stone-800">
		Add variables to your email format by {isSelectable ? 'tapping them:' : 'dragging them in:'}
	</p>

	<div class="mt-4 rounded-sm border border-stone-200/50 bg-white p-3.5">
		<div class="flex flex-wrap gap-2">
			{#each variables as variable (variable.id)}
				<button
					type="button"
					draggable={!isSelectable}
					title={variable.label}
					class={`inline-flex select-none items-center rounded-full border border-transparent bg-positive-50 px-1.5 py-0.5 text-[0.73rem] font-normal leading-none text-positive-900 transition-colors hover:bg-positive-100 ${isSelectable ? 'cursor-pointer active:bg-positive-100' : 'cursor-grab active:cursor-grabbing'}`}
					ondragstart={(event) => startDrag(event, variable)}
					ondragend={() => dragCoordinator.endDrag()}
					onclick={() => onVariableSelect?.(variable.id)}
				>
					{formatFormatVariableLabel(variables, variable.id)}
				</button>
			{/each}
		</div>
	</div>

	<InfoBar label="Tip:" class="mt-4 hidden md:block">
		{#each activeTip.content as part, index (`${activeTip.id}-${part.kind}-${index}`)}
			{#if part.kind === 'text'}
				<span>{part.text}</span>
			{:else if part.kind === 'link'}
				<InfoBarAction href={part.href}>
					{part.label}
				</InfoBarAction>
			{:else}
				<InfoBarAction onclick={part.onclick}>
					{part.label}
				</InfoBarAction>
			{/if}
		{/each}
	</InfoBar>
</div>
