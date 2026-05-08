<script lang="ts">
	import type { EmailBodyBlock, EmailDraft } from '@overbase/builder-sdk/email';
	import EmailComposeDocument from '$lib/features/builder/email/EmailComposeDocument.svelte';
	import { formatRecipients } from '$lib/features/builder/email/email-editable-draft';
	import EmailAttachmentCard from '$lib/features/builder/email/EmailAttachmentCard.svelte';

	type Props = {
		draft: EmailDraft;
	};

	let { draft }: Props = $props();

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
			<p class="truncate text-[0.78rem] text-zinc-800">{toLine}</p>
		{/if}
	{/snippet}

	{#snippet cc()}
		{#if ccLine}
			<p class="truncate text-[0.78rem] text-zinc-800">{ccLine}</p>
		{/if}
	{/snippet}

	{#snippet attachments()}
		{#if draft.attachments.length > 0}
			<div class="flex flex-wrap gap-2">
				{#each draft.attachments as attachment, attachmentIndex (`${attachment}:${attachmentIndex}`)}
					<EmailAttachmentCard filename={attachment} />
				{/each}
			</div>
		{:else}
			<p class="text-zinc-500">Attach a PDF</p>
		{/if}
	{/snippet}

	{#snippet body()}
		<div class={hasBody ? 'text-zinc-900' : 'text-zinc-500'}>
			{#if hasBody}
				<div class="space-y-3.5">
					{#each draft.body as block, blockIndex (`${block.type}:${blockIndex}`)}
						{#if isParagraphBlock(block)}
							<p class="whitespace-pre-wrap">{block.text}</p>
						{:else if block.type === 'bullets'}
							<ul class="list-disc space-y-1.5 pl-5">
								{#each block.items as item, itemIndex (`${item}:${itemIndex}`)}
									<li class="pl-1">{item}</li>
								{/each}
							</ul>
						{:else if block.type === 'link'}
							<p>
								<span
									class="cursor-default font-medium text-blue-600 underline decoration-blue-600/70 underline-offset-2"
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
		</div>
	{/snippet}

	{#snippet fireReason()}
		<p class="text-[0.76rem] leading-relaxed text-zinc-800">
			{draft.fireReason || 'Add the trigger rule this notification should use.'}
		</p>
	{/snippet}
</EmailComposeDocument>
