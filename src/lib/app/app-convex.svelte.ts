import { validatePublicAuthEnv, type PublicAuthEnv } from '$lib/auth/auth-env';
import { setupConvex } from 'convex-svelte';

export function setupAppConvex(authEnv: PublicAuthEnv = validatePublicAuthEnv()) {
	if (!authEnv.convexUrl) {
		throw new Error('PUBLIC_CONVEX_URL is required before Convex can initialize.');
	}

	setupConvex(authEnv.convexUrl);
}
