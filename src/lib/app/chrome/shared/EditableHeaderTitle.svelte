<script lang="ts">
	import { tick } from 'svelte';
	import PencilSimpleIcon from 'phosphor-svelte/lib/PencilSimpleIcon';
	import { cn } from '$lib/ui/cn';
	import { IconButton } from '$lib/ui';

	type Props = {
		title: string;
		editable?: boolean;
		align?: 'left' | 'center';
		class?: string;
		textClass?: string;
		inputClass?: string;
		buttonClass?: string;
		onTitleChange?: (title: string) => void;
	};

	let {
		title,
		editable = false,
		align = 'left',
		class: className = '',
		textClass = '',
		inputClass = '',
		buttonClass = '',
		onTitleChange
	}: Props = $props();

	let isEditing = $state(false);
	let draftTitle = $state('');
	let inputElement = $state<HTMLInputElement | null>(null);

	function beginEditing() {
		if (!editable) {
			return;
		}

		draftTitle = title;
		isEditing = true;

		tick().then(() => {
			inputElement?.focus();
			inputElement?.select();
		});
	}

	function commitTitle() {
		if (!isEditing) {
			return;
		}

		const nextTitle = draftTitle.trim();

		if (nextTitle && nextTitle !== title) {
			onTitleChange?.(nextTitle);
		}

		draftTitle = nextTitle || title;
		isEditing = false;
	}

	function cancelEditing() {
		draftTitle = title;
		isEditing = false;
	}

	function handleInput(event: Event) {
		draftTitle = (event.currentTarget as HTMLInputElement).value;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			cancelEditing();
		}
	}

	$effect(() => {
		if (!isEditing) {
			draftTitle = title;
		}
	});
</script>

<div
	class={cn(
		'flex min-w-0 items-center gap-1.5',
		align === 'center' && 'justify-center',
		className
	)}
>
	{#if isEditing}
		<form
			class="min-w-0 flex-1 pr-1"
			onsubmit={(event) => {
				event.preventDefault();
				commitTitle();
			}}
		>
			<input
				bind:this={inputElement}
				value={draftTitle}
				aria-label="Edit header title"
				class={cn(
					'h-7 w-full min-w-0 rounded-sm border border-stone-200 bg-white px-2 text-xs font-medium tracking-wide text-stone-700 outline-none transition-colors focus:border-stone-200',
					align === 'center' && 'text-center',
					inputClass
				)}
				oninput={handleInput}
				onkeydown={handleKeydown}
				onblur={commitTitle}
			/>
		</form>
	{:else}
		<span class={cn('block min-w-0 truncate text-xs font-medium tracking-wide text-stone-500', textClass)}>
			{title}
		</span>

		{#if editable}
			<IconButton
				aria-label="Edit title"
				variant="ghost"
				class={cn(
					'size-5 shrink-0 text-stone-400 hover:text-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-300',
					buttonClass
				)}
				onclick={beginEditing}
			>
				<PencilSimpleIcon size={12} weight="regular" />
			</IconButton>
		{/if}
	{/if}
</div>
