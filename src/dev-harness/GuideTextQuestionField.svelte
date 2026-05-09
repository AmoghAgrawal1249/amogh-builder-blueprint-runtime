<script lang="ts">
	import type { GuideTextQuestion } from '$blueprint';
	import type { DevHarnessState } from './harness-state.svelte';

	type Props = {
		harness: DevHarnessState;
		question: GuideTextQuestion;
	};

	let { harness, question }: Props = $props();

	function getInputValue(event: Event) {
		return (event.currentTarget as HTMLTextAreaElement).value;
	}
</script>

<fieldset class="rounded-sm border border-zinc-200 bg-white p-3">
	<legend class="px-1 text-sm font-medium text-zinc-900">{question.title}</legend>

	<textarea
		value={harness.getGuideAnswer(question.id)}
		class="mt-3 h-24 w-full resize-none rounded-sm border border-zinc-200 bg-white px-3 py-2 text-sm leading-5 outline-none focus:border-zinc-400"
		placeholder={question.placeholder}
		disabled={harness.isRunning}
		oninput={(event) => harness.setGuideAnswer(question.id, getInputValue(event))}
	></textarea>
</fieldset>
