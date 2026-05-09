import { signedTurnRoute } from '$runtime/http';
import { createRuntimeContext } from '$runtime/app.server';
import type { RequestHandler } from './$types';
import type { BuilderAppStartTurnInput } from '@overbase/builder-sdk/app-protocol';

const { deps, runtime } = createRuntimeContext();

export const POST: RequestHandler = signedTurnRoute<BuilderAppStartTurnInput>(runtime.startTurn, {
	overbaseSecret: deps.overbaseSecret
});
