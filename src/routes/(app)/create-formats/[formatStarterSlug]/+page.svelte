<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { api } from '$convex/_generated/api';
	import { onDestroy, onMount, untrack } from 'svelte';
	import { APP_LINKS } from '$lib/app/app-links';
	import { useRouteTitleState } from '$lib/app/chrome/shared/route-title.svelte';
	import SplitPane from '$lib/layout/split-pane/SplitPane.svelte';
	import { Button } from '$lib/ui';
	import { watchMediaQuery } from '$lib/ui/viewport';
	import { useConvexClient } from 'convex-svelte';
	import { FormatCreatorState } from '$lib/features/format-starters/creator/state/format-creator-state.svelte';
	import FormatStarterSelectionPanel from '$lib/features/format-starters/creator/starting-point-selection/FormatStarterSelectionPanel.svelte';
	import { FormatVariableDragCoordinator } from '$lib/features/format-starters/creator/variables/format-variable-drag-coordinator.svelte';
	import { FORMAT_CREATOR_SPLIT } from '$lib/features/format-starters/creator/layout/split-pane';
	import FormatCreatorDesktopPrimaryPanel from '$lib/features/format-starters/creator/layout/FormatCreatorDesktopPrimaryPanel.svelte';
	import FormatCreatorDesktopSecondaryPanel from '$lib/features/format-starters/creator/layout/FormatCreatorDesktopSecondaryPanel.svelte';
	import FormatCreatorMobileInternalData from '$lib/features/format-starters/creator/layout/FormatCreatorMobileInternalData.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const client = useConvexClient();
	const routeTitleState = useRouteTitleState();
	const formatStarter = $derived(data.formatStarter);
	let creator = $state<FormatCreatorState | null>(
		untrack(() => (data.formatStarter ? new FormatCreatorState(data.formatStarter) : null))
	);
	const editorRoute = $derived(
		formatStarter && creator ? { formatStarter, creator } : null
	);
	const variableDragCoordinator = new FormatVariableDragCoordinator();
	let isMobileCreator = $state(false);
	let creatingFormat = $state(false);
	let createFormatError = $state<string | null>(null);
	let createFormatStateFormatStarterSlug = $state('');
	const createFormatDisabled = $derived(creatingFormat || !creator?.canCreateFormat);
	const createFormatLabel = $derived(creatingFormat ? 'Creating...' : 'Create format');
	const createActionProps = $derived({
		createFormatDisabled,
		createFormatLabel,
		createFormatError,
		onCreateEmailFormat: createEmailFormat
	});

	onMount(() => {
		return watchMediaQuery(
			`(max-width: ${FORMAT_CREATOR_SPLIT.mobileBreakpoint - 0.02}px)`,
			(matches) => {
				isMobileCreator = matches;
			}
		);
	});

	onDestroy(() => {
		variableDragCoordinator.endDrag();
	});

	$effect(() => {
		if (!formatStarter) {
			creator = null;
			return;
		}

		if (!creator) {
			creator = new FormatCreatorState(formatStarter);
			return;
		}

		creator.syncFormatStarter(formatStarter);
	});

	$effect(() => {
		if (!formatStarter) {
			return;
		}

		if (createFormatStateFormatStarterSlug !== formatStarter.slug) {
			createFormatStateFormatStarterSlug = formatStarter.slug;
			creatingFormat = false;
			createFormatError = null;
		}
	});

	$effect(() => {
		if (!formatStarter) {
			routeTitleState.editable = false;
			routeTitleState.onTitleChange = null;
			return;
		}

		const updateTitle = (nextTitle: string) => {
			if (!creator) {
				return;
			}

			creator.updateTitle(nextTitle);
			routeTitleState.title = creator.title;
		};

		routeTitleState.editable = true;
		routeTitleState.onTitleChange = creator ? updateTitle : null;

		return () => {
			if (routeTitleState.onTitleChange === updateTitle) {
				routeTitleState.onTitleChange = null;
			}
			if (routeTitleState.editable === true) {
				routeTitleState.editable = null;
			}
		};
	});

	$effect(() => {
		if (!formatStarter) {
			routeTitleState.title = 'Format not found';
			return;
		}

		if (creator) {
			routeTitleState.title = creator.title;
		}
	});

	function getErrorMessage(error: unknown) {
		return error instanceof Error ? error.message : 'Could not create email format.';
	}

	async function createEmailFormat() {
		if (creatingFormat || !creator) {
			return;
		}

		const input = creator.createFormatInput();

		if (!input) {
			createFormatError = 'Could not create email format from the selected starting point.';
			return;
		}

		creatingFormat = true;
		createFormatError = null;

		try {
			await client.mutation(api.emailFormats.createEmailFormatFromStarter, input);
			await goto(resolve(APP_LINKS.emailFormats.pathname));
		} catch (error) {
			createFormatError = getErrorMessage(error);
		} finally {
			creatingFormat = false;
		}
	}
