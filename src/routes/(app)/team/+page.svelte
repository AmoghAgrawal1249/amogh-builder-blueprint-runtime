<script lang="ts">
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { APP_ROUTE_REGISTRY } from '$lib/app/app-routes';
	import {
		ListRoutePage,
		SelectableList,
		type EmptyListStateConfig,
		type ListRouteStatus,
		type NoResultsListStateConfig
	} from '$lib/layout/list';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import AddTeammatesModal from '$lib/features/teammates/list/AddTeammatesModal.svelte';
	import TeammateListRow, {
		type TeammateItem
	} from '$lib/features/teammates/list/TeammateListRow.svelte';
	import { parseTeammateEmailInput } from '$lib/features/teammates/list/teammate-email-input';

	const client = useConvexClient();
	const teammatesQuery = useQuery(api.teammates.listTeammates);
	let modalOpen = $state(false);
	let teammateEmails = $state('');
	let modalError = $state<string | null>(null);
	let isAddingTeammates = $state(false);
	let deletingTeammateIds = $state<Id<'teammates'>[]>([]);
	let actionError = $state<string | null>(null);
	let editingTeammateId = $state<Id<'teammates'> | null>(null);
	let savingTeammateId = $state<Id<'teammates'> | null>(null);
	let searchQuery = $state('');
	let selectedRoleFilter = $state('all');
	let teammateDraft = $state({
		name: '',
		email: '',
		role: ''
	});
	const teammateItems = $derived((teammatesQuery.data ?? []).map(toTeammateItem));
	const roleFilterOptions = $derived(getRoleFilterOptions(teammatesQuery.data ?? []));
	const selectedRoleFilterLabel = $derived(
		roleFilterOptions.find((option) => option.id === selectedRoleFilter)?.label ?? 'All roles'
	);
	const filteredTeammateItems = $derived(teammateItems.filter(matchesTeammateFilters));
	const emptyListState = {
		icon: APP_ROUTE_REGISTRY.team.icon,
		title: 'No team members found',
		description: [
			{ kind: 'text', text: 'Add team members so you can assign them to email formats' }
		],
		nextSteps:
			'Team members are the people inside your organization who receive emails. Add team members here, then add them to the right email formats',
		actionLabel: 'Add team members',
		onAction: openModal
	} satisfies EmptyListStateConfig;
	const noResultsState = {
		title: 'No matching team members',
		description: 'Try a different search term, email, or role'
	} satisfies NoResultsListStateConfig;
	const listStatus = $derived<ListRouteStatus>(
		teammatesQuery.isLoading
			? 'loading'
			: teammatesQuery.error
				? 'error'
				: 'ready'
	);
	const totalRecords = $derived(teammateItems.length);
	const visibleRecords = $derived(filteredTeammateItems.length);
	const isQueryActive = $derived(Boolean(searchQuery.trim()) || selectedRoleFilter !== 'all');

	type TeammateRecord = NonNullable<typeof teammatesQuery.data>[number];

	$effect(() => {
		if (!roleFilterOptions.some((option) => option.id === selectedRoleFilter)) {
			selectedRoleFilter = 'all';
		}
	});

	function normalizeSearchText(value: string) {
		return value.trim().toLowerCase();
	}

	function normalizeRole(value: string) {
		return value.trim();
	}

	function roleFilterKey(role: string) {
		return normalizeRole(role).toLowerCase();
	}

	function roleFilterId(role: string) {
		const roleKey = roleFilterKey(role);
		return roleKey ? `role:${roleKey}` : 'no-role';
	}

	function getRoleFilterOptions(teammates: TeammateRecord[]) {
		const roles: { key: string; label: string }[] = [];

		for (const teammate of teammates) {
			const role = normalizeRole(teammate.role);
			const roleKey = roleFilterKey(role);

			if (roleKey && !roles.some((existingRole) => existingRole.key === roleKey)) {
				roles.push({ key: roleKey, label: role });
			}
		}

		const sortedRoles = [...roles].sort(
			(firstRole, secondRole) =>
				firstRole.label.localeCompare(secondRole.label) ||
				firstRole.key.localeCompare(secondRole.key)
		);
		const hasNoRole = teammates.some((teammate) => normalizeRole(teammate.role).length === 0);

		return [
			{ id: 'all', label: 'All roles' },
			...sortedRoles.map((role) => ({ id: `role:${role.key}`, label: role.label })),
			...(hasNoRole ? [{ id: 'no-role', label: 'No role' }] : [])
		];
	}

	function matchesTeammateFilters(item: TeammateItem) {
		if (selectedRoleFilter !== 'all' && roleFilterId(item.role) !== selectedRoleFilter) {
			return false;
		}

		const normalizedQuery = normalizeSearchText(searchQuery);

		if (!normalizedQuery) {
			return true;
		}

		return [item.displayName, item.email, item.role].some((value) =>
			value.toLowerCase().includes(normalizedQuery)
		);
	}

	function openModal() {
		modalError = null;
		modalOpen = true;
	}

	function closeModal() {
		if (isAddingTeammates) {
			return;
		}

		modalOpen = false;
		modalError = null;
	}

	async function addTeammates() {
		if (isAddingTeammates) {
			return;
		}

		const result = parseTeammateEmailInput(teammateEmails);

		if (result.error) {
			modalError = result.error;
			return;
		}

		modalError = null;
		isAddingTeammates = true;

		try {
			await client.mutation(api.teammates.addTeammates, {
				emails: result.emails
			});
			teammateEmails = '';
			modalOpen = false;
		} catch (error) {
			modalError = error instanceof Error ? error.message : 'Could not add team members.';
		} finally {
			isAddingTeammates = false;
		}
	}

	function isDeletingTeammate(teammateId: Id<'teammates'>) {
		return deletingTeammateIds.includes(teammateId);
	}

	function editTeammate(teammate: TeammateRecord) {
		actionError = null;
		editingTeammateId = teammate.id;
		teammateDraft = {
			name: teammate.name,
			email: teammate.email,
			role: teammate.role
		};
	}

	function closeTeammateEditor() {
		editingTeammateId = null;
		teammateDraft = {
			name: '',
			email: '',
			role: ''
		};
	}

	function updateTeammateDraft(patch: Partial<typeof teammateDraft>) {
		teammateDraft = { ...teammateDraft, ...patch };
	}

	async function saveTeammate(teammate: TeammateRecord) {
		if (savingTeammateId) {
			return;
		}

		actionError = null;
		savingTeammateId = teammate.id;

		try {
			await client.mutation(api.teammates.updateTeammate, {
				teammateId: teammate.id,
				name: teammateDraft.name,
				email: teammateDraft.email,
				role: teammateDraft.role
			});
			closeTeammateEditor();
		} catch (error) {
			actionError = error instanceof Error ? error.message : 'Could not update team member.';
		} finally {
			savingTeammateId = null;
		}
	}

	async function deleteTeammates(teammateIds: Id<'teammates'>[]) {
		const idsToDelete = teammateIds.filter((id) => !isDeletingTeammate(id));

		if (idsToDelete.length === 0) {
			return;
		}

		actionError = null;
		deletingTeammateIds = [...deletingTeammateIds, ...idsToDelete];

		try {
			await client.mutation(api.teammates.deleteTeammates, {
				teammateIds: idsToDelete
			});
		} catch (error) {
			actionError = error instanceof Error ? error.message : 'Could not delete team members.';
		} finally {
			deletingTeammateIds = deletingTeammateIds.filter((id) => !idsToDelete.includes(id));
		}
	}

	function toTeammateItem(teammate: TeammateRecord): TeammateItem {
		const isDeleting = isDeletingTeammate(teammate.id);
		const isEditing = editingTeammateId === teammate.id;
		const isSaving = savingTeammateId === teammate.id;
		const isBusy = isDeleting || isSaving;

		return {
			id: teammate.id,
			email: teammate.email,
			role: teammate.role,
			displayName: teammate.displayName,
			isEditing,
			nameDraft: isEditing ? teammateDraft.name : '',
			emailDraft: isEditing ? teammateDraft.email : teammate.email,
			roleDraft: isEditing ? teammateDraft.role : teammate.role,
			deleteLabel: isDeleting ? 'Deleting...' : 'Delete',
			saveLabel: isSaving ? 'Saving...' : 'Save',
			deleteDisabled: isBusy,
			saveDisabled: isBusy,
			onEdit: () => editTeammate(teammate),
			onCancel: closeTeammateEditor,
			onSave: () => saveTeammate(teammate),
			onDelete: () => deleteTeammates([teammate.id]),
			onNameDraftChange: (name) => updateTeammateDraft({ name }),
			onEmailDraftChange: (email) => updateTeammateDraft({ email }),
			onRoleDraftChange: (role) => updateTeammateDraft({ role }),
			selectAriaLabel: `Select ${teammate.displayName}`,
			actionsAriaLabel: 'Team member actions',
			actions: isEditing
				? undefined
				: [
						{
							label: isDeleting ? 'Deleting...' : 'Delete',
							ariaLabel: `Delete ${teammate.displayName}`,
							intent: 'destructive',
							disabled: isDeleting,
							onSelect: () => deleteTeammates([teammate.id])
						}
					]
		};
	}
