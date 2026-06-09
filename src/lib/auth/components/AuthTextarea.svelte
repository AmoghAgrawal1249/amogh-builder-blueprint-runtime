<script lang="ts">
	import { tick } from 'svelte';
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import { cn } from '$lib/ui/cn';

	type Props = {
		label: string;
		value: string;
		placeholder?: string;
		autocomplete?: HTMLTextareaAttributes['autocomplete'];
		required?: boolean;
		autofocus?: boolean;
		submitOnEnter?: boolean;
	};

	let {
		label,
		value = $bindable(),
		placeholder = '',
		autocomplete,
		required = false,
		autofocus = false,
		submitOnEnter = false
	}: Props = $props();

	let textareaElement = $state<HTMLTextAreaElement | null>(null);

	function handleKeydown(event: KeyboardEvent) {
		if (!submitOnEnter || event.key !== 'Enter' || event.shiftKey) {
			return;
		}

		event.preventDefault();
		textareaElement?.form?.requestSubmit();
	}

	$effect(() => {
		if (!autofocus || !textareaElement) {
			return;
		}

		tick().then(() => {
			textareaElement?.focus();
			textareaElement?.select();
		});
	});
</script>

<label class="block min-w-0">
	<span class="sr-only">{label}</span>
	<textarea
		bind:this={textareaElement}
		bind:value
		placeholder={placeholder || label}
		{autocomplete}
		{required}
		rows="4"
		onkeydown={handleKeydown}
		class={cn(
			'box-border min-h-24 w-full resize-none rounded-md border border-[#e2e3e6] bg-white px-3.5 py-3 text-sm leading-5 text-[#202124] outline-none transition-[background-color,border-color,box-shadow,color] duration-150 placeholder:text-[#8f9297] focus:border-[var(--auth-accent-400)] focus:shadow-[0_0_0_0.5px_var(--auth-accent-400)]'
		)}
	></textarea>
</label>
