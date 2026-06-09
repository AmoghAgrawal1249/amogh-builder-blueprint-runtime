<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/ui/cn';
	import { inlineLinkClass } from '$lib/ui/link-styles';
	import type { ButtonHref, ButtonType } from '$lib/ui/types';

	type InfoBarActionHref = ButtonHref | `/${string}`;

	type Props = {
		href?: InfoBarActionHref;
		type?: ButtonType;
		class?: ClassValue;
		onclick?: (event: MouseEvent) => void;
		children?: Snippet;
	};

	let { href, type = 'button', class: className = '', onclick, children }: Props = $props();

	const actionClass = $derived(
		cn(
			inlineLinkClass,
			!href && 'cursor-pointer border-0 bg-transparent p-0 text-left font-[inherit]',
			className
		)
	);
</script>

{#if href}
	<a class={actionClass} href={resolve(href as '/')}>
		{@render children?.()}
	</a>
{:else}
	<button {type} class={actionClass} {onclick}>
		{@render children?.()}
	</button>
{/if}
