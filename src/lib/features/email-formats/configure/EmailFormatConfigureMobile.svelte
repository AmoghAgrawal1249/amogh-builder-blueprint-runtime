<script lang="ts">
	import EmailFormatConfigureLoadState from './EmailFormatConfigureLoadState.svelte';
	import EmailFormatConfigureTopStatus from './EmailFormatConfigureTopStatus.svelte';
	import EmailFormatContentPanel from './EmailFormatContentPanel.svelte';
	import EmailFormatRulesPanel from './EmailFormatRulesPanel.svelte';
	import type { EmailFormatConfigureSharedProps } from './email-format-configure-shared-props';

	type Props = EmailFormatConfigureSharedProps;

	let {
		actionError,
		activationBlockerMessage,
		activationReadyMessage,
		activationSuccessMessage,
		isUpdatingStatus,
		contentError,
		contentEditPolicy,
		contentVariables,
		configureState,
		dragCoordinator,
		loadState,
		ruleInfoCard,
		rulesEditPolicy,
		onKeepMineContent,
		onKeepMineRules,
		onKeepMineTitle,
		onSaveContent,
		onSaveRules,
		onActivateFormat,
		onUseLatestContent,
		onUseLatestRules,
		onUseLatestTitle
	}: Props = $props();
</script>

<div class="min-h-full bg-white px-4 py-4 md:hidden">
	<EmailFormatConfigureTopStatus
		variant="mobile"
		{actionError}
		{configureState}
		{activationBlockerMessage}
		{activationReadyMessage}
		{activationSuccessMessage}
		{isUpdatingStatus}
		{onActivateFormat}
		{onKeepMineTitle}
		{onUseLatestTitle}
	/>

	{#if loadState !== 'ready'}
		<EmailFormatConfigureLoadState {loadState} variant="mobile" />
	{:else}
		<div class="space-y-5">
			<section class="h-[72vh] min-h-[520px] overflow-hidden">
				<EmailFormatContentPanel
					editor={configureState.contentEditor}
					variables={contentVariables}
					{dragCoordinator}
					editPolicy={contentEditPolicy}
					canSave={configureState.canSaveContent}
					conflict={configureState.contentConflict}
					isSaving={configureState.isSavingContent}
					error={contentError}
					onSave={onSaveContent}
					onKeepMine={onKeepMineContent}
					onUseLatest={onUseLatestContent}
				/>
			</section>

			<section class="border-t border-stone-100 pt-4">
				<EmailFormatRulesPanel
					rules={configureState.rulesDraft}
					editPolicy={rulesEditPolicy}
					{ruleInfoCard}
					canSave={configureState.canSaveRules}
					conflict={configureState.rulesConflict}
					isSaving={configureState.isSavingRules}
					onRulesChange={configureState.updateRules}
					onSave={() => void onSaveRules()}
					onKeepMine={onKeepMineRules}
					onUseLatest={onUseLatestRules}
				/>
			</section>
		</div>
	{/if}
</div>
