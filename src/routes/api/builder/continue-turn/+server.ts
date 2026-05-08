import { signedTurnRoute } from '$runtime/http';
import { runtime } from '$runtime/operations';
import type { RequestHandler } from './$types';
import type { BuilderAppContinueTurnInput } from '@overbase/builder-sdk/app-protocol';

export const POST: RequestHandler = signedTurnRoute<BuilderAppContinueTurnInput>(
	runtime.continueTurn
);
