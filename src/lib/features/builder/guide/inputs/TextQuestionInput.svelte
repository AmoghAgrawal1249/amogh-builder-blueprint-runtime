<script lang="ts">
	import type { BuilderGuideAnswer, BuilderGuideTextAnswer } from '$lib/features/builder/guide/guide-answer';
	import type { BuilderGuideTextQuestion } from '$lib/features/builder/guide/guide-types';

	type Props = {
		question: BuilderGuideTextQuestion;
		answer: BuilderGuideTextAnswer;
		onAnswerChange: (answer: BuilderGuideAnswer) => void;
	};

	let { question, answer, onAnswerChange }: Props = $props();
</script>

<textarea
	name={question.id}
	rows={4}
	value={answer.value}
	aria-label={question.title}
	oninput={(event) => {
		onAnswerChange({ ...answer, value: event.currentTarget.value });
	}}
	placeholder={question.placeholder}
	class="min-h-28 w-full resize-none rounded-sm border border-zinc-100 bg-white px-3 py-2.5 text-[0.76rem] leading-[1.15rem] text-zinc-800 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-200 md:text-[0.8rem]"
></textarea>
