import { signedBackgroundRoute } from '$runtime/http';
import { runtime } from '$runtime/operations';
import type { RequestHandler } from './$types';
import type { BuilderAppBackgroundJobInput } from '@overbase/builder-sdk/app-protocol';

export const POST: RequestHandler = signedBackgroundRoute<BuilderAppBackgroundJobInput>(
	runtime.backgroundJob
);
