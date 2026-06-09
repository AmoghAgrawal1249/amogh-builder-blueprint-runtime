import { v } from 'convex/values';

export const avatar = v.object({
	url: v.string(),
	storageId: v.id('_storage'),
	contentType: v.string(),
	fileName: v.optional(v.string()),
	size: v.number(),
	updatedAt: v.number()
});
