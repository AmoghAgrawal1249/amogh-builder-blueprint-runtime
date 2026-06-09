import { DESKTOP_ONLY_VIEWPORT_REQUIREMENT } from '$lib/features/format-starters/format-starter-route-data';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => {
	return {
		viewportRequirement: DESKTOP_ONLY_VIEWPORT_REQUIREMENT
	};
};
