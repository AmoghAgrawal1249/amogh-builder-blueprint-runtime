<script lang="ts">
	import { tick } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$lib/ui/cn';

	type Props = {
		label: string;
		value: string;
		placeholder?: string;
		type?: 'email' | 'text' | 'url';
		autocomplete?: HTMLInputAttributes['autocomplete'];
		inputmode?: HTMLInputAttributes['inputmode'];
		required?: boolean;
		autofocus?: boolean;
		invalid?: boolean;
	};

	let {
		label,
		value = $bindable(),
		placeholder = '',
		type = 'text',
		autocomplete,
		inputmode,
		required = false,
		autofocus = false,
		invalid = false
	}: Props = $props();

	let inputElement = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (!autofocus || !inputElement) {
			return;
		}

		tick().then(() => {
			inputElement?.focus();
			inputElement?.select();
		});
	});
</script>

<label class="block min-w-0">
	<span class="sr-only">{label}</span>
	<input
		bind:this={inputElement}
		bind:value
		placeholder={placeholder || label}
		{type}
		{autocomplete}
		{inputmode}
		{required}
		aria-invalid={invalid}
		class={cn(
			'box-border h-10 w-full rounded-md border border-[#e2e3e6] bg-white px-3.5 text-sm leading-none text-[#202124] outline-none transition-[background-color,border-color,box-shadow,color] duration-150 placeholder:text-[#8f9297] focus:border-[var(--auth-accent-400)] focus:shadow-[0_0_0_0.5px_var(--auth-accent-400)]',
			invalid &&
				'border-[#ffb8a8] bg-[#fff0ed] text-[#ff3a1e] placeholder:text-[#ff7b66] focus:border-[#ff9f8d] focus:shadow-[0_0_0_0.5px_#ff9f8d]'
		)}
	/>
</label>
