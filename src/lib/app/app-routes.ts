import ArticleIcon from 'phosphor-svelte/lib/ArticleIcon';
import BuildingIcon from 'phosphor-svelte/lib/BuildingIcon';
import FolderSimpleIcon from 'phosphor-svelte/lib/FolderSimpleIcon';
import FoldersIcon from 'phosphor-svelte/lib/FoldersIcon';
import HardDriveIcon from 'phosphor-svelte/lib/HardDriveIcon';
import KeyIcon from 'phosphor-svelte/lib/KeyIcon';
import ListPlusIcon from 'phosphor-svelte/lib/ListPlusIcon';
import UsersIcon from 'phosphor-svelte/lib/UsersIcon';
import type { PhosphorIcon, PhosphorIconProps } from '$lib/ui/icons';
import { APP_LINKS, type StaticAppLink } from '$lib/app/app-links';

export type RouteIconProps = PhosphorIconProps;
export type RouteIcon = PhosphorIcon;

export const APP_ROUTE_IDS = [
	'create-formats',
	'email-formats',
	'internal-data',
	'team',
	'team-email-formats',
	'invite-partners',
	'manage-partners',
	'data-access'
] as const;

export type NavRouteId = (typeof APP_ROUTE_IDS)[number];
export type NavPath = `/${NavRouteId}`;
export type NavSectionId = 'email-formats' | 'main' | 'ecosystem';

type NavSectionDefinition = {
	id: NavSectionId;
	heading: string;
	routeIds: readonly NavRouteId[];
	desktopSectionClass?: string;
	mobileSectionClass?: string;
	showCollapsedDivider?: boolean;
};

export type AppRouteDefinition = StaticAppLink & {
	pathname: NavPath;
	navLabel: string;
	headerLabel?: string;
	icon: RouteIcon;
	hideOnMobile?: boolean;
};

export const APP_ROUTE_REGISTRY = {
	'email-formats': {
		...APP_LINKS.emailFormats,
		navLabel: 'My formats',
		headerLabel: 'My email formats',
		icon: FolderSimpleIcon
	},
	'create-formats': {
		...APP_LINKS.createFormats,
		navLabel: 'Create formats',
		headerLabel: 'Create email formats',
		icon: ArticleIcon
	},
	'internal-data': {
		...APP_LINKS.internalData,
		navLabel: 'Internal data',
		headerLabel: 'Internal data sources',
		icon: HardDriveIcon
	},
	team: {
		...APP_LINKS.team,
		navLabel: 'My team',
		icon: UsersIcon
	},
	'team-email-formats': {
		...APP_LINKS.teamEmailFormats,
		navLabel: 'Team formats',
		icon: FoldersIcon
	},
	'invite-partners': {
		...APP_LINKS.invitePartners,
		navLabel: 'Invite partners',
		icon: ListPlusIcon
	},
	'manage-partners': {
		...APP_LINKS.managePartners,
		navLabel: 'Manage partners',
		icon: BuildingIcon
	},
	'data-access': {
		...APP_LINKS.dataAccess,
		navLabel: 'Data access',
		icon: KeyIcon
	}
} as const satisfies Record<NavRouteId, AppRouteDefinition>;

export const APP_NAV_SECTION_DEFINITIONS = [
	{
		id: 'email-formats',
		heading: 'Email formats',
		routeIds: ['create-formats', 'email-formats'],
		desktopSectionClass: 'pt-2'
	},
	{
		id: 'main',
		heading: 'Workspace',
		routeIds: ['internal-data', 'team', 'team-email-formats'],
		desktopSectionClass: 'pt-6',
		mobileSectionClass: 'pt-6',
		showCollapsedDivider: true
	},
	{
		id: 'ecosystem',
		heading: 'Ecosystem',
		routeIds: ['invite-partners', 'manage-partners', 'data-access'],
		desktopSectionClass: 'pt-6',
		mobileSectionClass: 'pt-6',
		showCollapsedDivider: true
	}
] as const satisfies readonly NavSectionDefinition[];
