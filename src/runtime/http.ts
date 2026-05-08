import { createHmac, timingSafeEqual } from 'node:crypto';
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { BuilderAppOutputEvent } from '@overbase/builder-sdk/app-protocol';

const SIGNATURE_HEADER = 'x-overbase-signature';
const TIMESTAMP_HEADER = 'x-overbase-timestamp';
const APP_HEADER = 'x-overbase-app';
const APP_SLUG = 'bring-the-firm';
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

function getRuntimeSecret() {
	const secret = process.env.OVERBASE_BUILDER_APP_SECRET;

	if (!secret) {
		throw new Error('OVERBASE_BUILDER_APP_SECRET is not configured.');
	}

	return secret;
}

function signBody(params: { secret: string; timestamp: string; body: string }) {
	return createHmac('sha256', params.secret)
		.update(`${params.timestamp}.${params.body}`)
		.digest('hex');
}

function signaturesMatch(left: string, right: string) {
	const leftBuffer = Buffer.from(left, 'hex');
	const rightBuffer = Buffer.from(right, 'hex');

	return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export async function readSignedJson<T>(event: RequestEvent) {
	const body = await event.request.text();
	const signature = event.request.headers.get(SIGNATURE_HEADER) ?? '';
	const timestamp = event.request.headers.get(TIMESTAMP_HEADER) ?? '';
	const app = event.request.headers.get(APP_HEADER) ?? '';
	const timestampMs = Number(timestamp);

	if (app !== APP_SLUG) {
		return json({ error: 'Invalid app.' }, { status: 401 });
	}

	if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > MAX_CLOCK_SKEW_MS) {
		return json({ error: 'Invalid timestamp.' }, { status: 401 });
	}

	const expectedSignature = signBody({
		secret: getRuntimeSecret(),
		timestamp,
		body
	});

	if (!signature || !signaturesMatch(signature, expectedSignature)) {
		return json({ error: 'Invalid signature.' }, { status: 401 });
	}

	return JSON.parse(body) as T;
}

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
