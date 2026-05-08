<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { untrack } from 'svelte';
	import type { BuilderAppRecord } from '$lib/features/builder/data';
	import BuilderRunChatPanel from '$lib/features/builder/chat/BuilderRunChatPanel.svelte';
	import CustomEmailRightPanel from '$lib/features/builder/canvas/CustomEmailRightPanel.svelte';
	import SplitPane from '$lib/features/builder/canvas/SplitPane.svelte';
	import { BUILDER_CANVAS_SPLIT } from '$lib/features/builder/canvas/split-pane';
	import type { EmailDraft } from '@overbase/builder-sdk/email';
	import type { BuilderGuideDefinition } from '$lib/features/builder/guide/guide-types';
	import { createBuilderSessionController } from '$lib/features/builder/session/builder-session.svelte';
	import BuilderSetupFlow from '$lib/features/builder/setup/BuilderSetupFlow.svelte';

	type Props = {
		app: BuilderAppRecord;
		guide: BuilderGuideDefinition | null;
		initialMessage?: string | null;
	};

	let { app, guide, initialMessage = null }: Props = $props();
	let bootedAppId = $state('');
	let mode = $state<'setup' | 'run'>('setup');

	const initialAppId = untrack(() => app.id);
	const builderSession = createBuilderSessionController(
		initialAppId,
		() => initialMessage?.trim() ?? ''
	);
	const runError = $derived(
		builderSession.session?.errorText ??
			(builderSession.messages.length > 0 ? builderSession.error : null)
	);

	function clearInitialMessageState() {
		replaceState(resolve('/'), {});
	}

	async function startRun(firstMessage: string) {
		const normalizedFirstMessage = firstMessage.trim();

		if (!normalizedFirstMessage) {
			return;
		}

		mode = 'run';
		await builderSession.start(normalizedFirstMessage);
		clearInitialMessageState();
	}

	async function boot() {
		const firstMessage = initialMessage?.trim() ?? '';

		if (firstMessage) {
			await startRun(firstMessage);
			return;
		}

		const resumed = await builderSession.resumeStored();

		mode = resumed ? 'run' : 'setup';
	}

	async function sendMessage(text: string) {
		await builderSession.send(text);
	}

	async function saveDraft(draft: EmailDraft, baseEmailDraftVersion: number) {
		await builderSession.saveEmailDraft(draft, baseEmailDraftVersion);
	}

	$effect(() => {
		if (bootedAppId === app.id) {
			return;
		}

		bootedAppId = app.id;
		void boot().catch(() => {
			mode = 'run';
		});
	});
</script>

<SplitPane
	minPrimary={BUILDER_CANVAS_SPLIT.minPrimary}
	minSecondary={BUILDER_CANVAS_SPLIT.minSecondary}
	defaultRatio={BUILDER_CANVAS_SPLIT.defaultRatio}
	mobileBreakpoint={BUILDER_CANVAS_SPLIT.mobileBreakpoint}
	keyboardStep={BUILDER_CANVAS_SPLIT.keyboardStep}
	handleWidth={BUILDER_CANVAS_SPLIT.handleWidth}
	label="Resize builder panels"
>
	{#snippet primary()}
		{#if mode === 'run' && builderSession.error && builderSession.messages.length === 0}
			<section class="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white p-2">
				<div class="min-h-0 flex-1 overflow-y-auto px-3 py-6 md:px-5">
					<div class="mx-auto w-full max-w-3xl">
						<div class="max-w-xl rounded-sm border border-red-200 bg-red-50 p-4 text-[0.82rem] text-red-700">
							{builderSession.error}
						</div>
					</div>
				</div>
			</section>
		{:else if mode === 'run' && (builderSession.handle || builderSession.messages.length > 0)}
			<BuilderRunChatPanel
				messages={builderSession.messages}
				queryError={builderSession.queryError}
				{runError}
				canSendMessage={builderSession.canSend}
				onSend={sendMessage}
			/>
		{:else if guide}
			<BuilderSetupFlow {app} {guide} onComplete={startRun} />
		{:else}
			<div class="flex h-full min-h-0 min-w-0 flex-col justify-center bg-white px-6">
				<div class="mx-auto max-w-sm text-center">
					<p class="text-[0.82rem] font-medium text-zinc-950">App unavailable</p>
					<p class="mt-2 text-[0.72rem] leading-[1.5] text-zinc-500">
						This notification does not have a guided setup flow yet.
					</p>
				</div>
			</div>
		{/if}
	{/snippet}

	{#snippet secondary()}
		<CustomEmailRightPanel
			{app}
			session={builderSession.session}
			onSaveDraft={saveDraft}
		/>
	{/snippet}
</SplitPane>
