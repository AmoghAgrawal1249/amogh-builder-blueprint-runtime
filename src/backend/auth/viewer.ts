import type { ViewerIdentity } from '../../domain/viewer';
import type { Doc, Id } from '../../convex/_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../../convex/_generated/server';
import { isSupportedCompanyIndustry } from '../../domain/company-industries';

export type { ViewerIdentity } from '../../domain/viewer';

export type ViewerWorkspace = {
	user: Doc<'users'>;
	workspace: Doc<'workspaces'>;
	identity: ViewerIdentity;
};

export type ViewerAccountState =
	| { kind: 'signedOut' }
	| { kind: 'deleted' }
	| { kind: 'needsOnboarding'; identity: ViewerIdentity }
	| {
			kind: 'onboardingIncomplete';
			user: Doc<'users'>;
			workspace: Doc<'workspaces'>;
			identity: ViewerIdentity;
	  }
	| {
			kind: 'ready';
			user: Doc<'users'>;
			workspace: Doc<'workspaces'>;
			identity: ViewerIdentity;
	  };

type ClerkIdentity = NonNullable<Awaited<ReturnType<QueryCtx['auth']['getUserIdentity']>>>;

type SignedInClerkViewer = {
	clerkUserId: string;
	identity: ViewerIdentity;
	initialDisplayName?: string;
};

function getSignedInClerkViewer(identity: ClerkIdentity): SignedInClerkViewer {
	const clerkUserId = identity.subject?.trim();
	const email = identity.email?.trim();
	const initialDisplayName = identity.name?.trim() || undefined;

	if (!clerkUserId) {
		throw new Error('Authentication required.');
	}

	if (!email) {
		throw new Error("Clerk Convex JWT template must include the user's email address.");
	}

	return {
		clerkUserId,
		identity: { email },
		...(initialDisplayName ? { initialDisplayName } : {})
	};
}

async function requireSignedInClerkViewer(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();

	if (!identity) {
		throw new Error('Authentication required.');
	}

	return getSignedInClerkViewer(identity);
}

async function getCurrentSignedInClerkViewer(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();

	if (!identity) {
		return null;
	}

	return getSignedInClerkViewer(identity);
}

async function getUserForClerkUserId(ctx: QueryCtx | MutationCtx, clerkUserId: string) {
	return await ctx.db
		.query('users')
		.withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
		.first();
}

async function getDeletedClerkUser(ctx: QueryCtx | MutationCtx, clerkUserId: string) {
	return await ctx.db
		.query('deletedClerkUsers')
		.withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
		.first();
}

async function ensureClerkUserWasNotDeleted(ctx: QueryCtx | MutationCtx, clerkUserId: string) {
	if (await getDeletedClerkUser(ctx, clerkUserId)) {
		throw new Error('This account has been deleted.');
	}
}

export async function getWorkspaceForUser(ctx: QueryCtx | MutationCtx, user: Doc<'users'>) {
	if (!user.workspaceId) {
		return null;
	}

	const workspace = await ctx.db.get(user.workspaceId);

	if (!workspace || workspace.ownerUserId !== user._id) {
		return null;
	}

	return workspace;
}

async function createWorkspaceForUser(ctx: MutationCtx, user: Doc<'users'>, now: number) {
	const workspaceId = await ctx.db.insert('workspaces', {
		name: '',
		industry: '',
		ownerUserId: user._id,
		createdAt: now,
		updatedAt: now
	});

	await ctx.db.patch(user._id, {
		workspaceId,
		updatedAt: now
	});

	const [updatedUser, workspace] = await Promise.all([
		ctx.db.get(user._id),
		ctx.db.get(workspaceId)
	]);

	if (!updatedUser || !workspace) {
		throw new Error('Unable to initialize workspace.');
	}

	return { user: updatedUser, workspace };
}

function hasCompletedWorkspaceProfile(workspace: Doc<'workspaces'>) {
	return Boolean(workspace.name.trim()) && isSupportedCompanyIndustry(workspace.industry.trim());
}

async function requireInitializedViewerWorkspace(
	ctx: QueryCtx | MutationCtx
): Promise<ViewerWorkspace> {
	const viewer = await requireSignedInClerkViewer(ctx);
	await ensureClerkUserWasNotDeleted(ctx, viewer.clerkUserId);
	const user = await getUserForClerkUserId(ctx, viewer.clerkUserId);

	if (!user) {
		throw new Error('User has not been initialized.');
	}

	const workspace = await getWorkspaceForUser(ctx, user);

	if (!workspace) {
		throw new Error('Workspace required.');
	}

	return { user, workspace, identity: viewer.identity };
}

