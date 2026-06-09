<script lang="ts">
	import SplitPane from '$lib/layout/split-pane/SplitPane.svelte';
	import EmailFeedbackEmptyState from './EmailFeedbackEmptyState.svelte';
	import EmailFormatConfigureLoadState from './EmailFormatConfigureLoadState.svelte';
	import EmailFormatConfigureTopStatus from './EmailFormatConfigureTopStatus.svelte';
	import EmailFeedbackPanel from './EmailFeedbackPanel.svelte';
	import EmailFormatContentPanel from './EmailFormatContentPanel.svelte';
	import EmailFormatRulesPanel from './EmailFormatRulesPanel.svelte';
	import SentEmailPreviewPanel from './SentEmailPreviewPanel.svelte';
	import type { EmailFormatConfigureSharedProps } from './email-format-configure-shared-props';
	import type {
		EmailFeedback,
		EmailFeedbackViewState,
		EmailFormatConfigureView
	} from './email-format-configure-types';

	type Props = EmailFormatConfigureSharedProps & {
		deleteError: string | null;
		configureView: EmailFormatConfigureView;
		feedbackViewState: EmailFeedbackViewState;
		onFeedbackChange: (patch: Partial<EmailFeedback>) => void;
		onSaveFeedback: () => void | Promise<void>;
		onShowNextSentEmail: () => void;
		onShowPreviousSentEmail: () => void;
	};

	const EMAIL_FORMAT_CONFIGURE_SPLIT = {
		minPrimary: 320,
		minSecondary: 400,
		defaultRatio: 0.35,
		mobileBreakpoint: 741,
		keyboardStep: 24,
		handleWidth: 1
	} as const;

	let {
		actionError,
		deleteError,
		configureState,
		configureView,
		feedbackViewState,
		activationBlockerMessage,
		activationReadyMessage,
		activationSuccessMessage,
		isUpdatingStatus,
		contentError,
		contentEditPolicy,
		contentVariables,
		dragCoordinator,
		loadState,
		ruleInfoCard,
		rulesEditPolicy,
		onFeedbackChange,
		onKeepMineContent,
		onKeepMineRules,
		onKeepMineTitle,
		onSaveContent,
		onSaveFeedback,
		onSaveRules,
		onActivateFormat,
		onShowNextSentEmail,
		onShowPreviousSentEmail,
		onUseLatestContent,
		onUseLatestRules,
		onUseLatestTitle
	}: Props = $props();
</script>

<div class="hidden h-full min-h-0 flex-col overflow-hidden md:flex">
	<div class="shrink-0">
		<EmailFormatConfigureTopStatus
			variant="desktop"
			{actionError}
			{deleteError}
			{configureState}
			{activationBlockerMessage}
			{activationReadyMessage}
			{activationSuccessMessage}
			{isUpdatingStatus}
			{onActivateFormat}
			{onKeepMineTitle}
			{onUseLatestTitle}
		/>
	</div>

	<div class="min-h-0 flex-1 overflow-hidden">
		{#if loadState !== 'ready'}
			<EmailFormatConfigureLoadState {loadState} variant="desktop" />
		{:else if configureView === 'feedback' && feedbackViewState.kind === 'empty'}
			<EmailFeedbackEmptyState />
		{:else}
			<SplitPane
				minPrimary={EMAIL_FORMAT_CONFIGURE_SPLIT.minPrimary}
				minSecondary={EMAIL_FORMAT_CONFIGURE_SPLIT.minSecondary}
				defaultRatio={EMAIL_FORMAT_CONFIGURE_SPLIT.defaultRatio}
				mobileBreakpoint={EMAIL_FORMAT_CONFIGURE_SPLIT.mobileBreakpoint}
				keyboardStep={EMAIL_FORMAT_CONFIGURE_SPLIT.keyboardStep}
				handleWidth={EMAIL_FORMAT_CONFIGURE_SPLIT.handleWidth}
				label="Resize email format configuration panels"
			>
				{#snippet primary()}
					{#if configureView === 'rules'}
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
					{:else if feedbackViewState.kind === 'selected'}
						<SentEmailPreviewPanel
							sentEmail={feedbackViewState.sentEmail}
							canGoPrevious={feedbackViewState.canGoPrevious}
							canGoNext={feedbackViewState.canGoNext}
							onPrevious={onShowPreviousSentEmail}
							onNext={onShowNextSentEmail}
						/>
					{/if}
				{/snippet}

				{#snippet secondary()}
					{#if configureView === 'rules'}
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
					{:else if feedbackViewState.kind === 'selected'}
						<EmailFeedbackPanel
							likedValue={feedbackViewState.feedbackDraft.likedText}
							improvementValue={feedbackViewState.feedbackDraft.improvementText}
							canSave={feedbackViewState.canSave}
							onLikedValueChange={(nextValue) => {
								onFeedbackChange({ likedText: nextValue });
							}}
							onImprovementValueChange={(nextValue) => {
								onFeedbackChange({ improvementText: nextValue });
							}}
							onSave={onSaveFeedback}
						/>
					{/if}
				{/snippet}
			</SplitPane>
		{/if}
	</div>
</div>
