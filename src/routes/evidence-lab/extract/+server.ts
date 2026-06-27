import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { extractEvidenceWithOpenAI } from '$lib/features/source-ranking/evidence-extraction/openai-extractor.server';
import type { RequestHandler } from './$types';

const MAX_EXTRACTION_TEXT_LENGTH = 30_000;

export const POST: RequestHandler = async ({ request }) => {
	const apiKey = env.OPENAI_API_KEY?.trim();

	if (!apiKey) {
		return json(
			{
				ok: false,
				error: 'OPENAI_API_KEY is not configured on the server.'
			},
			{ status: 503 }
		);
	}

	const body = await request.json().catch(() => null);

	if (!isRecord(body)) {
		return json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
	}

	const fileName = typeof body.fileName === 'string' ? body.fileName.trim() : '';
	const text = typeof body.text === 'string' ? body.text.trim() : '';

	if (!fileName) {
		return json({ ok: false, error: 'fileName is required.' }, { status: 400 });
	}

	if (!text) {
		return json({ ok: false, error: 'Source text is required.' }, { status: 400 });
	}

	if (text.length > MAX_EXTRACTION_TEXT_LENGTH) {
		return json(
			{
				ok: false,
				error: `Source text must be ${MAX_EXTRACTION_TEXT_LENGTH.toLocaleString()} characters or fewer.`
			},
			{ status: 413 }
		);
	}

	try {
		const extracted = await extractEvidenceWithOpenAI({ apiKey, fileName, text });

		return json({ ok: true, extracted });
	} catch (error) {
		return json(
			{
				ok: false,
				error: error instanceof Error ? error.message : 'OpenAI extraction failed.'
			},
			{ status: 502 }
		);
	}
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
