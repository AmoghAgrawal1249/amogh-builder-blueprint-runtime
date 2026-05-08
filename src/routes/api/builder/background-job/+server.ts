import { readSignedJson, streamBuilderEvents } from '$runtime/http';
import { backgroundJob } from '$runtime/builder-runtime';
import type { RequestHandler } from './$types';
import type { BuilderAppBackgroundJobInput } from '@overbase/builder-sdk/app-protocol';

export const POST: RequestHandler = async (event) => {
	const input = await readSignedJson<BuilderAppBackgroundJobInput>(event);

	if (input instanceof Response) {
		return input;
	}

	return streamBuilderEvents(() => backgroundJob(input));
};
