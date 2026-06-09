<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/ui/cn';
	import type { ButtonHref, ButtonSize, ButtonType, ButtonVariant } from '$lib/ui/types';

	type Props = {
		'aria-label'?: string;
		'aria-describedby'?: string;
		variant?: ButtonVariant;
		size?: ButtonSize;
		type?: ButtonType;
		href?: ButtonHref;
		disabled?: boolean;
		class?: ClassValue;
		onclick?: (event: MouseEvent) => void;
		children?: Snippet;
		leading?: Snippet;
		trailing?: Snippet;
	};

	let {
		'aria-label': ariaLabel,
		'aria-describedby': ariaDescribedBy,
		variant = 'primary',
		size = 'sm',
		type = 'button',
		href,
		disabled = false,
		class: className = '',
		onclick,
		children,
		leading,
		trailing
	}: Props = $props();

	function handleClick(event: MouseEvent) {
		if (disabled) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}

		onclick?.(event);
	}

	const buttonClass = $derived(
		cn(
			'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-sm transition-colors disabled:cursor-default data-[disabled]:pointer-events-none data-[disabled]:cursor-default',
			size === 'sm'
				? 'h-8 gap-1.5 px-2.5 text-[0.74rem] font-medium'
				: 'size-8 p-0',
			variant === 'primary' &&
				'bg-stone-950 text-white hover:bg-stone-800 disabled:bg-stone-100 disabled:text-stone-400 data-[disabled]:bg-stone-100 data-[disabled]:text-stone-400',
			variant === 'secondary' &&
				'border border-stone-200/60 bg-white text-stone-800 hover:bg-stone-50 disabled:bg-white disabled:text-stone-400 disabled:opacity-55 data-[disabled]:bg-white data-[disabled]:text-stone-400 data-[disabled]:opacity-55',
			variant === 'ghost' &&
				'text-stone-700 hover:bg-stone-100 disabled:bg-transparent disabled:text-stone-400 disabled:opacity-55 data-[disabled]:bg-transparent data-[disabled]:text-stone-400 data-[disabled]:opacity-55',
			className
		)
	);
</script>

{#if href}
	<a
		class={buttonClass}
		href={resolve(href as '/')}
		aria-label={ariaLabel}
		aria-describedby={ariaDescribedBy}
		aria-disabled={disabled || undefined}
		data-disabled={disabled || undefined}
		tabindex={disabled ? -1 : undefined}
		onclick={handleClick}
	>
		{@render leading?.()}
		{@render children?.()}
		{@render trailing?.()}
	</a>
{:else}
	<button
		{type}
		class={buttonClass}
		aria-label={ariaLabel}
		aria-describedby={ariaDescribedBy}
		data-disabled={disabled || undefined}
		{disabled}
		onclick={handleClick}
	>
		{@render leading?.()}
		{@render children?.()}
		{@render trailing?.()}
	</button>
{/if}
