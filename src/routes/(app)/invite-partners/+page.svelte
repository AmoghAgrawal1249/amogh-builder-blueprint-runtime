<script lang="ts">
	import { ListRoutePage } from '$lib/layout/list';
	import AddInvitePartnerModal from '$lib/features/invite-partners/AddInvitePartnerModal.svelte';
	import { APP_ROUTE_REGISTRY } from '$lib/app/app-routes';

	let modalOpen = $state(false);
	let searchQuery = $state('');
</script>

<ListRoutePage
	toolbar={{
		searchPlaceholder: 'Search invitations...',
		searchAriaLabel: 'Search invitations',
		searchValue: searchQuery,
		onSearchValueChange: (value) => (searchQuery = value),
		actionLabel: 'Invite partners',
		onAction: () => (modalOpen = true)
	}}
	empty={{
		icon: APP_ROUTE_REGISTRY['invite-partners'].icon,
		title: 'No invitations found',
		description: 'Invite ecosystem partners to share data and collaborate.',
		nextSteps:
			'Invite your ecosystem partners so you can share sales data with them. You will be able to use their data in your opportunities and they will be able to use your data in a secure way that you control',
		actionLabel: 'Invite partners',
		onAction: () => (modalOpen = true)
	}}
	noResults={{
		title: 'No matching invitations',
		description: 'Try a different search term or invitation status'
	}}
	status="ready"
	totalRecords={0}
	visibleRecords={0}
	isQueryActive={Boolean(searchQuery.trim())}
/>

<AddInvitePartnerModal open={modalOpen} onClose={() => (modalOpen = false)} />
