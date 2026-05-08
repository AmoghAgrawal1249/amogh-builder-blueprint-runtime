<script lang="ts">
	import type {
		BuilderGuideAnswer,
		BuilderGuideChoiceAnswer
	} from '$lib/features/builder/guide/guide-answer';
	import type { BuilderGuideChoiceQuestion } from '$lib/features/builder/guide/guide-types';

	type Props = {
		question: BuilderGuideChoiceQuestion;
		answer: BuilderGuideChoiceAnswer;
		onAnswerChange: (answer: BuilderGuideAnswer) => void;
	};

	let { question, answer, onAnswerChange }: Props = $props();
</script>

<div class="divide-y divide-zinc-100">
	{#each question.options as option (option)}
		<label
			class="flex min-h-11 cursor-pointer items-center gap-3 py-2 text-[0.76rem] text-zinc-800 md:text-[0.8rem]"
		>
			<input
				type="radio"
				name={question.id}
				value={option}
				checked={answer.selectedOption === option}
				onchange={() => {
					onAnswerChange({ ...answer, selectedOption: option });
				}}
				class="peer sr-only"
			/>
			<span
				class="size-4 rounded-full border border-zinc-300 bg-white shadow-[inset_0_0_0_2px_white] peer-checked:border-zinc-950 peer-checked:bg-zinc-950"
			></span>
			<span>{option}</span>
		</label>
	{/each}
</div>
