import { createHmac, timingSafeEqual } from 'node:crypto';

const SIGNATURE_HEADER = 'x-overbase-signature';
const TIMESTAMP_HEADER = 'x-overbase-timestamp';
const APP_HEADER = 'x-overbase-app';
const APP_SLUG = 'bring-the-firm';
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

function getRuntimeSecret() {
	const secret = process.env.BRING_THE_FIRM_OVERBASE_SECRET;

	if (!secret) {
		throw new Error('BRING_THE_FIRM_OVERBASE_SECRET is not configured.');
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

export function verifyOverbaseSignature(params: { headers: Headers; body: string }) {
	const signature = params.headers.get(SIGNATURE_HEADER) ?? '';
	const timestamp = params.headers.get(TIMESTAMP_HEADER) ?? '';
	const app = params.headers.get(APP_HEADER) ?? '';
	const timestampMs = Number(timestamp);

	if (app !== APP_SLUG) {
		return 'Invalid app.';
	}

	if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > MAX_CLOCK_SKEW_MS) {
		return 'Invalid timestamp.';
	}

	const expectedSignature = signBody({
		secret: getRuntimeSecret(),
		timestamp,
		body: params.body
	});

	if (!signature || !signaturesMatch(signature, expectedSignature)) {
		return 'Invalid signature.';
	}

	return null;
}
