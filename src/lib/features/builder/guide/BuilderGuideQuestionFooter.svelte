<script lang="ts">
	import { cn } from '$lib/components/chrome/shared/cn';
	import BuilderGuideActions from '$lib/features/builder/guide/BuilderGuideActions.svelte';
	import OptionalAnswerInput from '$lib/features/builder/guide/inputs/OptionalAnswerInput.svelte';
	import type { BuilderGuideAnswer, BuilderGuideChoiceAnswer } from '$lib/features/builder/guide/guide-answer';
	import type { BuilderGuideQuestion } from '$lib/features/builder/guide/guide-types';

	type Props = {
		question: BuilderGuideQuestion;
		answer: BuilderGuideAnswer;
		canGoNext: boolean;
		onNext: () => void;
		onSubmit: () => void | Promise<void>;
		onAnswerChange: (answer: BuilderGuideAnswer) => void;
	};

	let { question, answer, canGoNext, onNext, onSubmit, onAnswerChange }: Props = $props();
	const emptyChoiceAnswer = {
		type: 'choice',
		selectedOption: '',
		customAnswer: ''
	} satisfies BuilderGuideChoiceAnswer;
	const choiceAnswer = $derived(answer.type === 'choice' ? answer : emptyChoiceAnswer);
</script>

<div
	class={cn(
		'mt-6 flex flex-col gap-4',
		question.type === 'choice' ? 'md:flex-row md:items-end md:justify-between' : 'items-end'
	)}
>
	{#if question.type === 'choice'}
		<OptionalAnswerInput
			name={`${question.id}-custom-answer`}
			value={choiceAnswer.customAnswer}
			placeholder={question.customAnswerPlaceholder}
			onValueChange={(customAnswer) => {
				onAnswerChange({ ...choiceAnswer, customAnswer });
			}}
		/>
	{/if}

	<BuilderGuideActions {canGoNext} {onNext} {onSubmit} />
</div>