</script>

<ListRoutePage
	toolbar={{
		searchPlaceholder: 'Search team members...',
		searchAriaLabel: 'Search team members',
		searchValue: searchQuery,
		onSearchValueChange: (value) => (searchQuery = value),
		filters: [
			{
				id: 'role',
				label: selectedRoleFilterLabel,
				selectedId: selectedRoleFilter,
				width: 'wide',
				options: roleFilterOptions,
				onSelect: (optionId) => (selectedRoleFilter = optionId)
			}
		],
		actionLabel: 'Add team members',
		onAction: openModal
	}}
	empty={emptyListState}
	noResults={noResultsState}
	status={listStatus}
	{totalRecords}
	{visibleRecords}
	{isQueryActive}
	loadingMessage="Loading team members..."
	errorMessage="Could not load team members."
>
	{#snippet contentHeader()}
		{#if actionError}
			<p class="border-b border-red-100 bg-red-50 px-4 py-2 text-[0.72rem] text-red-700 md:px-5">
				{actionError}
			</p>
		{/if}
	{/snippet}

	<SelectableList
		items={filteredTeammateItems}
		selectAllAriaLabel="Select all team members"
		selectedActionsAriaLabel="Selected team member actions"
		selectedActions={[
			{
				label: deletingTeammateIds.length > 0 ? 'Deleting...' : 'Delete',
				ariaLabel: 'Delete selected team members',
				intent: 'destructive',
				disabled: deletingTeammateIds.length > 0,
				onSelect: (selectedTeammateIds) =>
					deleteTeammates(selectedTeammateIds as Id<'teammates'>[])
			}
		]}
		rowActionsAriaLabel="Team member actions"
	>
		{#snippet rowCells(item)}
			<TeammateListRow {item} />
		{/snippet}
	</SelectableList>
</ListRoutePage>

<AddTeammatesModal
	error={modalError}
	isAdding={isAddingTeammates}
	open={modalOpen}
	value={teammateEmails}
	onClose={closeModal}
	onSubmit={addTeammates}
	onValueChange={(value) => (teammateEmails = value)}
/>
