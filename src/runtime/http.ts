import { json } from '@sveltejs/kit';
import type { RequestEvent, RequestHandler } from '@sveltejs/kit';
import type { BuilderAppOutputEvent } from '@overbase/builder-sdk/app-protocol';
import { streamBuilderEvents } from './ndjson';
import { verifyOverbaseSignature } from './signing';

type EmitEvent = (event: BuilderAppOutputEvent) => Promise<void> | void;
type TurnOperation<TInput> = (
	input: TInput,
	emit?: EmitEvent
) => Promise<BuilderAppOutputEvent[]>;
type BackgroundOperation<TInput> = (input: TInput) => Promise<BuilderAppOutputEvent[]>;
type JsonTurnInput<TInput> = Omit<TInput, 'handlers'>;
type SignedRouteOptions = {
	overbaseSecret: string | undefined;
};

export async function readSignedJson<T>(event: RequestEvent, options: SignedRouteOptions) {
	const body = await event.request.text();
	const signatureError = verifyOverbaseSignature({
		headers: event.request.headers,
		body,
		secret: options.overbaseSecret
	});

	if (signatureError) {
		return json({ error: signatureError }, { status: 401 });
	}

	return JSON.parse(body) as T;
}

export function signedTurnRoute<TInput extends { handlers: unknown }>(
	run: TurnOperation<TInput>,
	options: SignedRouteOptions
): RequestHandler {
	return async (event) => {
		const input = await readSignedJson<JsonTurnInput<TInput>>(event, options);

		if (input instanceof Response) {
			return input;
		}

		return streamBuilderEvents((emit) =>
			run(
				{
					...input,
					handlers: {}
				} as TInput,
				emit
			)
		);
	};
}

export function signedBackgroundRoute<TInput>(
	run: BackgroundOperation<TInput>,
	options: SignedRouteOptions
): RequestHandler {
	return async (event) => {
		const input = await readSignedJson<TInput>(event, options);

		if (input instanceof Response) {
			return input;
		}

		return streamBuilderEvents(() => run(input));
	};
}

export { streamBuilderEvents };
