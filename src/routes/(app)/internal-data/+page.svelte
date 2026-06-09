<script lang="ts">
	import { APP_ROUTE_REGISTRY } from '$lib/app/app-routes';
	import { ListRoutePage } from '$lib/layout/list';
	import AddInternalDataModal from '$lib/features/internal-data/AddInternalDataModal.svelte';

	let modalOpen = $state(false);
	let searchQuery = $state('');
</script>

<ListRoutePage
	toolbar={{
		searchPlaceholder: 'Search internal data sources...',
		searchAriaLabel: 'Search internal data sources',
		searchValue: searchQuery,
		onSearchValueChange: (value) => (searchQuery = value),
		actionLabel: 'Add internal data',
		onAction: () => (modalOpen = true)
	}}
	empty={{
		icon: APP_ROUTE_REGISTRY['internal-data'].icon,
		title: 'No internal data found',
		description: 'Connect internal data sources to power your opportunities.',
		nextSteps:
			'Overbase can analyze any of your internal data sources. Add the internal data sources you want us to use to send you actionable opportunities or that you want to share with your ecosystem partners',
		actionLabel: 'Add internal data',
		onAction: () => (modalOpen = true)
	}}
	noResults={{
		title: 'No matching internal data sources',
		description: 'Try a different search term or data type'
	}}
	status="ready"
	totalRecords={0}
	visibleRecords={0}
	isQueryActive={Boolean(searchQuery.trim())}
/>

<AddInternalDataModal open={modalOpen} onClose={() => (modalOpen = false)} />
