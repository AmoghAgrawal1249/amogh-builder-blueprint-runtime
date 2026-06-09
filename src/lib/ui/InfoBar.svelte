<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/ui/cn';

	type Props = {
		label?: string;
		class?: ClassValue;
		children?: Snippet;
	};

	let { label, class: className = '', children }: Props = $props();

	const infoBarClass = $derived(
		cn(
			'w-full rounded-[0.45rem] bg-info-50 px-4 py-3 text-[0.76rem] leading-relaxed text-stone-900',
			className
		)
	);
</script>

<aside class={infoBarClass}>
	{#if label}
		<span class="font-semibold text-stone-950">{label}</span>
	{/if}
	{#if children}
		<span class={label ? 'ml-1' : undefined}>
			{@render children()}
		</span>
	{/if}
</aside>
