<script lang="ts">
	import DraftJsonPanel from './DraftJsonPanel.svelte';
	import GuideSetupPanel from './GuideSetupPanel.svelte';
	import HarnessChatPanel from './HarnessChatPanel.svelte';
	import { createDevHarnessState } from './harness-state.svelte';

	const harness = createDevHarnessState();
</script>

<main
	class="grid h-dvh min-h-dvh grid-cols-[minmax(22rem,28rem)_minmax(28rem,1fr)_minmax(22rem,34rem)] overflow-hidden bg-white text-zinc-950"
>
	<GuideSetupPanel {harness} />
	<HarnessChatPanel {harness} />
	<aside class="min-h-0 border-l border-zinc-200">
		<DraftJsonPanel visibleDraft={harness.visibleDraft} hiddenDraft={harness.hiddenDraft} />
	</aside>
</main>
