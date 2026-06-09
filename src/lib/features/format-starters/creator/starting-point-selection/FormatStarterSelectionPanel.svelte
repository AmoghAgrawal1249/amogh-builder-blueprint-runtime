<script lang="ts">
	import { InfoBar, InlineText } from '$lib/ui';
	import {
		FORMAT_STARTER_SELECTION_SKIPPED_ANSWER,
		type FormatStarterSelectionAnswers,
		type GuidedStartingPointSelection
	} from '$lib/features/format-starters/domain';
	import FormatStarterQuestionCard from './FormatStarterQuestionCard.svelte';
	import FormatStarterSelectionActions from './FormatStarterSelectionActions.svelte';

	type Props = {
		startingPointSelection: GuidedStartingPointSelection;
		onAnswersChange: (answers: FormatStarterSelectionAnswers) => void;
		onSubmit: (answers: FormatStarterSelectionAnswers) => void;
	};

	let { startingPointSelection, onAnswersChange, onSubmit }: Props = $props();
	let currentQuestionIndex = $state(0);
	let selectedAnswers = $state<FormatStarterSelectionAnswers>({});
	const currentQuestion = $derived(startingPointSelection.questions[currentQuestionIndex]);
	const canGoPrevious = $derived(currentQuestionIndex > 0);
	const canGoNext = $derived(currentQuestionIndex < startingPointSelection.questions.length - 1);
	const currentQuestionHasSelectedAnswer = $derived(
		currentQuestion ? Boolean(selectedAnswers[currentQuestion.id]) : false
	);
	const stepLabel = $derived(`${currentQuestionIndex + 1} of ${startingPointSelection.questions.length}`);
	const skipActionLabel = $derived(
		startingPointSelection.questions.length === 1
			? 'Skip'
			: canGoPrevious
				? 'Skip remaining'
				: 'Skip all'
	);
	const primaryActionLabel = $derived(canGoNext ? 'Next' : 'Submit');

	function selectOption(questionId: string, optionId: string) {
		selectedAnswers = {
			...selectedAnswers,
			[questionId]: optionId
		};
		onAnswersChange({ ...selectedAnswers });
	}

	function goPrevious() {
		if (!canGoPrevious) {
			return;
		}

		currentQuestionIndex -= 1;
	}

	function goNext() {
		if (!canGoNext) {
			return;
		}

		currentQuestionIndex += 1;
	}

	function materializeSkippedAnswers(fromQuestionIndex = 0) {
		const answers = { ...selectedAnswers };

		for (let index = fromQuestionIndex; index < startingPointSelection.questions.length; index += 1) {
			const questionId = startingPointSelection.questions[index]?.id;

			if (questionId && !answers[questionId]) {
				answers[questionId] = FORMAT_STARTER_SELECTION_SKIPPED_ANSWER;
			}
		}

		return answers;
	}

	function submitAnswers() {
		const answers = materializeSkippedAnswers();

		selectedAnswers = answers;
		onAnswersChange({ ...answers });
		onSubmit({ ...answers });
	}

	function skipRemaining() {
		const answers = materializeSkippedAnswers(currentQuestionIndex);

		selectedAnswers = answers;
		onAnswersChange({ ...answers });
		onSubmit({ ...answers });
	}

	function handlePrimaryAction() {
		if (canGoNext) {
			goNext();
			return;
		}

		submitAnswers();
	}
</script>

<section class="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white">
	<div class="min-h-0 flex-1 overflow-y-auto px-5 py-6 md:px-7 md:py-8">
		<div class="max-w-3xl">
			<p class="text-[0.79rem] leading-[1.55] text-stone-800">
				{startingPointSelection.intro}
			</p>
		</div>

		{#if currentQuestion}
			<FormatStarterQuestionCard
				question={currentQuestion}
				{selectedAnswers}
				{canGoPrevious}
				{canGoNext}
				{stepLabel}
				showNavigation={startingPointSelection.questions.length > 1}
				onSelectOption={selectOption}
				onPrevious={goPrevious}
				onNext={goNext}
			/>
			{#if startingPointSelection.infoBar}
				<div class="mt-4 max-w-3xl">
					<InfoBar label={startingPointSelection.infoBar.label}>
						<InlineText
							content={startingPointSelection.infoBar.content}
							tooltipIdPrefix={`format-starting-point-selection-info-${startingPointSelection.infoBar.label}`}
						/>
					</InfoBar>
				</div>
			{/if}
		{/if}
	</div>

	{#if currentQuestion}
		<FormatStarterSelectionActions
			{skipActionLabel}
			{primaryActionLabel}
			{canGoNext}
			primaryDisabled={!canGoNext && !currentQuestionHasSelectedAnswer}
			onSkip={skipRemaining}
			onPrimary={handlePrimaryAction}
		/>
	{/if}
</section>
