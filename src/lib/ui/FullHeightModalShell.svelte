<script lang="ts">
	import XIcon from 'phosphor-svelte/lib/XIcon';
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/ui/cn';
	import IconButton from '$lib/ui/IconButton.svelte';
	import { createModalBehavior } from '$lib/ui/modal-behavior.svelte';

	export type FullHeightModalPlacement = 'right' | 'center';

	type Props = {
		open: boolean;
		title: string;
		subtitle?: string;
		onClose: () => void;
		placement?: FullHeightModalPlacement;
		class?: ClassValue;
		titleContent?: Snippet;
		footer?: Snippet;
		children?: Snippet;
	};

	let {
		open,
		title,
		subtitle,
		onClose,
		placement = 'right',
		class: className = '',
		titleContent,
		footer,
		children
	}: Props = $props();

	const placementClass: Record<FullHeightModalPlacement, string> = {
		right: 'justify-end',
		center: 'justify-center'
	};

	const titleId = $props.id();
	const modalBehavior = createModalBehavior({
		isOpen: () => open,
		onClose: () => onClose()
	});
</script>

{#if open}
	<div class={cn('fixed inset-0 z-50 flex p-4', placementClass[placement])}>
		<button
			type="button"
			tabindex="-1"
			aria-label="Close modal"
			class="absolute inset-0 cursor-default bg-stone-100/40"
			onclick={onClose}
		></button>

		<div
			bind:this={modalBehavior.dialogElement}
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
			tabindex="-1"
			class={cn(
				'relative flex h-full w-full max-w-120 flex-col overflow-hidden rounded-lg border border-stone-200/80 bg-white text-stone-950 shadow-sm shadow-stone-400/15 outline-none',
				className
			)}
		>
			<IconButton
				aria-label="Close modal"
				class="absolute top-4 right-4 size-6 border-0"
				onclick={onClose}
			>
				<XIcon size={16} weight="regular" />
			</IconButton>

			<header class="min-w-0 space-y-1 px-4 py-5 pr-12">
				{#if titleContent}
					<h2 id={titleId} class="sr-only">{title}</h2>
					<div class="min-w-0">
						{@render titleContent()}
					</div>
				{:else}
					<h2 id={titleId} class="text-sm leading-tight font-medium text-stone-950">{title}</h2>
				{/if}
				{#if subtitle}
					<p class="text-[11px] leading-5 text-stone-500">{subtitle}</p>
				{/if}
			</header>

			<div class="min-h-0 flex-1 overflow-y-auto px-6 pb-8">
				{@render children?.()}
			</div>

			{#if footer}
				<footer class="flex shrink-0 items-center justify-between gap-3 border-t border-stone-200/80 p-4">
					{@render footer()}
				</footer>
			{/if}
		</div>
	</div>
{/if}

<svelte:document onkeydown={modalBehavior.handleKeydown} />
