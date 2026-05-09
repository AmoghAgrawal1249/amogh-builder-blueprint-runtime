<script lang="ts">
	import type { createDevHarnessState } from './harness-state.svelte';

	type DevHarnessState = ReturnType<typeof createDevHarnessState>;

	type Props = {
		harness: DevHarnessState;
	};

	let { harness }: Props = $props();
</script>

<section class="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden bg-white">
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
</section>
