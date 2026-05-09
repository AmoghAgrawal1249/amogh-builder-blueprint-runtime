<script lang="ts">
	import type { GuideChoiceQuestion } from '$blueprint';
	import type { DevHarnessState } from './harness-state.svelte';

	type Props = {
		harness: DevHarnessState;
		question: GuideChoiceQuestion;
	};

	let { harness, question }: Props = $props();

	function getInputValue(event: Event) {
		return (event.currentTarget as HTMLInputElement).value;
	}
</script>

<fieldset class="rounded-sm border border-zinc-200 bg-white p-3">
	<legend class="px-1 text-sm font-medium text-zinc-900">{question.title}</legend>

	<div class="mt-3 grid gap-2">
		{#each question.options as option (option)}
			<label
				class="flex min-h-10 items-start gap-2 rounded-sm border border-zinc-200 px-3 py-2 text-sm leading-5 text-zinc-800 has-[:checked]:border-zinc-950 has-[:checked]:bg-zinc-50"
			>
				<input
					type="radio"
					name={question.id}
					class="mt-1"
					checked={harness.getGuideAnswer(question.id) === option}
					disabled={harness.isRunning}
					oninput={() => harness.setGuideAnswer(question.id, option)}
				/>
				<span>{option}</span>
			</label>
		{/each}
	</div>

	<input
		value={harness.getChoiceCustomAnswer(question)}
		class="mt-3 h-9 w-full rounded-sm border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
		placeholder={question.customAnswerPlaceholder}
		disabled={harness.isRunning}
		oninput={(event) => harness.setGuideAnswer(question.id, getInputValue(event))}
	/>
</fieldset>
