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
		icon: APP_ROUTE_REGISTRY['data-access'].icon,
		title: 'No partners found',
		description: 'Control what data you share with each partner.',
		nextSteps: [
			{ kind: 'link', text: 'Invite', href: APP_LINKS.invitePartners.pathname },
			{
				kind: 'text',
				text: ' your ecosystem partners then control what data they can access in a granular and secure way'
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
