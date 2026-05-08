import { readSignedJson, streamBuilderEvents } from '$runtime/http';
import { continueTurn } from '$runtime/builder-runtime';
import type { RequestHandler } from './$types';
import type { BuilderAppContinueTurnInput } from '@overbase/builder-sdk/app-protocol';

export const POST: RequestHandler = async (event) => {
	const input = await readSignedJson<BuilderAppContinueTurnInput>(event);

	if (input instanceof Response) {
		return input;
	}

	return streamBuilderEvents((emit) =>
		continueTurn(
			{
				...input,
				handlers: {}
			},
			emit
		)
	);
};