</script>

<section class="flex h-full min-h-full w-full px-0 py-0 md:px-0 md:py-0">
	<div class="min-h-0 min-w-0 flex-1">
		{#if editorRoute}
			{@const formatStarter = editorRoute.formatStarter}
			{@const creator = editorRoute.creator}
			{#key formatStarter.slug}
				{#if isMobileCreator}
					{#if creator.step === 'starting-point-selection' && formatStarter.startingPointSelection.kind === 'guided'}
						<FormatStarterSelectionPanel
							startingPointSelection={formatStarter.startingPointSelection}
							onAnswersChange={creator.updateAnswers}
							onSubmit={creator.continueToEditor}
						/>
					{:else if creator.editor}
						<FormatCreatorMobileInternalData
							editor={creator.editor}
							variablePickerOpen={creator.variablePickerOpen}
							variableInsertionRequest={creator.variableInsertionRequest}
							onVariableInsertionRequest={creator.requestVariableInsertion}
							onVariablePickerOpen={creator.openVariablePicker}
							onVariablePickerClose={creator.closeVariablePicker}
							onVariableInsertionRequestHandled={creator.clearVariableInsertionRequest}
							{formatStarter}
							{variableDragCoordinator}
							{...createActionProps}
						/>
					{/if}
				{:else}
					<SplitPane
						primarySide="right"
						minPrimary={FORMAT_CREATOR_SPLIT.minPrimary}
						minSecondary={FORMAT_CREATOR_SPLIT.minSecondary}
						defaultRatio={FORMAT_CREATOR_SPLIT.defaultRatio}
						mobileBreakpoint={FORMAT_CREATOR_SPLIT.mobileBreakpoint}
						keyboardStep={FORMAT_CREATOR_SPLIT.keyboardStep}
						handleWidth={FORMAT_CREATOR_SPLIT.handleWidth}
						label="Resize create format panels"
					>
						{#snippet primary()}
							{#if creator.step === 'starting-point-selection' && formatStarter.startingPointSelection.kind === 'guided'}
								<FormatStarterSelectionPanel
									startingPointSelection={formatStarter.startingPointSelection}
									onAnswersChange={creator.updateAnswers}
									onSubmit={creator.continueToEditor}
								/>
							{:else}
								<FormatCreatorDesktopPrimaryPanel
									{formatStarter}
									{variableDragCoordinator}
									onRestart={creator.restart}
									{...createActionProps}
								/>
							{/if}
						{/snippet}

						{#snippet secondary()}
							{#if creator.step === 'starting-point-selection'}
								<FormatCreatorDesktopSecondaryPanel
									step="starting-point-selection"
									{formatStarter}
								/>
							{:else if creator.editor}
								<FormatCreatorDesktopSecondaryPanel
									step="editor"
									editor={creator.editor}
									{formatStarter}
									{variableDragCoordinator}
									onVariableInsertionRequestHandled={creator.clearVariableInsertionRequest}
								/>
							{/if}
						{/snippet}
					</SplitPane>
				{/if}
			{/key}
		{:else if !formatStarter}
			<div class="flex h-full min-h-full items-center justify-center bg-white px-6 py-12">
				<div class="w-full max-w-sm rounded-sm border border-stone-200 bg-white p-5 text-center shadow-sm">
					<p class="text-sm font-medium text-stone-950">Format not found</p>
					<p class="mt-2 text-xs leading-relaxed text-stone-500">
						Choose a format from the gallery to start a local draft.
					</p>
					<Button
						variant="primary"
						href={APP_LINKS.createFormats.pathname}
						class="mt-4 rounded-full text-xs"
					>
						Back to create formats
					</Button>
				</div>
			</div>
		{/if}
	</div>
</section>
