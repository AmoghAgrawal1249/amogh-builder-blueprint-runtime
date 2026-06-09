import {
	getViewerWorkspaceRecord,
	requireViewerWorkspace,
	type ViewerWorkspace
} from '../backend/auth/viewer';
import {
	normalizeEmailFormatContent,
	normalizeEmailFormatRules,
	normalizeEmailFormatTitle,
	normalizeEmailFormatVariables,
	normalizeSelectedAnswers,
	toEditableEmailFormatContent
} from '../backend/email-formats/content';
import {
	collectEmailFormatRecipientRows,
	deleteEmailFormatRecipientRows,
	insertEmailFormatRecipientRows,
	replaceEmailFormatRecipientRows
} from '../backend/email-formats/recipients';
import {
	EMAIL_FORMAT_CONTENT_EDIT_POLICY,
	EMAIL_FORMAT_RULE_INFO_CARD,
	EMAIL_FORMAT_RULES_EDIT_POLICY,
	getEmailFormatActivationState,
	getInitialRules
} from '../backend/email-formats/activation';
import {
	deleteEmailFormatsInput,
	emailFormatCreateFromStarterInput,
	emailFormatId,
	setEmailFormatStatusInput,
	updateEmailFormatContentInput,
	updateEmailFormatRecipientsInput,
	updateEmailFormatRulesInput,
	updateEmailFormatTitleInput
} from '../backend/validators/email-formats';
import type { Doc, Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';
import { mutation, query } from './_generated/server';
import { getTeammateDisplayName } from './teammateIdentity';

function getCreatorDisplayName(creator: Doc<'users'> | null) {
	return creator?.displayName?.trim() || 'Unknown user';
}

function areJsonEqual(first: unknown, second: unknown) {
	return JSON.stringify(first) === JSON.stringify(second);
}

type VersionedValue<Value> = {
	value: Value;
	version: number;
};

function versionedMutationResult<
	const Kind extends 'stale' | 'saved',
	const Key extends string,
	Value
>(kind: Kind, key: Key, value: Value, version: number) {
	return {
		kind,
		[key]: { value, version }
	} as { kind: Kind } & Record<Key, VersionedValue<Value>>;
}

async function getEmailFormatInViewerWorkspace(
	ctx: QueryCtx | MutationCtx,
	viewerWorkspace: ViewerWorkspace,
	emailFormatId: Id<'emailFormats'>
) {
	return getViewerWorkspaceRecord(viewerWorkspace, await ctx.db.get(emailFormatId));
}

export const createEmailFormatFromStarter = mutation({
	args: emailFormatCreateFromStarterInput,
	handler: async (ctx, args) => {
		const viewerWorkspace = await requireViewerWorkspace(ctx);
		const { user, workspace } = viewerWorkspace;
		const formatStarterSlug = args.formatStarterSlug.trim();
		const startingPointId = args.startingPointId.trim();
		const variables = normalizeEmailFormatVariables(args.variables);
		const title = normalizeEmailFormatTitle(args.title);
		const content = normalizeEmailFormatContent(
			{
				to: args.to,
				cc: args.cc,
				attachment: args.attachment,
				body: args.body
			},
			variables
		);
		const now = Date.now();

		if (!formatStarterSlug) {
			throw new Error('Format starter slug is required.');
		}

		if (!startingPointId) {
			throw new Error('Format starting point is required.');
		}

		if (variables.length === 0) {
			throw new Error('Email format variables are required.');
		}

		if (!title) {
			throw new Error('Email format title is required.');
		}

		if (content.body.length === 0) {
			throw new Error('Email format body is required.');
		}

		const emailFormatId = await ctx.db.insert('emailFormats', {
			workspaceId: workspace._id,
			creatorUserId: user._id,
			formatStarterSlug,
			startingPointId,
			variables,
			selectedAnswers: normalizeSelectedAnswers(args.selectedAnswers),
			status: 'paused',
			lastActivatedAt: null,
			title,
			titleVersion: 1,
			to: content.to,
			cc: content.cc,
			attachment: content.attachment,
			body: content.body,
			emailContentVersion: 1,
			recipientCount: 0,
			rules: getInitialRules(),
			rulesVersion: 1,
			createdAt: now,
			updatedAt: now
		});

		await insertEmailFormatRecipientRows(
			ctx,
			viewerWorkspace,
			emailFormatId,
			[],
			now
		);

		return { emailFormatId };
	}
});

export const listEmailFormats = query({
	args: {},
	handler: async (ctx) => {
		const { workspace } = await requireViewerWorkspace(ctx);
		const formats = await ctx.db
			.query('emailFormats')
			.withIndex('by_workspace_createdAt', (q) => q.eq('workspaceId', workspace._id))
			.order('desc')
			.collect();

		return await Promise.all(
			formats.map(async (format) => {
				const creator = await ctx.db.get(format.creatorUserId);
				const activationState = await getEmailFormatActivationState(format);

				return {
					id: format._id,
					title: format.title,
					status: format.status,
					createdAt: format.createdAt,
					activation: {
						canActivate: activationState.readiness.canActivate
					},
					creator: {
						name: getCreatorDisplayName(creator),
						avatarUrl: creator?.avatar?.url ?? ''
					}
				};
			})
		);
	}
});

export const getEmailFormatConfiguration = query({
	args: {
		emailFormatId
	},
	handler: async (ctx, args) => {
		const viewerWorkspace = await requireViewerWorkspace(ctx);
		const { user, workspace, identity } = viewerWorkspace;
		const format = await getEmailFormatInViewerWorkspace(
			ctx,
			viewerWorkspace,
			args.emailFormatId
		);

		if (!format) {
			return null;
		}

		const [recipientRows, teammates] = await Promise.all([
			collectEmailFormatRecipientRows(ctx, workspace._id, format._id),
			ctx.db
				.query('teammates')
				.withIndex('by_workspace_createdAt', (q) => q.eq('workspaceId', workspace._id))
				.order('desc')
				.collect()
		]);
		const { readiness: activationReadiness } = await getEmailFormatActivationState(format);

		return {
			emailFormat: {
				id: format._id,
				formatStarterSlug: format.formatStarterSlug,
				startingPointId: format.startingPointId,
				status: format.status,
				lastActivatedAt: format.lastActivatedAt,
				title: {
					value: format.title,
					version: format.titleVersion
				},
				emailContent: {
					value: toEditableEmailFormatContent(format),
					version: format.emailContentVersion
				},
				rules: {
					value: format.rules,
					version: format.rulesVersion
				},
				recipientRefs: recipientRows.map((row) => row.recipient),
				activation: activationReadiness,
				updatedAt: format.updatedAt
			},
			formatConfig: {
				slug: format.formatStarterSlug,
				variables: format.variables,
				contentEditPolicy: EMAIL_FORMAT_CONTENT_EDIT_POLICY,
				rulesEditPolicy: EMAIL_FORMAT_RULES_EDIT_POLICY,
				ruleInfoCard: EMAIL_FORMAT_RULE_INFO_CARD
			},
			recipientPickerPeople: [
				{
					id: `user:${user._id}`,
					name: user.displayName?.trim() || identity.email,
					avatarUrl: user.avatar?.url ?? ''
				},
				...teammates.map((teammate) => ({
					id: `teammate:${teammate._id}`,
					name: getTeammateDisplayName(teammate),
					avatarUrl: ''
				}))
			],
			feedback: [],
			feedbackUpdatedAt: 0,
			sentEmails: []
		};
	}
});

export const updateEmailFormatTitle = mutation({
	args: updateEmailFormatTitleInput,
	handler: async (ctx, args) => {
		const viewerWorkspace = await requireViewerWorkspace(ctx);
		const format = await getEmailFormatInViewerWorkspace(
			ctx,
			viewerWorkspace,
			args.emailFormatId
		);

		if (!format) {
			throw new Error('Email format not found.');
		}

		if (format.titleVersion !== args.baseTitleVersion) {
			return versionedMutationResult('stale', 'title', format.title, format.titleVersion);
		}

		const title = normalizeEmailFormatTitle(args.title);

		if (!title) {
			throw new Error('Email format title is required.');
		}

		const now = Date.now();
		const titleVersion = format.titleVersion + 1;

		await ctx.db.patch(args.emailFormatId, {
			title,
			titleVersion,
			updatedAt: now
		});

		return versionedMutationResult('saved', 'title', title, titleVersion);
	}
});

export const updateEmailFormatContent = mutation({
	args: updateEmailFormatContentInput,
	handler: async (ctx, args) => {
		const viewerWorkspace = await requireViewerWorkspace(ctx);
		const format = await getEmailFormatInViewerWorkspace(
			ctx,
			viewerWorkspace,
			args.emailFormatId
		);

		if (!format) {
			throw new Error('Email format not found.');
		}

		if (format.emailContentVersion !== args.baseEmailContentVersion) {
			return versionedMutationResult(
				'stale',
				'emailContent',
				toEditableEmailFormatContent(format),
				format.emailContentVersion
			);
		}

		const content = normalizeEmailFormatContent(
			{
				to: args.to,
				cc: args.cc,
				attachment: args.attachment,
				body: args.body
			},
			format.variables
		);

		if (content.body.length === 0) {
			throw new Error('Email format body is required.');
		}

		const now = Date.now();
		const emailContentVersion = format.emailContentVersion + 1;

		await ctx.db.patch(args.emailFormatId, {
			to: content.to,
			cc: content.cc,
			attachment: content.attachment,
			body: content.body,
			emailContentVersion,
			updatedAt: now
		});

		return versionedMutationResult('saved', 'emailContent', content, emailContentVersion);
	}
});

export const updateEmailFormatRules = mutation({
	args: updateEmailFormatRulesInput,
	handler: async (ctx, args) => {
		const viewerWorkspace = await requireViewerWorkspace(ctx);
		const format = await getEmailFormatInViewerWorkspace(
			ctx,
			viewerWorkspace,
			args.emailFormatId
		);

		if (!format) {
			throw new Error('Email format not found.');
		}

		if (format.rulesVersion !== args.baseRulesVersion) {
			return versionedMutationResult('stale', 'rules', format.rules, format.rulesVersion);
		}

		const rules = normalizeEmailFormatRules(args.rules);
		const currentRules = normalizeEmailFormatRules(format.rules);

		if (areJsonEqual(currentRules, rules)) {
			return versionedMutationResult('saved', 'rules', currentRules, format.rulesVersion);
		}

		const now = Date.now();
		const rulesVersion = format.rulesVersion + 1;

		await ctx.db.patch(args.emailFormatId, {
			rules,
			rulesVersion,
			updatedAt: now
		});

		return versionedMutationResult('saved', 'rules', rules, rulesVersion);
	}
});

export const updateEmailFormatRecipients = mutation({
	args: updateEmailFormatRecipientsInput,
	handler: async (ctx, args) => {
		const viewerWorkspace = await requireViewerWorkspace(ctx);
		const format = await getEmailFormatInViewerWorkspace(
			ctx,
			viewerWorkspace,
			args.emailFormatId
		);

		if (!format) {
			throw new Error('Email format not found.');
		}

		const now = Date.now();
		const recipientRefs = await replaceEmailFormatRecipientRows(
			ctx,
			viewerWorkspace,
			args.emailFormatId,
			args.recipientRefs,
			now
		);

		return { recipientRefs, updatedAt: now };
	}
});

export const setEmailFormatStatus = mutation({
	args: setEmailFormatStatusInput,
	handler: async (ctx, args) => {
		const viewerWorkspace = await requireViewerWorkspace(ctx);
		const format = await getEmailFormatInViewerWorkspace(
			ctx,
			viewerWorkspace,
			args.emailFormatId
		);

		if (!format) {
			throw new Error('Email format not found.');
		}

		if (args.status === 'active') {
			const { readiness } = await getEmailFormatActivationState(format);

			if (!readiness.canActivate) {
				throw new Error(readiness.message ?? 'Email format is not ready to activate.');
			}
		}

		const now = Date.now();

		await ctx.db.patch(args.emailFormatId, {
			status: args.status,
			...(args.status === 'active' ? { lastActivatedAt: now } : {}),
			updatedAt: now
		});

		return {
			status: args.status,
			lastActivatedAt: args.status === 'active' ? now : format.lastActivatedAt,
			updatedAt: now
		};
	}
});

export const deleteEmailFormats = mutation({
	args: deleteEmailFormatsInput,
	handler: async (ctx, args) => {
		const viewerWorkspace = await requireViewerWorkspace(ctx);
		const deletedIds: Id<'emailFormats'>[] = [];

		for (const emailFormatId of args.emailFormatIds) {
			const format = await getEmailFormatInViewerWorkspace(ctx, viewerWorkspace, emailFormatId);

			if (!format) {
				continue;
			}

			await deleteEmailFormatRecipientRows(ctx, viewerWorkspace.workspace._id, format._id);
			await ctx.db.delete(format._id);
			deletedIds.push(format._id);
		}

		return { deletedIds };
	}
});
