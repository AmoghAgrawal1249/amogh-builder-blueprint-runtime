<script lang="ts">
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { useAppConvexPreloader } from '$lib/app/app-convex-preloader.svelte';
	import { APP_LINKS, emailFormatLink } from '$lib/app/app-links';
	import { APP_ROUTE_REGISTRY } from '$lib/app/app-routes';
	import {
		ListRoutePage,
		SelectableList,
		type EmptyListStateConfig,
		type ListRouteStatus,
		type NoResultsListStateConfig
	} from '$lib/layout/list';
	import { InfoBar } from '$lib/ui';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { onDestroy } from 'svelte';
	import EmailFormatActivationStatusBar from '$lib/features/email-formats/configure/EmailFormatActivationStatusBar.svelte';
	import {
		createTimedNotice,
		getActivationSuccessMessage
	} from '$lib/features/email-formats/configure/email-format-activation-notices.svelte';
	import EmailFormatListRow, {
		type EmailFormatListItem
	} from '$lib/features/email-formats/list/EmailFormatListRow.svelte';

	type EmailFormatStatus = 'active' | 'paused';
	type FormatStatusFilterId = 'all' | EmailFormatStatus;

	const client = useConvexClient();
	const appConvexPreloader = useAppConvexPreloader();
	const formatsQuery = useQuery(api.emailFormats.listEmailFormats);
	const dateFormatter = new Intl.DateTimeFormat(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
	let updatingFormatIds = $state<Id<'emailFormats'>[]>([]);
	let deletingFormatIds = $state<Id<'emailFormats'>[]>([]);
	let actionError = $state<string | null>(null);
	const activationSuccessNotice = createTimedNotice();
	let searchQuery = $state('');
	let selectedStatusFilter = $state<FormatStatusFilterId>('all');
	const formatItems = $derived((formatsQuery.data ?? []).map(toFormatItem));
	const filteredFormatItems = $derived(formatItems.filter(matchesFormatFilters));
	const emptyListState = {
		icon: APP_ROUTE_REGISTRY['email-formats'].icon,
		title: 'No email formats found',
		description: 'Create your first local email draft from a format.',
		nextSteps: [
			{ kind: 'link', text: 'Create', href: APP_LINKS.createFormats.pathname },
			{
				kind: 'text',
				text: ' the format of the emails your team will receive'
			}
		]
	} satisfies EmptyListStateConfig;
	const noResultsState = {
		title: 'No matching email formats',
		description: 'Try a different search term, creator, or status'
	} satisfies NoResultsListStateConfig;
	const listStatus = $derived<ListRouteStatus>(
		formatsQuery.isLoading
			? 'loading'
			: formatsQuery.error
				? 'error'
				: 'ready'
	);
	const totalRecords = $derived(formatItems.length);
	const visibleRecords = $derived(filteredFormatItems.length);
	const isQueryActive = $derived(Boolean(searchQuery.trim()) || selectedStatusFilter !== 'all');

	const statusFilterOptions: { id: FormatStatusFilterId; label: string }[] = [
		{ id: 'all', label: 'All email formats' },
		{ id: 'active', label: 'Active' },
		{ id: 'paused', label: 'Paused' }
	];

	const selectedStatusFilterLabel = $derived(
		statusFilterOptions.find((option) => option.id === selectedStatusFilter)?.label ?? 'All email formats'
	);

	type EmailFormatListRecord = NonNullable<typeof formatsQuery.data>[number];

	onDestroy(() => {
		activationSuccessNotice.destroy();
	});

	function formatStatus(status: EmailFormatListRecord['status']) {
		return status === 'active' ? 'Active' : 'Paused';
	}

	function normalizeSearchText(value: string) {
		return value.trim().toLowerCase();
	}

	function setSelectedStatusFilter(optionId: string) {
		if (optionId === 'all' || optionId === 'active' || optionId === 'paused') {
			selectedStatusFilter = optionId;
		}
	}

	function matchesFormatFilters(item: EmailFormatListItem) {
		const normalizedQuery = normalizeSearchText(searchQuery);

		return (
			(selectedStatusFilter === 'all' || item.status === selectedStatusFilter) &&
			(!normalizedQuery ||
				[item.title, item.creator.name].some((value) =>
					value.toLowerCase().includes(normalizedQuery)
				))
		);
	}

	function getStatusLabelClass(status: EmailFormatListRecord['status']) {
		return status === 'active' ? 'text-stone-400' : 'text-red-300';
	}

	function isUpdatingFormat(formatId: Id<'emailFormats'>) {
		return updatingFormatIds.includes(formatId);
	}

	function isDeletingFormat(formatId: Id<'emailFormats'>) {
		return deletingFormatIds.includes(formatId);
	}

	function areAnyBusy(formatIds: string[]) {
		return formatIds.some((formatId) =>
			[...updatingFormatIds, ...deletingFormatIds].includes(formatId as Id<'emailFormats'>)
		);
	}

	function showActivationSuccessNotice() {
		activationSuccessNotice.show(getActivationSuccessMessage());
	}

	async function setFormatStatus(formatIds: Id<'emailFormats'>[], status: EmailFormatStatus) {
		const idsToUpdate = formatIds.filter(
			(formatId) => !isUpdatingFormat(formatId) && !isDeletingFormat(formatId)
		);

		if (idsToUpdate.length === 0) {
			return;
		}

		actionError = null;
		activationSuccessNotice.clear();
		updatingFormatIds = [...updatingFormatIds, ...idsToUpdate];

		try {
			for (const emailFormatId of idsToUpdate) {
				await client.mutation(api.emailFormats.setEmailFormatStatus, {
					emailFormatId,
					status
				});
			}
			if (status === 'active') {
				showActivationSuccessNotice();
			}
		} catch (error) {
			actionError =
				error instanceof Error
					? error.message
					: `Could not ${status === 'active' ? 'activate' : 'pause'} email format.`;
		} finally {
			updatingFormatIds = updatingFormatIds.filter((id) => !idsToUpdate.includes(id));
		}
	}

	async function deleteFormats(formatIds: Id<'emailFormats'>[]) {
		const idsToDelete = formatIds.filter(
			(formatId) => !isDeletingFormat(formatId) && !isUpdatingFormat(formatId)
		);

		if (idsToDelete.length === 0) {
			return;
		}

		actionError = null;
		activationSuccessNotice.clear();
		deletingFormatIds = [...deletingFormatIds, ...idsToDelete];

		try {
			await client.mutation(api.emailFormats.deleteEmailFormats, {
				emailFormatIds: idsToDelete
			});
		} catch (error) {
			actionError = error instanceof Error ? error.message : 'Could not delete email format.';
		} finally {
			deletingFormatIds = deletingFormatIds.filter((id) => !idsToDelete.includes(id));
		}
	}

	function toFormatItem(format: EmailFormatListRecord): EmailFormatListItem {
		const isUpdating = isUpdatingFormat(format.id);
		const isDeleting = isDeletingFormat(format.id);
		const isBusy = isUpdating || isDeleting;
		const activateDisabled = isBusy || !format.activation.canActivate;

		return {
			id: format.id,
			title: format.title,
			status: format.status,
			href: emailFormatLink(format.id).pathname,
			onPreload: () => appConvexPreloader.preloadEmailFormatConfiguration(format.id),
			selectAriaLabel: `Select ${format.title}`,
			statusLabel: formatStatus(format.status),
			statusLabelClass: getStatusLabelClass(format.status),
			createdAtLabel: dateFormatter.format(new Date(format.createdAt)),
			creator: {
				name: format.creator.name,
				avatarUrl: format.creator.avatarUrl
			},
			actionsAriaLabel: 'Email format actions',
			actions: [
				format.status === 'active'
					? {
							label: isUpdating ? 'Pausing...' : 'Pause',
							ariaLabel: `Pause ${format.title}`,
							disabled: isBusy,
							onSelect: () => setFormatStatus([format.id], 'paused')
						}
					: {
							label: isUpdating ? 'Activating...' : 'Activate',
							ariaLabel: `Activate ${format.title}`,
							disabled: activateDisabled,
							onSelect: () => setFormatStatus([format.id], 'active')
						},
				{
					label: isDeleting ? 'Deleting...' : 'Delete',
					ariaLabel: `Delete ${format.title}`,
					intent: 'destructive',
					disabled: isBusy,
					onSelect: () => deleteFormats([format.id])
				}
			]
		};
	}
</script>

<ListRoutePage
	toolbar={{
		searchPlaceholder: 'Search email formats...',
		searchAriaLabel: 'Search email formats',
		searchValue: searchQuery,
		onSearchValueChange: (value) => (searchQuery = value),
		filters: [
			{
				id: 'status',
				label: selectedStatusFilterLabel,
				selectedId: selectedStatusFilter,
				options: statusFilterOptions,
				onSelect: setSelectedStatusFilter
			}
		]
	}}
	empty={emptyListState}
	noResults={noResultsState}
	status={listStatus}
	{totalRecords}
	{visibleRecords}
	{isQueryActive}
	loadingMessage="Loading email formats..."
	errorMessage="Could not load email formats."
>
	{#snippet contentHeader()}
		{#if actionError}
			<p class="border-b border-red-100 bg-red-50 px-4 py-2 text-[0.72rem] text-red-700 md:px-5">
				{actionError}
			</p>
		{:else if activationSuccessNotice.message}
			<EmailFormatActivationStatusBar
				message={activationSuccessNotice.message}
				kind="success"
				class="border-b"
			/>
		{/if}
	{/snippet}

	<SelectableList
		items={filteredFormatItems}
		selectAllAriaLabel="Select all email formats"
		selectedActionsAriaLabel="Selected email format actions"
		selectedActions={[
			{
				label: 'Pause selected',
				ariaLabel: 'Pause selected email formats',
				disabled: areAnyBusy,
				onSelect: (selectedFormatIds) =>
					setFormatStatus(selectedFormatIds as Id<'emailFormats'>[], 'paused')
			},
			{
				label: 'Delete',
				ariaLabel: 'Delete selected email formats',
				intent: 'destructive',
				disabled: areAnyBusy,
				onSelect: (selectedFormatIds) =>
					deleteFormats(selectedFormatIds as Id<'emailFormats'>[])
			}
		]}
		rowActionsAriaLabel="Email format actions"
	>
		{#snippet rowCells(item)}
			<EmailFormatListRow {item} />
		{/snippet}
	</SelectableList>

	{#snippet footer()}
		<InfoBar label="Next steps:">
			Click an email format to set its rules and configure which team members should receive it
		</InfoBar>
	{/snippet}
</ListRoutePage>
