import type { BuilderAppOutputEvent } from '@overbase/builder-sdk/app-protocol';

export async function streamBuilderEvents(
	run: (emit: (event: BuilderAppOutputEvent) => Promise<void>) => Promise<BuilderAppOutputEvent[]>
) {
	const encoder = new TextEncoder();

	const stream = new ReadableStream<Uint8Array>({
		start(nextController) {
			void (async () => {
				try {
					const emit = async (event: BuilderAppOutputEvent) => {
						nextController.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
					};
					const events = await run(emit);

					for (const event of events) {
						await emit(event);
					}

					nextController.close();
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Runtime request failed.';
					nextController.enqueue(
						encoder.encode(`${JSON.stringify({ type: 'fail', errorText: message })}\n`)
					);
					nextController.close();
				}
			})();
		}
	});

	return new Response(stream, {
		headers: {
			'content-type': 'application/x-ndjson; charset=utf-8',
			'cache-control': 'no-store'
		}
	});
}
