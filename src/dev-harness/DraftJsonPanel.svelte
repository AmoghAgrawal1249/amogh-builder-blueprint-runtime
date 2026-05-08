<script lang="ts">
	import type { EmailDraft } from '@overbase/builder-sdk/email';

	type Props = {
		draft: EmailDraft | null;
		preparedDraft: EmailDraft | null;
	};

	let { draft, preparedDraft }: Props = $props();
	const visibleDraft = $derived(draft ?? preparedDraft);
	const draftJson = $derived(visibleDraft ? JSON.stringify(visibleDraft, null, 2) : '');
</script>

<section class="flex min-h-0 flex-col overflow-hidden bg-white">
	<div class="min-h-0 flex-1 overflow-y-auto p-4">
		{#if visibleDraft}
			<pre class="min-h-full overflow-auto rounded-sm border border-zinc-200 bg-zinc-50 p-3 text-xs leading-5 text-zinc-800">{draftJson}</pre>
		{:else}
			<p class="text-sm text-zinc-500">No draft yet.</p>
		{/if}
	</div>
</section>
