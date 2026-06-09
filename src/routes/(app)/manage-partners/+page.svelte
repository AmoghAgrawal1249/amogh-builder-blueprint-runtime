<script lang="ts">
	import { ListRoutePage } from '$lib/layout/list';
	import { APP_LINKS } from '$lib/app/app-links';
	import { APP_ROUTE_REGISTRY } from '$lib/app/app-routes';

	let searchQuery = $state('');
</script>

<ListRoutePage
	toolbar={{
		searchPlaceholder: 'Search partners...',
		searchAriaLabel: 'Search partners',
		searchValue: searchQuery,
		onSearchValueChange: (value) => (searchQuery = value)
	}}
	empty={{
		icon: APP_ROUTE_REGISTRY['manage-partners'].icon,
		title: 'No partners found',
		description: 'Manage partners connected to your ecosystem.',
		nextSteps: [
			{ kind: 'link', text: 'Invite', href: APP_LINKS.invitePartners.pathname },
			{
				kind: 'text',
				text: ' your ecosystem partners so you can share sales data with them. You will be able to use their data in your opportunities and they will be able to use your data in a secure way that you control'
			}
		]
	}}
	noResults={{
		title: 'No matching partners',
		description: 'Try a different search term or partner filter'
	}}
	status="ready"
	totalRecords={0}
	visibleRecords={0}
	isQueryActive={Boolean(searchQuery.trim())}
/>
