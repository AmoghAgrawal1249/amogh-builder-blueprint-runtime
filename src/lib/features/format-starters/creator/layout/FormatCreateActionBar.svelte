<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Button } from '$lib/ui';
	import FormatCreatorActionBar from './FormatCreatorActionBar.svelte';

	type Props = {
		disabled: boolean;
		label: string;
		error: string | null;
		onPublish: () => void;
		secondaryAction?: Snippet;
		mobileOrder?: 'primary-first' | 'secondary-first';
		class?: string;
		buttonClass?: string;
	};

	let {
		disabled,
		label,
		error,
		onPublish,
		secondaryAction,
		mobileOrder = 'primary-first',
		class: className = '',
		buttonClass = 'h-10 w-full text-[0.8rem] md:h-8 md:w-auto md:text-[0.74rem]'
	}: Props = $props();
</script>

{#if error}
	<p class="bg-red-50 px-4 py-2 text-[0.72rem] text-red-700 md:px-7">
		{error}
	</p>
{/if}
<FormatCreatorActionBar class={className} {mobileOrder}>
	{#snippet secondary()}
		{@render secondaryAction?.()}
	{/snippet}

	{#snippet primary()}
		<Button variant="primary" {disabled} class={buttonClass} onclick={onPublish}>
			{label}
		</Button>
	{/snippet}
</FormatCreatorActionBar>
