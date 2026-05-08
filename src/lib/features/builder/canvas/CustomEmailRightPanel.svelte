<script lang="ts">
	import type { Doc } from '$convex/_generated/dataModel';
	import type { EmailDraft } from '@overbase/builder-sdk/email';
	import type { BuilderAppRecord } from '$lib/features/builder/data';
	import BuilderAppPanel from '$lib/features/builder/canvas/BuilderAppPanel.svelte';
	import BuilderEmailRunPreviewPanel from '$lib/features/builder/email/BuilderEmailRunPreviewPanel.svelte';
	import { getBuilderSessionEmailDraftView } from '$lib/features/builder/session/builder-session-view';

	type Props = {
		app: BuilderAppRecord;
		session: Doc<'builderSessions'> | null;
		onSaveDraft: (draft: EmailDraft, baseEmailDraftVersion: number) => Promise<void>;
	};

	let { app, session, onSaveDraft }: Props = $props();

	const emailDraftView = $derived(getBuilderSessionEmailDraftView(session));
	const emailDraft = $derived(emailDraftView.emailDraft);
	const canEdit = $derived(emailDraftView.canEditEmailDraft);
</script>

{#if emailDraft}
	<BuilderEmailRunPreviewPanel
		draft={emailDraft}
		emailDraftVersion={session?.emailDraftVersion ?? 0}
		{canEdit}
		onSave={onSaveDraft}
	/>
{:else}
	<BuilderAppPanel {app} />
{/if}
