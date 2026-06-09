<script lang="ts">
	import { page } from '$app/state';
	import { APP_ROUTE_REGISTRY } from '$lib/app/app-routes';
	import { useRouteTitleState } from '$lib/app/chrome/shared/route-title.svelte';
	import { useCurrentWorkspaceContext } from '$lib/app/current-workspace.svelte';
	import type { FormatStarterGalleryEntry } from '$lib/features/format-starters/catalog';
	import FormatStarterCard from '$lib/features/format-starters/FormatStarterCard.svelte';
	import FormatStarterCategorySelect from '$lib/features/format-starters/gallery/FormatStarterCategorySelect.svelte';
	import {
		getCreateFormatGalleryCategoryFromSearchParams,
		matchesCreateFormatGalleryCategory
	} from '$lib/features/format-starters/gallery/create-format-gallery-categories';
	import { EmptyListState, ListContentState } from '$lib/layout/list';
	import { InfoBar } from '$lib/ui';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const routeTitleState = useRouteTitleState();
	const currentWorkspace = useCurrentWorkspaceContext();
	const selectedCategory = $derived(
		getCreateFormatGalleryCategoryFromSearchParams(
			page.url.searchParams,
			currentWorkspace.workspace.industry
		)
	);
	const filteredFormatStarters = $derived(
		data.formatStarters.filter(matchesFormatStarterFilters)
	);
	const totalRecords = $derived(data.formatStarters.length);
	const visibleRecords = $derived(filteredFormatStarters.length);

	$effect(() => {
		routeTitleState.actions = headerCategorySelect;

		return () => {
			if (routeTitleState.actions === headerCategorySelect) {
				routeTitleState.actions = null;
			}
		};
	});

	function matchesFormatStarterFilters(formatStarter: FormatStarterGalleryEntry) {
		return matchesCreateFormatGalleryCategory(formatStarter, selectedCategory);
	}
</script>

{#snippet headerCategorySelect()}
	<FormatStarterCategorySelect {selectedCategory} />
{/snippet}

<section class="flex h-full min-h-full w-full px-4 py-6 md:px-8 md:py-8">
	<div class="min-h-0 min-w-0 flex-1">
		<div class="mx-auto flex min-h-full w-full max-w-270 flex-col gap-3 pb-12">
			<section
				class="min-h-0 overflow-hidden rounded-sm border-0 bg-transparent"
				aria-label="List results"
			>
				{#if totalRecords === 0}
					<ListContentState kind="empty" message="No formats available." class="rounded-sm border" />
				{:else if visibleRecords === 0}
					<EmptyListState
						icon={APP_ROUTE_REGISTRY['create-formats'].icon}
						title="No matching formats"
						description="Try a different category."
						class="rounded-sm border border-stone-200/70 bg-white"
					/>
				{:else}
					<div class="format-starter-gallery grid grid-cols-1 gap-x-2.5 gap-y-2 sm:grid-cols-2 xl:grid-cols-3">
						{#each filteredFormatStarters as formatStarter (formatStarter.slug)}
							<FormatStarterCard {formatStarter} />
						{/each}
					</div>
				{/if}
			</section>

			{#if totalRecords > 0}
				<InfoBar label={selectedCategory.infoBar.label}>
					{selectedCategory.infoBar.text}
				</InfoBar>
			{/if}
		</div>
	</div>
</section>

<style>
	:global(.format-starter-gallery .format-starter-card) {
		padding-block: calc(0.375rem + 1px);
	}

	:global(.format-starter-gallery .format-starter-preview-card) {
		aspect-ratio: 2.2;
	}
</style>
