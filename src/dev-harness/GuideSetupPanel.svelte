<script lang="ts">
	import type { createDevHarnessState } from './harness-state.svelte';

	type DevHarnessState = ReturnType<typeof createDevHarnessState>;

	type Props = {
		harness: DevHarnessState;
	};

	let { harness }: Props = $props();

	function getInputValue(event: Event) {
		return (event.currentTarget as HTMLInputElement | HTMLTextAreaElement).value;
	}
</script>

<aside class="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden border-r border-zinc-200 bg-zinc-50">
	<section class="min-h-0 overflow-y-auto p-4">
		<div>
			<p class="text-xs font-medium uppercase text-zinc-500">Guided setup</p>
			<p class="mt-2 text-sm leading-6 text-zinc-800">{harness.guide.intro}</p>
		</div>

		<div class="mt-4 grid gap-4">
			{#each harness.guide.questions as question (question.id)}
				<fieldset class="rounded-sm border border-zinc-200 bg-white p-3">
					<legend class="px-1 text-sm font-medium text-zinc-900">{question.title}</legend>

					{#if question.type === 'choice'}
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
					{:else}
						<textarea
							value={harness.getGuideAnswer(question.id)}
							class="mt-3 h-24 w-full resize-none rounded-sm border border-zinc-200 bg-white px-3 py-2 text-sm leading-5 outline-none focus:border-zinc-400"
							placeholder={question.placeholder}
							disabled={harness.isRunning}
							oninput={(event) => harness.setGuideAnswer(question.id, getInputValue(event))}
						></textarea>
					{/if}
				</fieldset>
			{/each}

			<details class="rounded-sm border border-zinc-200 bg-white">
				<summary class="cursor-pointer px-3 py-2 text-xs font-medium uppercase text-zinc-500">
					Generated initial message
				</summary>
				<textarea
					value={harness.initialMessage}
					readonly
					class="h-40 w-full resize-none border-t border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs leading-5 text-zinc-900 outline-none"
				></textarea>
			</details>
		</div>
	</section>

	<div class="flex flex-wrap items-center gap-2 border-t border-zinc-200 bg-white p-4">
		<button
			type="button"
			class="inline-flex h-8 items-center justify-center rounded-sm bg-zinc-950 px-3.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
			disabled={!harness.canStart}
			onclick={harness.start}
		>
			Start run
		</button>
		<button
			type="button"
			class="inline-flex h-8 items-center justify-center rounded-sm border border-zinc-200 px-3.5 text-xs font-medium text-zinc-700 hover:bg-white disabled:cursor-not-allowed disabled:text-zinc-300"
			disabled={harness.isRunning}
			onclick={harness.reset}
		>
			Reset run
		</button>
		<button
			type="button"
			class="inline-flex h-8 items-center justify-center rounded-sm border border-zinc-200 px-3.5 text-xs font-medium text-zinc-700 hover:bg-white disabled:cursor-not-allowed disabled:text-zinc-300"
			disabled={harness.isRunning}
			onclick={harness.resetGuideAnswers}
		>
			Reset answers
		</button>
	</div>
</aside>
