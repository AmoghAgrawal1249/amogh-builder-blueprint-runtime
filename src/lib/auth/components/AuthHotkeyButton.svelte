<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		disabled?: boolean;
		hotkey?: 'Enter';
		hotkeyLabel?: string;
		onclick?: () => void;
		type?: 'button' | 'submit';
	};

	let {
		children,
		disabled = false,
		hotkey = 'Enter',
		hotkeyLabel = 'return',
		onclick,
		type = 'button'
	}: Props = $props();

	function isEditableTarget(target: EventTarget | null) {
		return (
			target instanceof HTMLInputElement ||
			target instanceof HTMLTextAreaElement ||
			target instanceof HTMLSelectElement ||
			(target instanceof HTMLElement && target.isContentEditable)
		);
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (!onclick || disabled || event.key !== hotkey || isEditableTarget(event.target)) {
			return;
		}

		event.preventDefault();
		onclick();
	}
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<button
	{type}
	{disabled}
	aria-keyshortcuts={hotkey}
	{onclick}
	class="relative flex h-9 w-full cursor-pointer items-center justify-center rounded-md border-0 bg-[var(--auth-accent-500)] px-4 text-sm font-medium leading-none text-white outline-none transition-[background,box-shadow] duration-150 hover:bg-[var(--auth-accent-600)] focus-visible:ring-2 focus-visible:ring-[var(--auth-accent-200)] disabled:cursor-not-allowed disabled:bg-[var(--auth-accent-200)]"
>
	<span>{@render children()}</span>
	<span class="absolute right-3 hidden sm:inline-flex">
		<span
			class="inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-white/15 px-2 text-xs font-medium text-white/75"
		>
			{hotkeyLabel}
		</span>
	</span>
</button>
