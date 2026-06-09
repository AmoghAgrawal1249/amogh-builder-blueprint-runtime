import type { ViewerWorkspace } from '../auth/viewer';
import type { Doc, Id } from '../../convex/_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../../convex/_generated/server';

export type EmailFormatRecipientRef = Doc<'emailFormatRecipients'>['recipient'];

function toRecipientKey(ref: EmailFormatRecipientRef) {
	return ref.kind === 'user' ? `user:${ref.userId}` : `teammate:${ref.teammateId}`;
}

function dedupeRecipientRefs(refs: EmailFormatRecipientRef[]) {
	const seenKeys = new Set<string>();
	const dedupedRefs: EmailFormatRecipientRef[] = [];

	for (const ref of refs) {
		const key = toRecipientKey(ref);

		if (!seenKeys.has(key)) {
			seenKeys.add(key);
			dedupedRefs.push(ref);
		}
	}

	return dedupedRefs;
}

export async function collectEmailFormatRecipientRows(
	ctx: QueryCtx | MutationCtx,
	workspaceId: Id<'workspaces'>,
	emailFormatId: Id<'emailFormats'>
) {
	return await ctx.db
		.query('emailFormatRecipients')
		.withIndex('by_workspace_emailFormat', (q) =>
			q.eq('workspaceId', workspaceId).eq('emailFormatId', emailFormatId)
		)
		.collect();
}

export async function deleteEmailFormatRecipientRows(
	ctx: MutationCtx,
	workspaceId: Id<'workspaces'>,
	emailFormatId: Id<'emailFormats'>
) {
	for (const row of await collectEmailFormatRecipientRows(ctx, workspaceId, emailFormatId)) {
		await ctx.db.delete(row._id);
	}
}

async function validateRecipientRefs(
	ctx: MutationCtx,
	viewerWorkspace: ViewerWorkspace,
	refs: EmailFormatRecipientRef[]
) {
	const dedupedRefs = dedupeRecipientRefs(refs);

	for (const ref of dedupedRefs) {
		if (ref.kind === 'user') {
			if (ref.userId !== viewerWorkspace.user._id) {
				throw new Error('Recipient user is not in this workspace.');
			}
			continue;
		}

		const teammate = await ctx.db.get(ref.teammateId);

		if (!teammate || teammate.workspaceId !== viewerWorkspace.workspace._id) {
			throw new Error('Recipient team member is not in this workspace.');
		}
	}

	return dedupedRefs;
}

export async function insertEmailFormatRecipientRows(
	ctx: MutationCtx,
	viewerWorkspace: ViewerWorkspace,
	emailFormatId: Id<'emailFormats'>,
	refs: EmailFormatRecipientRef[],
	updatedAt: number
) {
	const recipientRefs = await validateRecipientRefs(ctx, viewerWorkspace, refs);

	for (const recipient of recipientRefs) {
		await ctx.db.insert('emailFormatRecipients', {
			workspaceId: viewerWorkspace.workspace._id,
			emailFormatId,
			recipient,
			createdAt: updatedAt
		});
	}

	await ctx.db.patch(emailFormatId, {
		recipientCount: recipientRefs.length,
		updatedAt
	});

	return recipientRefs;
}

export async function replaceEmailFormatRecipientRows(
	ctx: MutationCtx,
	viewerWorkspace: ViewerWorkspace,
	emailFormatId: Id<'emailFormats'>,
	refs: EmailFormatRecipientRef[],
	updatedAt: number
) {
	await deleteEmailFormatRecipientRows(ctx, viewerWorkspace.workspace._id, emailFormatId);

	return await insertEmailFormatRecipientRows(
		ctx,
		viewerWorkspace,
		emailFormatId,
		refs,
		updatedAt
	);
}
