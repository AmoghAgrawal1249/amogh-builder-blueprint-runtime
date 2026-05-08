import { readSignedJson, streamBuilderEvents } from '$runtime/http';
import { startTurn } from '$runtime/builder-runtime';
import type { RequestHandler } from './$types';
import type { BuilderAppStartTurnInput } from '@overbase/builder-sdk/app-protocol';

export const POST: RequestHandler = async (event) => {
	const input = await readSignedJson<BuilderAppStartTurnInput>(event);

	if (input instanceof Response) {
		return input;
	}

	return streamBuilderEvents((emit) =>
		startTurn(
			{
				...input,
				handlers: {}
			},
			emit
		)
	);
};
