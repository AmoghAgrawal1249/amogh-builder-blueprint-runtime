import { resolve } from '$app/paths';

export type StaticAppLink = {
	pathname: `/${string}`;
	routeId: `/(app)${string}`;
};

export type AuthEntryLink = {
	pathname: '/login' | '/join';
	routeId: `/(auth)${string}`;
};

export type DynamicAppLink<Pathname extends `/${string}`, RouteId extends `/(app)${string}`> = {
	pathname: Pathname;
	routeId: RouteId;
	href: AppHref;
};

export const APP_LINKS = {
	createFormats: {
		pathname: '/create-formats',
		routeId: '/(app)/create-formats'
	},
	emailFormats: {
		pathname: '/email-formats',
		routeId: '/(app)/email-formats'
	},
	internalData: {
		pathname: '/internal-data',
		routeId: '/(app)/internal-data'
	},
	team: {
		pathname: '/team',
		routeId: '/(app)/team'
	},
	teamEmailFormats: {
		pathname: '/team-email-formats',
		routeId: '/(app)/team-email-formats'
	},
	invitePartners: {
		pathname: '/invite-partners',
		routeId: '/(app)/invite-partners'
	},
	managePartners: {
		pathname: '/manage-partners',
		routeId: '/(app)/manage-partners'
	},
	dataAccess: {
		pathname: '/data-access',
		routeId: '/(app)/data-access'
	},
	settings: {
		pathname: '/settings',
		routeId: '/(app)/settings'
	}
} as const satisfies Record<string, StaticAppLink>;

export const AUTH_LINKS = {
	login: {
		pathname: '/login',
		routeId: '/(auth)/login'
	},
	join: {
		pathname: '/join',
		routeId: '/(auth)/join'
	}
} as const satisfies Record<string, AuthEntryLink>;

export const APP_DYNAMIC_ROUTE_IDS = {
	createFormat: '/(app)/create-formats/[formatStarterSlug]',
	emailFormat: '/(app)/email-formats/[emailFormatId]'
} as const;

export const DEFAULT_APP_LINK = APP_LINKS.createFormats;

export type AppLinkKey = keyof typeof APP_LINKS;
export type AuthLinkKey = keyof typeof AUTH_LINKS;
export type StaticAppPathname = (typeof APP_LINKS)[AppLinkKey]['pathname'];
export type AuthEntryPathname = (typeof AUTH_LINKS)[AuthLinkKey]['pathname'];
export type CreateFormatsPathname = `/create-formats/${string}`;
export type EmailFormatPathname = `/email-formats/${string}`;
export type AppPathname = StaticAppPathname | CreateFormatsPathname | EmailFormatPathname;
export type AppHref = AppPathname;
export type AuthEntryHref = AuthEntryPathname | `${AuthEntryPathname}?${string}`;
export type CreateFormatsGalleryHref =
	| typeof APP_LINKS.createFormats.pathname
	| `${typeof APP_LINKS.createFormats.pathname}?${string}`;
export type CreateFormatsViewportFallbackPathname =
	| typeof APP_LINKS.emailFormats.pathname
	| typeof APP_LINKS.createFormats.pathname;

const STATIC_APP_PATHNAMES = new Set<string>(Object.values(APP_LINKS).map((link) => link.pathname));
const resolveHref = resolve as (href: string) => string;

function encodePathSegment(value: string) {
	return encodeURIComponent(value);
}

export function createFormatPathname(formatStarterSlug: string): CreateFormatsPathname {
	return `/create-formats/${encodePathSegment(formatStarterSlug)}`;
}

export function createFormatLink(
	formatStarterSlug: string
): DynamicAppLink<CreateFormatsPathname, typeof APP_DYNAMIC_ROUTE_IDS.createFormat> {
	return {
		pathname: createFormatPathname(formatStarterSlug),
		routeId: APP_DYNAMIC_ROUTE_IDS.createFormat,
		href: resolve(APP_DYNAMIC_ROUTE_IDS.createFormat, {
			formatStarterSlug
		}) as CreateFormatsPathname
	};
}

export function createFormatsGalleryHref({
	industry = 'all'
}: {
	industry?: string;
} = {}): CreateFormatsGalleryHref {
	const searchParams = new URLSearchParams();

	if (industry !== 'all') {
		searchParams.set('industry', industry);
	}

	const query = searchParams.toString();

	if (!query) {
		return APP_LINKS.createFormats.pathname;
	}

	return `${APP_LINKS.createFormats.pathname}?${query}`;
}

export function emailFormatPathname(emailFormatId: string): EmailFormatPathname {
	return `/email-formats/${encodePathSegment(emailFormatId)}`;
}

export function emailFormatLink(
	emailFormatId: string
): DynamicAppLink<EmailFormatPathname, typeof APP_DYNAMIC_ROUTE_IDS.emailFormat> {
	return {
		pathname: emailFormatPathname(emailFormatId),
		routeId: APP_DYNAMIC_ROUTE_IDS.emailFormat,
		href: resolve(APP_DYNAMIC_ROUTE_IDS.emailFormat, {
			emailFormatId
		}) as EmailFormatPathname
	};
}

export function isCanonicalAppPathname(pathname: string): pathname is AppPathname {
	return (
		STATIC_APP_PATHNAMES.has(pathname) ||
		/^\/create-formats\/[^/?#]+$/.test(pathname) ||
		/^\/email-formats\/[^/?#]+$/.test(pathname)
	);
}

export function isCanonicalAppHref(value: string): value is AppHref {
	try {
		const parsedHref = new URL(value, 'https://overbase.local');

		return (
			isCanonicalAppPathname(parsedHref.pathname) &&
			parsedHref.hash === '' &&
			parsedHref.search === ''
		);
	} catch {
		return false;
	}
}

export function isAuthEntryHref(value: string): value is AuthEntryHref {
	try {
		const parsedHref = new URL(value, 'https://overbase.local');

		return (
			parsedHref.hash === '' &&
			(parsedHref.pathname === AUTH_LINKS.login.pathname ||
				parsedHref.pathname === AUTH_LINKS.join.pathname)
		);
	} catch {
		return false;
	}
}

export function resolveAppHref(href: AppHref) {
	return resolveHref(href);
}

export function resolveAuthHref(href: AuthEntryHref) {
	return resolveHref(href);
}
