<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { useCurrentWorkspaceContext } from '$lib/app/current-workspace.svelte';
	import { SelectMenu } from '$lib/ui';
	import {
		CREATE_FORMAT_GALLERY_CATEGORIES,
		createFormatGalleryCategoryHref,
		getCreateFormatGalleryDropdownCategories,
		type CreateFormatGalleryCategory,
		type CreateFormatGalleryCategoryId
	} from './create-format-gallery-categories';

	type Props = {
		selectedCategory: CreateFormatGalleryCategory;
	};

	let { selectedCategory }: Props = $props();

	const currentWorkspace = useCurrentWorkspaceContext();
	const dropdownCategories = $derived(
		getCreateFormatGalleryDropdownCategories(currentWorkspace.workspace.industry)
	);

	function setSelectedCategory(categoryId: CreateFormatGalleryCategoryId) {
		const category = CREATE_FORMAT_GALLERY_CATEGORIES.find((option) => option.id === categoryId);

		if (!category) {
			return;
		}

		const href = createFormatGalleryCategoryHref(category);

		if (category.id === selectedCategory.id) {
			return;
		}

		void goto(resolve(href), {
			keepFocus: true,
			noScroll: true
		});
	}
</script>

<SelectMenu
	id="format-category"
	ariaLabel="Select format category"
	selectedId={selectedCategory.id}
	options={dropdownCategories}
	onSelect={setSelectedCategory}
	width="md"
/>
