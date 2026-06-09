<script lang="ts">
	import type { EmailBodyBlock, EmailDraft } from './email-drafts';
	import EmailComposeDocument from '$lib/features/email-formats/drafts/EmailComposeDocument.svelte';
	import { formatRecipients } from '$lib/features/email-formats/drafts/email-editable-draft';
	import EmailAttachmentCard from '$lib/features/email-formats/drafts/EmailAttachmentCard.svelte';

	type Props = {
		draft: EmailDraft;
		onOpenAttachment?: () => void;
	};

	let { draft, onOpenAttachment }: Props = $props();

	const toLine = $derived(formatRecipients(draft.to));
	const ccLine = $derived(formatRecipients(draft.cc));
	const hasBody = $derived(draft.body.length > 0);

	function isParagraphBlock(block: EmailBodyBlock): block is Extract<EmailBodyBlock, { type: 'paragraph' }> {
		return block.type === 'paragraph';
	}
</script>

<EmailComposeDocument>
	{#snippet to()}
		{#if toLine}
			<p class="truncate text-[0.72rem] text-stone-800">{toLine}</p>
		{/if}
	{/snippet}

	{#snippet cc()}
		{#if ccLine}
			<p class="truncate text-[0.72rem] text-stone-800">{ccLine}</p>
		{/if}
	{/snippet}

	{#snippet attachment()}
		{#if draft.attachment}
			<EmailAttachmentCard
				filename={draft.attachment.filename}
				onOpen={onOpenAttachment}
			/>
		{:else}
			<p class="text-[0.72rem] text-stone-400">No attachment</p>
		{/if}
	{/snippet}

	{#snippet body()}
		<div class={hasBody ? 'text-stone-900' : 'text-stone-500'}>
			{#if hasBody}
				<div class="space-y-3.5">
					{#each draft.body as block, blockIndex (`${block.type}:${blockIndex}`)}
						{#if isParagraphBlock(block)}
							<p class="whitespace-pre-wrap">{block.text}</p>
						{:else if block.type === 'link'}
							<p>
								<span
									class="cursor-default font-medium text-link-600 underline decoration-link-600/70 underline-offset-2"
									title={block.href}
								>
									{block.label}
								</span>
							</p>
						{/if}
					{/each}
				</div>
			{:else}
				<p>Add email body</p>
			{/if}
			<img
				src="/logo_full.png"
				alt="Overbase"
				class="mt-9 h-auto w-[128px] max-w-[45%] select-none"
			/>
		</div>
	{/snippet}

</EmailComposeDocument>
