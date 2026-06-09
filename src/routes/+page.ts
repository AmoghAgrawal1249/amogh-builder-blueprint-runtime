import { redirect } from '@sveltejs/kit';
import { DEFAULT_APP_LINK } from '$lib/app/app-links';

export function load() {
	throw redirect(307, DEFAULT_APP_LINK.pathname);
}
