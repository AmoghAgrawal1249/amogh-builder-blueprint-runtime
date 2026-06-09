<script lang="ts">
	import EmailFormatActivationStatusBar from './EmailFormatActivationStatusBar.svelte';
	import SectionConflictActions from './SectionConflictActions.svelte';
	import type { EmailFormatConfigureState } from './email-format-configure-state.svelte';

	type Props = {
		variant: 'desktop' | 'mobile';
		actionError: string | null;
		deleteError?: string | null;
		configureState: EmailFormatConfigureState;
		activationBlockerMessage: string | null;
		activationBlockerActionLabel?: string | null;
		activationReadyMessage: string | null;
		activationSuccessMessage: string | null;
		isUpdatingStatus: boolean;
		onActivationBlockerAction?: () => void | Promise<void>;
		onActivateFormat: () => void | Promise<void>;
		onKeepMineTitle: () => void | Promise<void>;
		onUseLatestTitle: () => void;
	};

	let {
		variant,
		actionError,
		deleteError = null,
		configureState,
		activationBlockerMessage,
		activationBlockerActionLabel = null,
		activationReadyMessage,
		activationSuccessMessage,
		isUpdatingStatus,
		onActivationBlockerAction,
		onActivateFormat,
		onKeepMineTitle,
		onUseLatestTitle
	}: Props = $props();

	const statusClass = $derived(variant === 'mobile' ? 'mb-4 rounded-sm' : '');
	const errorClass = $derived(
		variant === 'mobile'
			? 'mb-4 rounded-sm bg-red-50 px-3 py-2 text-[0.72rem] text-red-700'
			: 'bg-red-50 px-5 py-2 text-[0.72rem] text-red-700'
	);
	const conflictClass = $derived(
		variant === 'mobile'
			? 'mb-4 rounded-sm bg-amber-50 px-3 py-2'
			: 'bg-amber-50 px-5 py-2'
	);
</script>

{#if activationBlockerMessage}
	<EmailFormatActivationStatusBar
		message={activationBlockerMessage}
		actionLabel={activationBlockerActionLabel}
		onAction={onActivationBlockerAction}
		class={statusClass}
	/>
{:else if activationReadyMessage}
	<EmailFormatActivationStatusBar
		message={activationReadyMessage}
		kind="ready"
		actionLabel="Activate this format"
		actionDisabled={isUpdatingStatus}
		onAction={onActivateFormat}
		class={statusClass}
	/>
{:else if activationSuccessMessage}
	<EmailFormatActivationStatusBar
		message={activationSuccessMessage}
		kind="success"
		class={statusClass}
	/>
{/if}

{#if deleteError || actionError}
	<p class={errorClass}>
		{deleteError ?? actionError}
	</p>
{/if}

{#if configureState.titleConflict}
	<div class={conflictClass}>
		<SectionConflictActions
			conflict={configureState.titleConflict}
			isSaving={configureState.isSavingTitle}
			onKeepMine={onKeepMineTitle}
			onUseLatest={onUseLatestTitle}
		/>
	</div>
{/if}
