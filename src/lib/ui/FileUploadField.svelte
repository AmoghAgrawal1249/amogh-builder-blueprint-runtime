<script lang="ts">
	import UploadSimpleIcon from 'phosphor-svelte/lib/UploadSimpleIcon';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/ui/cn';

	type Props = {
		accept?: string;
		disabled?: boolean;
		label: string;
		description?: string;
		selectedFile?: File | null;
		errorText?: string | null;
		class?: ClassValue;
		onFileSelected?: (file: File) => void;
	};

	let {
		accept,
		disabled = false,
		label,
		description,
		selectedFile = null,
		errorText = null,
		class: className = '',
		onFileSelected
	}: Props = $props();

	let inputElement = $state<HTMLInputElement | null>(null);
	let isDragging = $state(false);

	const fieldClass = $derived(
		cn(
			'w-full rounded-sm border border-dashed border-stone-200 bg-stone-50/45 p-2.5 text-left transition-colors',
			!disabled && 'cursor-pointer hover:border-stone-300 hover:bg-stone-50/80',
			disabled && 'cursor-default opacity-60',
			isDragging && !disabled && 'border-info-200 bg-info-50',
			className
		)
	);

	function chooseFile() {
		if (disabled) {
			return;
		}

		inputElement?.click();
	}

	function selectFile(file: File | undefined) {
		if (!file || disabled) {
			return;
		}

		onFileSelected?.(file);
	}

	function handleFileChange(event: Event) {
		const input = event.currentTarget;

		if (!(input instanceof HTMLInputElement)) {
			return;
		}

		const file = input.files?.[0];
		input.value = '';
		selectFile(file);
	}

	function handleDragEnter(event: DragEvent) {
		event.preventDefault();

		if (!disabled) {
			isDragging = true;
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
	}

	function handleDragLeave(event: DragEvent) {
		if (event.currentTarget === event.target) {
			isDragging = false;
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;

		selectFile(event.dataTransfer?.files[0]);
	}
</script>

<div class="w-full space-y-2">
	<input
		bind:this={inputElement}
		type="file"
		{accept}
		{disabled}
		class="sr-only"
		onchange={handleFileChange}
	/>

	<button
		type="button"
		class={fieldClass}
		{disabled}
		onclick={chooseFile}
		ondragenter={handleDragEnter}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
	>
		<span class="flex items-start gap-2.5">
			<span
				class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-sm border border-stone-200 bg-white text-stone-500"
				aria-hidden="true"
			>
				<UploadSimpleIcon size={14} weight="regular" />
			</span>
			<span class="min-w-0 flex-1">
				<span class="block text-[0.76rem] leading-tight font-medium text-stone-950">
					{label}
				</span>
				{#if description}
					<span class="mt-1 block text-[0.68rem] leading-relaxed text-stone-600">
						{description}
					</span>
				{/if}
				<span class="mt-2 block min-h-4 truncate text-[0.68rem] leading-4 text-stone-500">
					{selectedFile?.name ?? 'Choose a file or drop it here'}
				</span>
			</span>
		</span>
	</button>

	{#if errorText}
		<p class="text-[0.68rem] leading-relaxed text-red-600">{errorText}</p>
	{/if}
</div>
