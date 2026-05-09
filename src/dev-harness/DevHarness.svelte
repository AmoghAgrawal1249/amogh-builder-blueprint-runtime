<script lang="ts">
	import DraftJsonPanel from './DraftJsonPanel.svelte';
	import { createDevHarnessState } from './harness-state.svelte';

	const harness = createDevHarnessState();

	function getInputValue(event: Event) {
		return (event.currentTarget as HTMLInputElement | HTMLTextAreaElement).value;
	}
</script>

<main class="grid h-dvh min-h-dvh grid-cols-[minmax(0,1fr)_minmax(22rem,34rem)] overflow-hidden bg-white text-zinc-950">
	<section class="flex min-h-0 flex-col overflow-hidden">
		<div class="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto]">
			<section class="max-h-[48dvh] overflow-y-auto border-b border-zinc-200 bg-zinc-50 p-4">
				<div class="max-w-3xl">
					<p class="text-xs font-medium uppercase text-zinc-500">Guided setup</p>
					<p class="mt-2 text-sm leading-6 text-zinc-800">{harness.guide.intro}</p>
				</div>

				<div class="mt-4 grid max-w-3xl gap-4">
					{#each harness.guide.questions as question (question.id)}
						<fieldset class="rounded-sm border border-zinc-200 bg-white p-3">
							<legend class="px-1 text-sm font-medium text-zinc-900">{question.title}</legend>

							{#if question.type === 'choice'}
								<div class="mt-3 grid gap-2 sm:grid-cols-2">
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
									class="mt-3 h-20 w-full resize-none rounded-sm border border-zinc-200 bg-white px-3 py-2 text-sm leading-5 outline-none focus:border-zinc-400"
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
							class="h-36 w-full resize-none border-t border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs leading-5 text-zinc-900 outline-none"
						></textarea>
					</details>
				</div>

				<div class="mt-4 flex flex-wrap items-center gap-2">
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
			</section>

			<section class="min-h-0 overflow-y-auto p-4">
				<div class="mx-auto flex max-w-3xl flex-col gap-3">
					{#each harness.messages as message (message.id)}
						<div class={message.role === 'user' ? 'self-end' : 'self-start'}>
							<div
								class={message.role === 'user'
									? 'max-w-2xl rounded-sm bg-zinc-950 px-3 py-2 text-sm leading-6 text-white'
									: 'max-w-2xl rounded-sm border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 text-zinc-900 shadow-sm'}
							>
								<p class="whitespace-pre-wrap">{message.text}</p>
							</div>
						</div>
					{/each}

					{#if harness.isRunning}
						<p class="text-xs font-medium uppercase text-zinc-400">Running...</p>
					{/if}

					{#if harness.errorText}
						<div class="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
							{harness.errorText}
						</div>
					{/if}
				</div>
			</section>

			<form
				class="border-t border-zinc-200 p-4"
				onsubmit={(event) => {
					event.preventDefault();
					void harness.sendReply();
				}}
			>
				<div class="flex gap-2">
					<input
						bind:value={harness.replyText}
						class="h-10 min-w-0 flex-1 rounded-sm border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
						placeholder="Answer the follow-up question or ask for a draft change"
						disabled={!harness.messages.length || harness.isRunning}
					/>
					<button
						type="submit"
						class="inline-flex h-10 items-center justify-center rounded-sm bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
						disabled={!harness.canReply}
					>
						Send
					</button>
				</div>
			</form>
		</div>
	</section>

	<aside class="min-h-0 border-l border-zinc-200">
		<DraftJsonPanel draft={harness.visibleDraft} preparedDraft={harness.preparedDraft} />
	</aside>
</main>
