import { getContext, setContext } from 'svelte';
import type { Snippet } from 'svelte';
import type { FloatingActionMenuAction } from '$lib/ui';

const ROUTE_TITLE_STATE_KEY = Symbol('route-title-state');

export type RouteTitleState = {
	title: string;
	editable: boolean | null;
	onTitleChange: ((title: string) => void | Promise<void>) | null;
	actions: Snippet | null;
	overflowActions: FloatingActionMenuAction[];
};

export function provideRouteTitleState(routeTitleState: RouteTitleState) {
	return setContext(ROUTE_TITLE_STATE_KEY, routeTitleState);
}

export function useRouteTitleState() {
	const routeTitleState = getContext<RouteTitleState | undefined>(ROUTE_TITLE_STATE_KEY);

	if (!routeTitleState) {
		throw new Error('Route title state was used outside the dashboard shell provider.');
	}

	return routeTitleState;
}
