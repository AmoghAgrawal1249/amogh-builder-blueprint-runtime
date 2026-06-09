import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import {
	getTeammateDisplayName,
	normalizeTeammateEmail,
	normalizeTeammateName,
	TEAMMATE_EMAIL_REGEX,
	TEAMMATE_EMAIL_SEPARATOR_REGEX
} from './teammateIdentity';
import { getViewerWorkspaceRecord, requireViewerWorkspace } from '../backend/auth/viewer';

function toTeammateResult(teammate: {
	_id: Id<'teammates'>;
		email: string;
		name: string;
		role: string;
		createdAt: number;
		updatedAt: number;
}) {
	return {
		id: teammate._id,
		email: teammate.email,
		name: teammate.name,
		role: teammate.role,
		displayName: getTeammateDisplayName(teammate),
		createdAt: teammate.createdAt,
		updatedAt: teammate.updatedAt
	};
}

function parseEmails(input: string[]) {
	const normalizedEmails = input
		.flatMap((value) => value.split(TEAMMATE_EMAIL_SEPARATOR_REGEX))
		.map(normalizeTeammateEmail)
		.filter(Boolean);
	const uniqueEmails = [...new Set(normalizedEmails)];
	const invalidEmails = uniqueEmails.filter((email) => !TEAMMATE_EMAIL_REGEX.test(email));

	if (invalidEmails.length > 0) {
		throw new Error(`Invalid email: ${invalidEmails[0]}`);
	}

	return uniqueEmails;
}

export const listTeammates = query({
	args: {},
	handler: async (ctx) => {
		const { workspace } = await requireViewerWorkspace(ctx);
		const teammates = await ctx.db
			.query('teammates')
			.withIndex('by_workspace_createdAt', (q) => q.eq('workspaceId', workspace._id))
			.order('desc')
			.collect();

		return teammates.map(toTeammateResult);
	}
});

export const addTeammates = mutation({
	args: {
		emails: v.array(v.string())
	},
	handler: async (ctx, { emails }) => {
		const { workspace } = await requireViewerWorkspace(ctx);
		const normalizedEmails = parseEmails(emails);

		if (normalizedEmails.length === 0) {
			throw new Error('Add at least one email.');
		}

		const now = Date.now();
		const insertedIds = [];
		const skippedEmails = [];

		for (const email of normalizedEmails) {
			const existingTeammate = await ctx.db
				.query('teammates')
				.withIndex('by_workspace_email', (q) => q.eq('workspaceId', workspace._id).eq('email', email))
				.first();

			if (existingTeammate) {
				skippedEmails.push(email);
				continue;
			}

			insertedIds.push(
				await ctx.db.insert('teammates', {
					email,
					workspaceId: workspace._id,
					name: '',
					role: '',
					createdAt: now,
					updatedAt: now
				})
			);
		}

		return {
			insertedIds,
			skippedEmails
		};
	}
});

export const updateTeammate = mutation({
	args: {
		teammateId: v.id('teammates'),
		email: v.string(),
		name: v.string(),
		role: v.string()
	},
	handler: async (ctx, { teammateId, email, name, role }) => {
		const viewerWorkspace = await requireViewerWorkspace(ctx);
		const { workspace } = viewerWorkspace;
		const teammate = getViewerWorkspaceRecord(viewerWorkspace, await ctx.db.get(teammateId));

		if (!teammate) {
			throw new Error('Team member not found.');
		}

		const normalizedEmail = normalizeTeammateEmail(email);

		if (!TEAMMATE_EMAIL_REGEX.test(normalizedEmail)) {
			throw new Error(`Invalid email: ${normalizedEmail || email}`);
		}

		const existingTeammate = await ctx.db
			.query('teammates')
			.withIndex('by_workspace_email', (q) => q.eq('workspaceId', workspace._id).eq('email', normalizedEmail))
			.first();

		if (existingTeammate && existingTeammate._id !== teammateId) {
			throw new Error(`Email already exists: ${normalizedEmail}`);
		}

		const updatedTeammate = {
			...teammate,
			email: normalizedEmail,
			name: normalizeTeammateName(name),
			role: role.trim(),
			updatedAt: Date.now()
		};

		await ctx.db.patch(teammateId, {
			email: updatedTeammate.email,
			name: updatedTeammate.name,
			role: updatedTeammate.role,
			updatedAt: updatedTeammate.updatedAt
		});

		return toTeammateResult(updatedTeammate);
	}
});

export const deleteTeammates = mutation({
	args: {
		teammateIds: v.array(v.id('teammates'))
	},
	handler: async (ctx, { teammateIds }) => {
		const { workspace } = await requireViewerWorkspace(ctx);
		for (const teammateId of new Set(teammateIds)) {
			const teammate = await ctx.db.get(teammateId);

			if (teammate && teammate.workspaceId === workspace._id) {
				await ctx.db.delete(teammateId);
			}
		}
	}
});
