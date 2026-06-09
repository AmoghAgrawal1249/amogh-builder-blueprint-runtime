import type { Id } from '../../convex/_generated/dataModel';
import type { MutationCtx } from '../../convex/_generated/server';

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export type StoredAvatar = {
	url: string;
	storageId: Id<'_storage'>;
	contentType: string;
	fileName?: string;
	size: number;
	updatedAt: number;
};

type UploadedAvatarResult =
	| {
			ok: true;
			avatar: StoredAvatar;
	  }
	| {
			ok: false;
			errorText: string;
	  };

function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : 'Unable to save avatar image.';
}

export async function createUploadedAvatar(
	ctx: MutationCtx,
	storageId: Id<'_storage'>,
	fileName: string | undefined,
	updatedAt: number
): Promise<StoredAvatar> {
	const metadata = await ctx.db.system.get(storageId);

	if (!metadata) {
		throw new Error('Uploaded avatar was not found.');
	}

	if (!metadata.contentType?.startsWith('image/')) {
		throw new Error('Avatar file must be an image.');
	}

	if (metadata.size > MAX_AVATAR_BYTES) {
		throw new Error('Avatar image must be 2 MB or smaller.');
	}

	const url = await ctx.storage.getUrl(storageId);

	if (!url) {
		throw new Error('Unable to resolve uploaded avatar URL.');
	}

	return {
		url,
		storageId,
		contentType: metadata.contentType,
		...(fileName ? { fileName } : {}),
		size: metadata.size,
		updatedAt
	};
}

export async function createUploadedAvatarOrDelete(
	ctx: MutationCtx,
	storageId: Id<'_storage'>,
	fileName: string | undefined,
	updatedAt: number
): Promise<UploadedAvatarResult> {
	try {
		return {
			ok: true,
			avatar: await createUploadedAvatar(ctx, storageId, fileName, updatedAt)
		};
	} catch (error) {
		await ctx.storage.delete(storageId);

		return {
			ok: false,
			errorText: getErrorMessage(error)
		};
	}
}

export async function deleteReplacedUploadedAvatar(
	ctx: MutationCtx,
	previousAvatar: StoredAvatar | undefined,
	nextStorageId: Id<'_storage'>
) {
	if (previousAvatar?.storageId && previousAvatar.storageId !== nextStorageId) {
		await ctx.storage.delete(previousAvatar.storageId);
	}
}

export async function deleteUploadedAvatar(
	ctx: MutationCtx,
	avatar: StoredAvatar | undefined
) {
	if (!avatar?.storageId) {
		return;
	}

	const metadata = await ctx.db.system.get(avatar.storageId);

	if (metadata) {
		await ctx.storage.delete(avatar.storageId);
	}
}
