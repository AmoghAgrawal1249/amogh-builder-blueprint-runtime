<script lang="ts">
	import { APP_ROUTE_REGISTRY } from '$lib/app/app-routes';
	import { ListRoutePage } from '$lib/layout/list';
	import { InfoBar } from '$lib/ui';

	let searchQuery = $state('');
</script>

<ListRoutePage
	toolbar={{
		searchPlaceholder: 'Search team email formats...',
		searchAriaLabel: 'Search team email formats',
		searchValue: searchQuery,
		onSearchValueChange: (value) => (searchQuery = value)
	}}
	empty={{
		icon: APP_ROUTE_REGISTRY['team-email-formats'].icon,
		title: 'No team email formats found',
		description: 'Manage the email formats that your team created for themselves.'
	}}
	noResults={{
		title: 'No matching team email formats',
		description: 'Try a different search term or team member'
	}}
	status="ready"
	totalRecords={0}
	visibleRecords={0}
	isQueryActive={Boolean(searchQuery.trim())}
>
	{#snippet footer()}
		<InfoBar label="Next steps:">
			Ask your team to create their own email formats and manage them here
		</InfoBar>
	{/snippet}
</ListRoutePage>
