<script lang="ts">
	import { HelpTooltip } from '$lib/ui';
	import { cn } from '$lib/ui/cn';
	import type {
		FormatStarterSelectionAnswers,
		FormatStarterSelectionQuestion
	} from '$lib/features/format-starters/domain';

	type Props = {
		question: FormatStarterSelectionQuestion;
		selectedAnswers: FormatStarterSelectionAnswers;
		canGoPrevious: boolean;
		canGoNext: boolean;
		stepLabel: string;
		showNavigation: boolean;
		onSelectOption: (questionId: string, optionId: string) => void;
		onPrevious: () => void;
		onNext: () => void;
	};

	let {
		question,
		selectedAnswers,
		canGoPrevious,
		canGoNext,
		stepLabel,
		showNavigation,
		onSelectOption,
		onPrevious,
		onNext
	}: Props = $props();
</script>

<div class="mt-6 rounded-sm border border-stone-100 bg-white p-4 md:mt-8 md:p-6">
	<div class="flex items-start justify-between gap-4">
		<div class="flex min-w-0 items-center gap-1.5">
			<h2 class="min-w-0 text-[0.76rem] font-medium text-stone-950 md:text-[0.8rem]">
				{question.title}
			</h2>
			<HelpTooltip
				id={`format-starting-point-selection-question-help-${question.id}`}
				text={question.helpText ?? null}
				ariaLabel="Question help"
			/>
		</div>

		{#if showNavigation}
			<div class="flex shrink-0 items-center gap-1 text-[0.72rem] text-stone-500">
				<button
					type="button"
					aria-label="Previous question"
					class={cn(
						'grid size-5 place-items-center rounded-[6px] disabled:cursor-default disabled:hover:bg-transparent',
						canGoPrevious ? 'text-stone-500 hover:bg-stone-100' : 'text-stone-300'
					)}
					disabled={!canGoPrevious}
					onclick={onPrevious}
				>
					<span class="text-[1rem] leading-none">‹</span>
				</button>
				<span>{stepLabel}</span>
				<button
					type="button"
					aria-label="Next question"
					class={cn(
						'grid size-5 place-items-center rounded-[6px] disabled:cursor-default disabled:hover:bg-transparent',
						canGoNext ? 'text-stone-500 hover:bg-stone-100' : 'text-stone-300'
					)}
					disabled={!canGoNext}
					onclick={onNext}
				>
					<span class="text-[1rem] leading-none">›</span>
				</button>
			</div>
		{/if}
	</div>

	<form
		class="mt-7"
		onsubmit={(event) => {
			event.preventDefault();
		}}
	>
		<fieldset>
			<legend class="sr-only">{question.title}</legend>
			<div class="divide-y divide-stone-100">
				{#each question.options as option (option.id)}
					<label
						class="flex min-h-11 cursor-pointer items-center gap-3 py-2 text-[0.76rem] text-stone-800 md:text-[0.8rem]"
					>
						<input
							type="radio"
							name={question.id}
							value={option.id}
							checked={selectedAnswers[question.id] === option.id}
							onchange={() => onSelectOption(question.id, option.id)}
							class="peer sr-only"
						/>
						<span
							class="size-4 rounded-full border border-stone-300 bg-white shadow-[inset_0_0_0_2px_white] peer-checked:border-stone-950 peer-checked:bg-stone-950"
						></span>
						<span>{option.label}</span>
					</label>
				{/each}
			</div>
		</fieldset>
	</form>
</div>
