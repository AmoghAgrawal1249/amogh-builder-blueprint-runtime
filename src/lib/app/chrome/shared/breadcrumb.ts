import type { APP_LINKS } from '$lib/app/app-links';

export type BreadcrumbParentHref =
	| typeof APP_LINKS.createFormats.pathname
	| typeof APP_LINKS.emailFormats.pathname;

export type BreadcrumbParent = {
	label: string;
	href: BreadcrumbParentHref;
};
