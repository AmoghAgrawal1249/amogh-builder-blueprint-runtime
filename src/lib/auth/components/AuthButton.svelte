<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		type?: 'button' | 'submit';
		disabled?: boolean;
		children: Snippet;
		onclick?: () => void;
	};

	let { type = 'button', disabled = false, children, onclick }: Props = $props();
</script>

<button
	{type}
	{disabled}
	{onclick}
	class="relative flex h-9 w-full cursor-pointer items-center justify-center rounded-md border-0 bg-[var(--auth-accent-500)] px-4 text-sm font-medium leading-none text-white outline-none transition-[background,box-shadow] duration-150 hover:bg-[var(--auth-accent-600)] focus-visible:ring-2 focus-visible:ring-[var(--auth-accent-200)] disabled:cursor-not-allowed disabled:bg-[var(--auth-accent-200)]"
>
	{@render children()}
</button>
