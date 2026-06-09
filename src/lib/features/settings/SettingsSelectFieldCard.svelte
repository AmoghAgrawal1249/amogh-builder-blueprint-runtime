<script lang="ts">
	import { Button, SelectMenu } from '$lib/ui';
	import SettingsCard from './SettingsCard.svelte';

	type Option = {
		id: string;
		label: string;
	};

	type Props = {
		title: string;
		description: string;
		value: string;
		options: readonly Option[];
		fieldId: string;
		label: string;
		footerText: string;
		placeholder?: string;
		saving?: boolean;
		errorText?: string | null;
		actionLabel?: string;
		onSave: (value: string) => void | Promise<void>;
	};

	let {
		title,
		description,
		value,
		options,
		fieldId,
		label,
		footerText,
		placeholder = '',
		saving = false,
		errorText = null,
		actionLabel = 'Save',
		onSave
	}: Props = $props();

	let draftValue = $state<string | null>(null);
	let localErrorText = $state<string | null>(null);
	let hideServerError = $state(false);
	let syncedValue = $state<string | null>(null);

	const selectedOption = $derived(options.find((option) => option.id === draftValue) ?? null);
	const changed = $derived(Boolean(draftValue) && draftValue !== value);
	const validationErrorText = $derived(selectedOption ? null : `${label} is required.`);
	const serverErrorText = $derived(hideServerError ? null : errorText);
	const shownErrorText = $derived(localErrorText ?? serverErrorText);
	const canSave = $derived(changed && !validationErrorText && !saving);
	const messageId = $derived(`${fieldId}-message`);

	$effect(() => {
		if (syncedValue !== value) {
			draftValue = options.find((option) => option.id === value)?.id ?? null;
			syncedValue = value;
			localErrorText = null;
			hideServerError = false;
		}
	});

	async function handleSave() {
		localErrorText = validationErrorText;
		hideServerError = false;

		if (!canSave || !draftValue) {
			return;
		}

		await onSave(draftValue);
	}
</script>

<SettingsCard {title} {description}>
	<div class="mt-4 max-w-sm space-y-2">
		<SelectMenu
			id={fieldId}
			ariaLabel={label}
			ariaDescribedby={messageId}
			{placeholder}
			selectedId={draftValue}
			{options}
			onSelect={(selectedValue) => {
				draftValue = selectedValue;
				localErrorText = null;
				hideServerError = true;
			}}
			width="full"
			size="standard"
		/>
		<p
			id={messageId}
			class="min-h-5 text-[0.72rem] leading-5 {shownErrorText
				? 'text-red-600'
				: 'text-stone-500'}"
		>
			{shownErrorText ?? ''}
		</p>
	</div>

	{#snippet footer()}
		<p>{footerText}</p>
	{/snippet}

	{#snippet action()}
		<Button disabled={!canSave} onclick={handleSave}>{saving ? 'Saving...' : actionLabel}</Button>
	{/snippet}
</SettingsCard>
