import { env } from '$env/dynamic/public';
import { setupConvex } from 'convex-svelte';

const CONVEX_URL_ENV_VAR = 'PUBLIC_CONVEX_URL';

export function setupAppConvex() {
	const convexUrl = env.PUBLIC_CONVEX_URL;

	if (!convexUrl) {
		throw new Error(
			`${CONVEX_URL_ENV_VAR} is required. Run npx convex dev to configure Convex before starting the app.`
		);
	}

	setupConvex(convexUrl);
}
