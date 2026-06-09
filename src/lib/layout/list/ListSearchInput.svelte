<script lang="ts">
	import MagnifyingGlassIcon from 'phosphor-svelte/lib/MagnifyingGlassIcon';
	import { cn } from '$lib/ui/cn';

	type Props = {
		placeholder: string;
		ariaLabel?: string;
		value?: string;
		onValueChange?: (value: string) => void;
		readonly?: boolean;
		class?: string;
	};

	let {
		placeholder,
		ariaLabel = placeholder,
		value = '',
		onValueChange,
		readonly = false,
		class: className = ''
	}: Props = $props();
</script>

<label class={cn('relative block h-8 min-w-0', className)}>
	<span class="sr-only">{ariaLabel}</span>
	<MagnifyingGlassIcon
		aria-hidden="true"
		size={14}
		weight="regular"
		class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-stone-400"
	/>
	<input
		type="search"
		{placeholder}
		{readonly}
		{value}
		oninput={(event) => onValueChange?.(event.currentTarget.value)}
		class="h-full w-full rounded-sm border border-stone-200/70 bg-white pr-3 pl-8.5 text-[0.72rem] text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-200 md:text-[0.74rem]"
	/>
</label>
