import type { Doc } from '$convex/_generated/dataModel';
import type { ViewerIdentity } from '$domain/viewer';
import { getContext, setContext } from 'svelte';

const CURRENT_WORKSPACE_CONTEXT_KEY = Symbol('current-workspace-context');

export type { ViewerIdentity } from '$domain/viewer';

export type CurrentWorkspaceContext = {
	user: Doc<'users'>;
	workspace: Doc<'workspaces'>;
	identity: ViewerIdentity;
};

export type CurrentWorkspaceStorageScope = {
	userId: Doc<'users'>['_id'];
	workspaceId: Doc<'workspaces'>['_id'];
};

export function provideCurrentWorkspaceContext(context: CurrentWorkspaceContext) {
	return setContext(CURRENT_WORKSPACE_CONTEXT_KEY, context);
}

export function useCurrentWorkspaceContext() {
	const context = getContext<CurrentWorkspaceContext | undefined>(CURRENT_WORKSPACE_CONTEXT_KEY);

	if (!context) {
		throw new Error('Current workspace context was used outside the authenticated app shell.');
	}

	return context;
}

export function getCurrentWorkspaceStorageScope({
	user,
	workspace
}: CurrentWorkspaceContext): CurrentWorkspaceStorageScope {
	return {
		userId: user._id,
		workspaceId: workspace._id
	};
}
