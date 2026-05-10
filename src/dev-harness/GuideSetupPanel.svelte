<script lang="ts">
	import GuideChoiceQuestionField from './GuideChoiceQuestionField.svelte';
	import GuideTextQuestionField from './GuideTextQuestionField.svelte';
	import type { DevHarnessState } from './harness-state.svelte';

	type Props = {
		harness: DevHarnessState;
	};

	let { harness }: Props = $props();
</script>

<aside class="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden border-r border-zinc-200 bg-zinc-50">
	<section class="min-h-0 overflow-y-auto p-4">
		<div>
			<p class="text-xs font-medium uppercase text-zinc-500">Guided setup</p>
			<p class="mt-2 text-sm leading-6 text-zinc-800">{harness.guide.intro}</p>
		</div>

		<div class="mt-4 grid gap-4">
			<div class="flex rounded-sm border border-zinc-200 bg-white p-1">
				<button
					type="button"
					class={`h-7 flex-1 rounded-[2px] text-xs font-medium ${
						harness.setupAction === 'submitted'
							? 'bg-zinc-950 text-white'
							: 'text-zinc-600 hover:bg-zinc-50'
					}`}
					onclick={() => harness.setSetupAction('submitted')}
				>
					Start as submitted
				</button>
				<button
					type="button"
					class={`h-7 flex-1 rounded-[2px] text-xs font-medium ${
						harness.setupAction === 'skippedRemaining'
							? 'bg-zinc-950 text-white'
							: 'text-zinc-600 hover:bg-zinc-50 disabled:text-zinc-300 disabled:hover:bg-transparent'
					}`}
					disabled={!harness.canUseSkippedRemaining}
					onclick={() => harness.setSetupAction('skippedRemaining')}
				>
					Start as skipped
				</button>
			</div>

			{#each harness.guide.questions as question (question.id)}
				{#if question.type === 'choice'}
					<GuideChoiceQuestionField {harness} {question} />
				{:else if question.type === 'text'}
					<GuideTextQuestionField {harness} {question} />
				{/if}
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

			<details class="rounded-sm border border-zinc-200 bg-white">
				<summary class="cursor-pointer px-3 py-2 text-xs font-medium uppercase text-zinc-500">
					Run setup JSON
				</summary>
				<textarea
					value={harness.setupJson}
					readonly
					class="h-56 w-full resize-none border-t border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs leading-5 text-zinc-900 outline-none"
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
