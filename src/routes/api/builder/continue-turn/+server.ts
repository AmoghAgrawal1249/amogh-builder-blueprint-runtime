import { signedTurnRoute } from '$runtime/http';
import { createRuntimeContext } from '$runtime/app.server';
import type { RequestHandler } from './$types';
import type { BuilderAppContinueTurnInput } from '@overbase/builder-sdk/app-protocol';

const { deps, runtime } = createRuntimeContext();

export const POST: RequestHandler = signedTurnRoute<BuilderAppContinueTurnInput>(
	runtime.continueTurn,
	{
		overbaseSecret: deps.overbaseSecret
	}
);
