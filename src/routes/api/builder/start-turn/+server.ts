import { signedTurnRoute } from '$runtime/http';
import { runtime } from '$runtime/operations';
import type { RequestHandler } from './$types';
import type { BuilderAppStartTurnInput } from '@overbase/builder-sdk/app-protocol';

export const POST: RequestHandler = signedTurnRoute<BuilderAppStartTurnInput>(runtime.startTurn);
