<script lang="ts">
	import ArrowLeftIcon from 'phosphor-svelte/lib/ArrowLeftIcon';
	import ArrowRightIcon from 'phosphor-svelte/lib/ArrowRightIcon';
	import EmailAttachmentSpreadsheetPreview from '$lib/features/email-formats/drafts/EmailAttachmentSpreadsheetPreview.svelte';
	import EmailComposePreview from '$lib/features/email-formats/drafts/EmailComposePreview.svelte';
	import { IconButton } from '$lib/ui';
	import type { SentEmail } from './email-format-configure-types';

	type Props = {
		sentEmail: SentEmail;
		canGoPrevious: boolean;
		canGoNext: boolean;
		onPrevious: () => void;
		onNext: () => void;
	};

	let {
		sentEmail,
		canGoPrevious,
		canGoNext,
		onPrevious,
		onNext
	}: Props = $props();

	let isAttachmentOpen = $state(false);
	const sentDateLabel = $derived(
		new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		}).format(new Date(sentEmail.sentAt))
	);

</script>

<aside class="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white text-stone-950">
	<div
		class={isAttachmentOpen && sentEmail.draft.attachment
			? 'min-h-0 flex-1 overflow-hidden'
			: 'min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5 md:py-5'}
	>
		{#if isAttachmentOpen && sentEmail.draft.attachment}
			<div class="flex h-full min-h-0 w-full flex-col">
				<EmailAttachmentSpreadsheetPreview
					attachment={sentEmail.draft.attachment}
					onClose={() => (isAttachmentOpen = false)}
				/>
			</div>
		{:else}
			<div class="mx-auto flex min-h-full w-full max-w-[820px] flex-col">
				<EmailComposePreview
					draft={sentEmail.draft}
					onOpenAttachment={() => (isAttachmentOpen = true)}
				/>
			</div>
		{/if}
	</div>

	<div class="shrink-0 bg-white px-4 py-3 md:px-5">
		<div class="flex items-center justify-between gap-3">
			<div class="min-w-0">
				<p class="truncate text-[0.68rem] font-medium text-stone-700">{sentDateLabel}</p>
			</div>

			<div class="flex items-center gap-1.5">
				<IconButton
					aria-label="Previous sent email"
					variant="secondary"
					class="size-8 text-stone-700"
					disabled={!canGoPrevious}
					onclick={onPrevious}
				>
					<ArrowLeftIcon size={14} weight="regular" />
				</IconButton>
				<IconButton
					aria-label="Next sent email"
					variant="secondary"
					class="size-8 text-stone-700"
					disabled={!canGoNext}
					onclick={onNext}
				>
					<ArrowRightIcon size={14} weight="regular" />
				</IconButton>
			</div>
		</div>
	</div>
</aside>
