import QuestionIcon from 'phosphor-svelte/lib/QuestionIcon';
import {
	APP_NAV_SECTION_DEFINITIONS,
	APP_ROUTE_REGISTRY,
	type AppRouteDefinition,
	type NavPath,
	type NavRouteId,
	type NavSectionId
} from '$lib/app/app-routes';

type NavIcon = AppRouteDefinition['icon'];

export type NavRouteItem = {
	kind: 'route';
	id: NavRouteId;
	label: string;
	headerLabel: string;
	pathname: NavPath;
	icon: NavIcon;
	hideOnMobile: boolean;
};

export type NavDisabledItem = {
	id: string;
	kind: 'disabled';
	label: string;
	icon: NavIcon;
};

export type NavExternalLinkItem = {
	id: string;
	kind: 'external-link';
	label: string;
	href: string;
	icon: NavIcon;
};

export type NavFooterItem = NavDisabledItem | NavExternalLinkItem;

export type NavSection = {
	id: NavSectionId;
	heading: string;
	desktopSectionClass?: string;
	mobileSectionClass?: string;
	showCollapsedDivider?: boolean;
	items: readonly NavRouteItem[];
};

export const NAV_ROUTE_ITEMS: readonly NavRouteItem[] = (
	Object.entries(APP_ROUTE_REGISTRY) as [NavRouteId, AppRouteDefinition][]
).map(([id, route]) => ({
	kind: 'route' as const,
	id,
	label: route.navLabel,
	headerLabel: route.headerLabel ?? route.navLabel,
	pathname: route.pathname as NavPath,
	icon: route.icon,
	hideOnMobile: Boolean(route.hideOnMobile)
}));

const NAV_ROUTE_ITEM_REGISTRY = Object.fromEntries(
	NAV_ROUTE_ITEMS.map((item) => [item.id, item])
) as Record<NavRouteId, NavRouteItem>;

export const NAV_SECTIONS: readonly NavSection[] = [
	...APP_NAV_SECTION_DEFINITIONS.map(({ routeIds, ...section }) => ({
		...section,
		items: routeIds.map((routeId) => NAV_ROUTE_ITEM_REGISTRY[routeId])
	}))
] as const;

export const MOBILE_NAV_SECTIONS: readonly NavSection[] = NAV_SECTIONS.map((section) => ({
	...section,
	items: section.items.filter((item) => !item.hideOnMobile)
})).filter((section) => section.items.length > 0);

export const NAV_FOOTER_ITEMS: readonly NavFooterItem[] = [
	{
		id: 'contact-support',
		kind: 'external-link',
		label: 'Contact support',
		href: 'https://cal.com/juliennewman',
		icon: QuestionIcon
	}
] as const;

export type { NavRouteId, NavSectionId };

export function isNavItemActive(routePathname: string, currentPathname: string) {
	return currentPathname === routePathname || currentPathname.startsWith(`${routePathname}/`);
}

export function getActiveNavRoute(pathname: string) {
	return NAV_ROUTE_ITEMS.find((item) => isNavItemActive(item.pathname, pathname)) ?? null;
}
