import { streamBuilderEvents } from '$runtime/ndjson';
import { createRuntimeContext } from '$runtime/app.server';
import type {
	BuilderAppContinueTurnInput,
	BuilderAppStartTurnInput
} from '@overbase/builder-sdk/app-protocol';
import type { RequestHandler } from './$types';

type DevHarnessStartInput = Omit<BuilderAppStartTurnInput, 'handlers'>;
type DevHarnessContinueInput = Omit<BuilderAppContinueTurnInput, 'handlers'>;

type DevHarnessRunInput =
	| {
			action: 'start';
			input: DevHarnessStartInput;
	  }
	| {
			action: 'continue';
			input: DevHarnessContinueInput;
	  };

const { runtime } = createRuntimeContext();

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as DevHarnessRunInput;

	if (body.action === 'start') {
		return streamBuilderEvents(async (emit) => {
			const startEvents = await runtime.startTurn(
				{
					...body.input,
					handlers: {}
				},
				emit
			);
			const backgroundEvents = await runtime.backgroundJob({
				initialMessage: body.input.initialMessage,
				appState: body.input.appState
			});

			return [...startEvents, ...backgroundEvents];
		});
	}

	if (body.action === 'continue') {
		return streamBuilderEvents((emit) =>
			runtime.continueTurn(
				{
					...body.input,
					handlers: {}
				},
				emit
			)
		);
	}

	return new Response('Unknown dev harness action.', { status: 400 });
};
