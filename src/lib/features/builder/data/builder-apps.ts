import {
	BriefcaseBusiness,
	Factory,
	Flag,
	LoaderCircle,
	Scale,
	ShieldCheck
} from 'lucide-svelte';
import { CUSTOM_EMAIL_BUILDER_APP_ID } from '../../../../builder-apps/ids';
import type { Artwork } from '@overbase/builder-sdk/catalog';
import type { BuilderAppCategory } from '../../../../builder-apps/categories';
import { toBuilderArtworkPreset, type BuilderArtworkPreset } from './builder-artwork';

type CategoryIcon = typeof Flag;
type BuilderAppView = {
	slug: string;
	categoryIds: string[];
	title: string;
	description: string;
	mode: 'custom' | 'guided';
	artwork: Artwork;
};

export const CUSTOM_NOTIFICATION_APP_ID = CUSTOM_EMAIL_BUILDER_APP_ID;

export type BuilderAppCategoryId = string;
export type BuilderAppFilterId = BuilderAppCategoryId | 'all';

export type BuilderAppFilter = {
	id: BuilderAppFilterId;
	label: string;
	iconId: string;
	icon: CategoryIcon;
	sortOrder: number;
};

export type BuilderAppRecord = {
	id: string;
	categoryIds: string[];
	title: string;
	description: string;
	mode: 'custom' | 'guided';
	artwork: BuilderArtworkPreset;
};

const CATEGORY_ICONS: Record<string, CategoryIcon> = {
	'briefcase-business': BriefcaseBusiness,
	factory: Factory,
	flag: Flag,
	scale: Scale,
	'shield-check': ShieldCheck
};

export const ALL_BUILDER_APP_FILTER = {
	id: 'all',
	label: 'All',
	iconId: 'loader-circle',
	icon: LoaderCircle,
	sortOrder: -1
} satisfies BuilderAppFilter;

function getCategoryIcon(iconId: string) {
	return CATEGORY_ICONS[iconId] ?? Flag;
}

export function toBuilderAppFilter(category: BuilderAppCategory): BuilderAppFilter {
	return {
		id: category.slug,
		label: category.label,
		iconId: category.iconId,
		icon: getCategoryIcon(category.iconId),
		sortOrder: category.sortOrder
	};
}

export function toBuilderAppRecord(app: BuilderAppView): BuilderAppRecord {
	return {
		id: app.slug,
		categoryIds: app.categoryIds,
		title: app.title,
		description: app.description,
		mode: app.mode,
		artwork: toBuilderArtworkPreset(app.artwork)
	};
}
