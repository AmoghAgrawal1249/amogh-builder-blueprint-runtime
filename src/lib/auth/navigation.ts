import {
	AUTH_LINKS,
	DEFAULT_APP_LINK,
	isCanonicalAppHref,
	type AppHref,
	type AuthEntryHref,
	type AuthEntryPathname
} from '$lib/app/app-links';

export type { AuthEntryPathname };

const DEFAULT_AUTH_EXIT_HREF = 'https://overbase.app/';
const TRUSTED_MARKETING_ORIGINS = new Set(['https://overbase.app', 'https://www.overbase.app']);

export const AUTH_RETURN_TO_PARAM = 'returnTo';
export const AUTH_ENTRY_RETURN_PARAM = 'fromAuth';

type ResolveAuthExitHrefOptions = {
	useDefaultWhenMissing?: boolean;
};

function isSafeRelativeReturnHref(value: string) {
	return value.startsWith('/') && !value.startsWith('//');
}

export function isAuthEntryPathname(pathname: string): pathname is AuthEntryPathname {
	return pathname === AUTH_LINKS.login.pathname || pathname === AUTH_LINKS.join.pathname;
}

function isSafeInAppReturnHref(value: string): value is AppHref {
	if (!isSafeRelativeReturnHref(value)) {
		return false;
	}

	return isCanonicalAppHref(value);
}

function getCurrentInAppHref(url: URL): AppHref | undefined {
	const href = `${url.pathname}${url.search}${url.hash}`;
	return isSafeInAppReturnHref(href) ? href : undefined;
}

export function resolveAuthReturnTo(url: URL): AppHref | undefined {
	const returnTo = url.searchParams.get(AUTH_RETURN_TO_PARAM)?.trim();

	if (returnTo && isSafeInAppReturnHref(returnTo)) {
		return returnTo;
	}

	return getCurrentInAppHref(url);
}

export function resolvePostAuthHref(url: URL) {
	return resolveAuthReturnTo(url) ?? DEFAULT_APP_LINK.pathname;
}

export function resolveAuthExitHref(
	url: URL,
	{ useDefaultWhenMissing = true }: ResolveAuthExitHrefOptions = {}
) {
	const returnTo = url.searchParams.get(AUTH_RETURN_TO_PARAM)?.trim();

	if (!returnTo) {
		return useDefaultWhenMissing ? DEFAULT_AUTH_EXIT_HREF : undefined;
	}

	if (isSafeInAppReturnHref(returnTo)) {
		return returnTo;
	}

	if (isSafeRelativeReturnHref(returnTo)) {
		return DEFAULT_AUTH_EXIT_HREF;
	}

	try {
		const parsedReturnTo = new URL(returnTo);
		return TRUSTED_MARKETING_ORIGINS.has(parsedReturnTo.origin)
			? parsedReturnTo.href
			: DEFAULT_AUTH_EXIT_HREF;
	} catch {
		return DEFAULT_AUTH_EXIT_HREF;
	}
}

export function resolveAuthEntryReturnHref(url: URL) {
	const fromAuth = url.searchParams.get(AUTH_ENTRY_RETURN_PARAM)?.trim();
	const fromAuthPathname = fromAuth ?? '';

	if (isAuthEntryPathname(fromAuthPathname)) {
		return buildAuthEntryHref(fromAuthPathname, {
			returnTo: resolveAuthReturnTo(url)
		});
	}

	return undefined;
}

export function buildAuthEntryHref(
	pathname: AuthEntryPathname,
	{
		returnTo,
		fromAuth
	}: {
		returnTo?: AppHref;
		fromAuth?: AuthEntryPathname;
	} = {}
) {
	const params = new URLSearchParams();

	if (returnTo && isSafeInAppReturnHref(returnTo)) {
		params.set(AUTH_RETURN_TO_PARAM, returnTo);
	}

	if (fromAuth) {
		params.set(AUTH_ENTRY_RETURN_PARAM, fromAuth);
	}

	const query = params.toString();
	return (query ? `${pathname}?${query}` : pathname) as AuthEntryHref;
}
