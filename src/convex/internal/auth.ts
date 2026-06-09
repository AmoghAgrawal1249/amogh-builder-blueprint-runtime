import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';
import { deleteAccountForClerkUserId } from '../../backend/auth/account-deletion';

export const deleteAccountForClerkUser = internalMutation({
	args: {
		clerkUserId: v.string()
	},
	handler: async (ctx, { clerkUserId }) => await deleteAccountForClerkUserId(ctx, clerkUserId)
});
