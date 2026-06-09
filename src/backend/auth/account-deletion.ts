import type { Doc, Id } from '../../convex/_generated/dataModel';
import type { MutationCtx } from '../../convex/_generated/server';
import { deleteUploadedAvatar } from '../profiles/avatars';

async function deleteEmailFormatRecipientRecords(ctx: MutationCtx, workspaceId: Id<'workspaces'>) {
	const recipients = await ctx.db
		.query('emailFormatRecipients')
		.withIndex('by_workspace_emailFormat', (q) => q.eq('workspaceId', workspaceId))
		.collect();

	for (const recipient of recipients) {
		await ctx.db.delete(recipient._id);
	}
}

async function deleteEmailFormatRecords(ctx: MutationCtx, workspaceId: Id<'workspaces'>) {
	const emailFormats = await ctx.db
		.query('emailFormats')
		.withIndex('by_workspace_createdAt', (q) => q.eq('workspaceId', workspaceId))
		.collect();

	for (const emailFormat of emailFormats) {
		await ctx.db.delete(emailFormat._id);
	}
}

async function deleteTeammateRecords(ctx: MutationCtx, workspaceId: Id<'workspaces'>) {
	const teammates = await ctx.db
		.query('teammates')
		.withIndex('by_workspace_createdAt', (q) => q.eq('workspaceId', workspaceId))
		.collect();

	for (const teammate of teammates) {
		await ctx.db.delete(teammate._id);
	}
}

async function deleteWorkspaceRecords(ctx: MutationCtx, workspace: Doc<'workspaces'>) {
	await deleteEmailFormatRecipientRecords(ctx, workspace._id);
	await deleteEmailFormatRecords(ctx, workspace._id);
	await deleteTeammateRecords(ctx, workspace._id);
	await deleteUploadedAvatar(ctx, workspace.avatar);
	await ctx.db.delete(workspace._id);
}

async function getOwnedWorkspaces(ctx: MutationCtx, user: Doc<'users'>) {
	const workspaces = await ctx.db
		.query('workspaces')
		.withIndex('by_ownerUserId', (q) => q.eq('ownerUserId', user._id))
		.collect();

	if (!user.workspaceId) {
		return workspaces;
	}

	const linkedWorkspace = await ctx.db.get(user.workspaceId);

	if (!linkedWorkspace || linkedWorkspace.ownerUserId !== user._id) {
		return workspaces;
	}

	return workspaces.some((workspace) => workspace._id === linkedWorkspace._id)
		? workspaces
		: [...workspaces, linkedWorkspace];
}

async function deleteAccountRecords(ctx: MutationCtx, user: Doc<'users'>) {
	const workspaces = await getOwnedWorkspaces(ctx, user);

	for (const workspace of workspaces) {
		await deleteWorkspaceRecords(ctx, workspace);
	}

	await deleteUploadedAvatar(ctx, user.avatar);
	await ctx.db.delete(user._id);
}

async function recordDeletedClerkUser(ctx: MutationCtx, clerkUserId: string) {
	const existingDeletion = await ctx.db
		.query('deletedClerkUsers')
		.withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
		.first();

	if (existingDeletion) {
		return;
	}

	await ctx.db.insert('deletedClerkUsers', {
		clerkUserId,
		deletedAt: Date.now()
	});
}

export async function deleteAccountForClerkUserId(ctx: MutationCtx, clerkUserId: string) {
	await recordDeletedClerkUser(ctx, clerkUserId);

	const user = await ctx.db
		.query('users')
		.withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
		.first();

	if (!user) {
		return { ok: true };
	}

	await deleteAccountRecords(ctx, user);

	return { ok: true };
}
