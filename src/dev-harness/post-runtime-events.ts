import type { BuilderAppOutputEvent } from '@overbase/builder-sdk/app-protocol';

export async function postRuntimeEvents(params: {
	body: unknown;
	onEvent: (event: BuilderAppOutputEvent) => void;
}) {
	const response = await fetch('/api/dev-harness/run', {
		method: 'POST',
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify(params.body)
	});

	if (!response.ok) {
		throw new Error(await response.text());
	}

	if (!response.body) {
		throw new Error('Runtime response did not include a stream.');
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';

	while (true) {
		const { done, value } = await reader.read();

		if (done) {
			break;
		}

		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split('\n');
		buffer = lines.pop() ?? '';

		for (const line of lines) {
			if (line.trim()) {
				params.onEvent(JSON.parse(line) as BuilderAppOutputEvent);
			}
		}
	}

	buffer += decoder.decode();

	if (buffer.trim()) {
		params.onEvent(JSON.parse(buffer) as BuilderAppOutputEvent);
	}
}
