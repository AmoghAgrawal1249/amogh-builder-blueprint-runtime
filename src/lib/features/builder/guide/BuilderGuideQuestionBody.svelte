<script lang="ts">
	import ChoiceQuestionInput from '$lib/features/builder/guide/inputs/ChoiceQuestionInput.svelte';
	import TextQuestionInput from '$lib/features/builder/guide/inputs/TextQuestionInput.svelte';
	import type {
		BuilderGuideAnswer,
		BuilderGuideChoiceAnswer,
		BuilderGuideTextAnswer
	} from '$lib/features/builder/guide/guide-answer';
	import type { BuilderGuideQuestion } from '$lib/features/builder/guide/guide-types';

	type Props = {
		question: BuilderGuideQuestion;
		answer: BuilderGuideAnswer;
		onAnswerChange: (answer: BuilderGuideAnswer) => void;
	};

	let { question, answer, onAnswerChange }: Props = $props();
	const emptyChoiceAnswer = {
		type: 'choice',
		selectedOption: '',
		customAnswer: ''
	} satisfies BuilderGuideChoiceAnswer;
	const emptyTextAnswer = {
		type: 'text',
		value: ''
	} satisfies BuilderGuideTextAnswer;
	const choiceAnswer = $derived(answer.type === 'choice' ? answer : emptyChoiceAnswer);
	const textAnswer = $derived(answer.type === 'text' ? answer : emptyTextAnswer);
</script>

{#if question.type === 'choice'}
	<ChoiceQuestionInput
		{question}
		answer={choiceAnswer}
		{onAnswerChange}
	/>
{:else}
	<TextQuestionInput
		{question}
		answer={textAnswer}
		{onAnswerChange}
	/>
{/if}
