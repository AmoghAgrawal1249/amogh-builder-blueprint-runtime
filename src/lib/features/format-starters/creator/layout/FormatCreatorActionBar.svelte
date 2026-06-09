<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/ui/cn';

	type Props = {
		primary: Snippet;
		secondary?: Snippet;
		mobileOrder?: 'primary-first' | 'secondary-first';
		class?: ClassValue;
	};

	let {
		primary,
		secondary,
		mobileOrder = 'primary-first',
		class: className = ''
	}: Props = $props();
</script>

<div
	class={cn(
		'sticky bottom-0 z-10 shrink-0 bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_24px_rgba(28,25,23,0.04)] md:static md:px-7 md:py-3 md:shadow-none',
		className
	)}
>
	<div
		class={cn(
			'flex w-full gap-2 md:flex-row md:items-center md:justify-end',
			mobileOrder === 'primary-first' ? 'flex-col-reverse' : 'flex-col'
		)}
	>
		{@render secondary?.()}
		{@render primary()}
	</div>
</div>
