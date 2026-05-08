import { env } from '$env/dynamic/public';
import { api } from '$convex/_generated/api';
import { error } from '@sveltejs/kit';
import { ConvexHttpClient } from 'convex/browser';
import type { PageLoad } from './$types';

const APP_SLUG = 'bring-the-firm';

export const load: PageLoad = async () => {
	const convexUrl = env.PUBLIC_CONVEX_URL;

	if (!convexUrl) {
		error(503, 'PUBLIC_CONVEX_URL is required to load Bring the Firm.');
	}

	const convex = new ConvexHttpClient(convexUrl);
	const appResult = await convex.query(api.builder.getActiveBuilderAppBySlug, {
		slug: APP_SLUG
	});
	const app = appResult?.app ?? null;

	if (!app) {
		error(404, 'Bring the Firm is unavailable.');
	}

	return {
		app,
		guide: appResult?.guide ?? null
	};
};
