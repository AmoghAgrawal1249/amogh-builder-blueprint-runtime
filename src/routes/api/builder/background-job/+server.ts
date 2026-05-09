import { signedBackgroundRoute } from '$runtime/http';
import { createRuntimeContext } from '$runtime/app.server';
import type { RequestHandler } from './$types';
import type { BuilderAppBackgroundJobInput } from '@overbase/builder-sdk/app-protocol';

const { deps, runtime } = createRuntimeContext();

export const POST: RequestHandler = signedBackgroundRoute<BuilderAppBackgroundJobInput>(
	runtime.backgroundJob,
	{
		overbaseSecret: deps.overbaseSecret
	}
);
