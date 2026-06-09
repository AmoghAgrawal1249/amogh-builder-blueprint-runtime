import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';

const CLERK_PUBLISHABLE_KEY_ENV_VAR = 'PUBLIC_CLERK_PUBLISHABLE_KEY';
const CONVEX_URL_ENV_VAR = 'PUBLIC_CONVEX_URL';

export type PublicAuthEnv = {
	clerkPublishableKey: string;
	convexUrl: string;
};

function requirePublicEnv(name: string, value: string | undefined) {
	const normalizedValue = value?.trim();

	if (!normalizedValue) {
		throw new Error(`${name} is required before auth can initialize.`);
	}

	return normalizedValue;
}

function isLocalHostname(hostname: string) {
	return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local');
}

function isOverbaseProductionHostname(hostname: string) {
	return hostname === 'overbase.app' || hostname.endsWith('.overbase.app');
}

function isProductionBrowserEnvironment() {
	return (
		browser &&
		!isLocalHostname(window.location.hostname) &&
		(env.PUBLIC_APP_ENV === 'production' || isOverbaseProductionHostname(window.location.hostname))
	);
}

function validateClerkPublishableKey(publishableKey: string) {
	if (!/^pk_(test|live)_/.test(publishableKey)) {
		throw new Error(`${CLERK_PUBLISHABLE_KEY_ENV_VAR} must be a Clerk publishable key.`);
	}

	if (isProductionBrowserEnvironment() && !publishableKey.startsWith('pk_live_')) {
		throw new Error(
			`${CLERK_PUBLISHABLE_KEY_ENV_VAR} must use a live Clerk key outside local development.`
		);
	}
}

function validateConvexUrl(convexUrl: string) {
	let parsedUrl: URL;

	try {
		parsedUrl = new URL(convexUrl);
	} catch {
		throw new Error(`${CONVEX_URL_ENV_VAR} must be a valid URL.`);
	}

	if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
		throw new Error(`${CONVEX_URL_ENV_VAR} must start with http:// or https://.`);
	}

	if (parsedUrl.hostname.endsWith('.convex.site')) {
		throw new Error(`${CONVEX_URL_ENV_VAR} must point at the Convex deployment URL, not the site URL.`);
	}
}

export function validatePublicAuthEnv(): PublicAuthEnv {
	const clerkPublishableKey = requirePublicEnv(
		CLERK_PUBLISHABLE_KEY_ENV_VAR,
		env.PUBLIC_CLERK_PUBLISHABLE_KEY
	);
	const convexUrl = requirePublicEnv(CONVEX_URL_ENV_VAR, env.PUBLIC_CONVEX_URL);

	validateClerkPublishableKey(clerkPublishableKey);
	validateConvexUrl(convexUrl);

	return { clerkPublishableKey, convexUrl };
}
