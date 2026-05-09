import { streamBuilderEvents } from '$runtime/ndjson';
import { createRuntimeContext } from '$runtime/app.server';
import { createLocalBuilderHost } from '$runtimeHost/local-host';
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
const host = createLocalBuilderHost(runtime);

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as DevHarnessRunInput;

	if (body.action === 'start') {
		return streamBuilderEvents((emit) => host.start(body.input, emit));
	}

	if (body.action === 'continue') {
		return streamBuilderEvents((emit) => host.continueTurn(body.input, emit));
	}

	return new Response('Unknown dev harness action.', { status: 400 });
};