export async function requireViewerWorkspace(ctx: QueryCtx | MutationCtx): Promise<ViewerWorkspace> {
	const viewerWorkspace = await requireInitializedViewerWorkspace(ctx);

	if (
		!viewerWorkspace.workspace.onboardingCompletedAt ||
		!hasCompletedWorkspaceProfile(viewerWorkspace.workspace)
	) {
		throw new Error('Onboarding required.');
	}

	return viewerWorkspace;
}

export async function requireWorkspaceRecord<T extends { workspaceId: Id<'workspaces'> }>(
	ctx: QueryCtx | MutationCtx,
	record: T | null
) {
	const { workspace } = await requireViewerWorkspace(ctx);

	if (!record || record.workspaceId !== workspace._id) {
		return null;
	}

	return record;
}

export function getViewerWorkspaceRecord<T extends { workspaceId: Id<'workspaces'> }>(
	{ workspace }: ViewerWorkspace,
	record: T | null
) {
	if (!record || record.workspaceId !== workspace._id) {
		return null;
	}

	return record;
}

async function ensureOnboardingWorkspaceRecord(ctx: MutationCtx): Promise<ViewerWorkspace> {
	const viewer = await requireSignedInClerkViewer(ctx);
	await ensureClerkUserWasNotDeleted(ctx, viewer.clerkUserId);
	const now = Date.now();
	let user = await ctx.db
		.query('users')
		.withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', viewer.clerkUserId))
		.first();

	if (!user) {
		const userId = await ctx.db.insert('users', {
			clerkUserId: viewer.clerkUserId,
			...(viewer.initialDisplayName ? { displayName: viewer.initialDisplayName } : {}),
			createdAt: now,
			updatedAt: now
		});
		user = await ctx.db.get(userId);
	}

	if (!user) {
		throw new Error('Unable to initialize user.');
	}

	const workspace = await getWorkspaceForUser(ctx, user);

	return workspace
		? { user, workspace, identity: viewer.identity }
		: { ...(await createWorkspaceForUser(ctx, user, now)), identity: viewer.identity };
}

export async function saveOnboardingCompanyProfile(
	ctx: MutationCtx,
	{
		companyName,
		companyIndustry
	}: {
		companyName: string;
		companyIndustry: string;
	}
): Promise<ViewerWorkspace> {
	const name = companyName.trim();
	const industry = companyIndustry.trim();

	if (!name || !isSupportedCompanyIndustry(industry)) {
		throw new Error('Company name and supported industry are required.');
	}

	const viewerWorkspace = await ensureOnboardingWorkspaceRecord(ctx);
	const { workspace } = viewerWorkspace;

	await ctx.db.patch(workspace._id, {
		name,
		industry,
		updatedAt: Date.now()
	});

	const updatedWorkspace = await ctx.db.get(workspace._id);

	if (!updatedWorkspace) {
		throw new Error('Unable to save company profile.');
	}

	return { ...viewerWorkspace, workspace: updatedWorkspace };
}

export async function getViewerAccountState(ctx: QueryCtx | MutationCtx): Promise<ViewerAccountState> {
	const viewer = await getCurrentSignedInClerkViewer(ctx);

	if (!viewer) {
		return { kind: 'signedOut' };
	}

	if (await getDeletedClerkUser(ctx, viewer.clerkUserId)) {
		return { kind: 'deleted' };
	}

	const user = await getUserForClerkUserId(ctx, viewer.clerkUserId);

	if (!user) {
		return { kind: 'needsOnboarding', identity: viewer.identity };
	}

	const workspace = await getWorkspaceForUser(ctx, user);

	if (!workspace) {
		return { kind: 'needsOnboarding', identity: viewer.identity };
	}

	if (!workspace.onboardingCompletedAt || !hasCompletedWorkspaceProfile(workspace)) {
		return { kind: 'onboardingIncomplete', user, workspace, identity: viewer.identity };
	}

	return { kind: 'ready', user, workspace, identity: viewer.identity };
}

export async function markWorkspaceOnboardingComplete(ctx: MutationCtx) {
	const { workspace } = await requireInitializedViewerWorkspace(ctx);
	const now = Date.now();

	if (!hasCompletedWorkspaceProfile(workspace)) {
		throw new Error('Company profile is required before onboarding can be completed.');
	}

	if (!workspace.onboardingCompletedAt) {
		await ctx.db.patch(workspace._id, {
			onboardingCompletedAt: now,
			updatedAt: now
		});
	}

	return { onboardingCompletedAt: workspace.onboardingCompletedAt ?? now };
}
