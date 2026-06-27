import { normalizeExtractedEvidence } from './normalize-extraction';
import type { ExtractedEvidence } from './types';

export const OPENAI_EVIDENCE_EXTRACTION_MODEL = 'gpt-5.5';
export const OPENAI_EVIDENCE_EXTRACTION_REASONING_EFFORT = 'low';

type OpenAIEvidenceExtractionInput = {
	apiKey: string;
	fileName: string;
	text: string;
};

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

const EXTRACTION_SYSTEM_PROMPT = `You extract structured evidence from messy business source material for an automated email workflow.

Your job is extraction only. Do not decide whether automation should send, review, request, or block.

Return only structured evidence. Capture:
- concrete claims and whether they are direct, inferred, or weak
- stale context and uncertainty
- statements like "do not say X unless Y confirms"
- contradictions where a source argues against a claim
- sensitive/confidential/partner-channel risk
- likely human owners or validators
- only the smallest missing context that blocks safe automation

Use these claim kinds only:
clientConcern, decisionFeedback, implementationRisk, renewalRisk, pricingContext, timelineContext, stakeholderContext, nextStep, other.

Use these owner kinds only:
accountOwner, opportunityOwner, proposalOwner, documentAuthor, meetingAttendee, sourceUploader, unknown.

If a source says a claim is old, stale, uncertain, or needs validation, mark support as weak or inferred and requiresValidation as true.
If a source says not to state a claim as true, use stance "contradicts" for that claim.
If a claim is current and directly stated, use support "direct".
If partner-channel, confidential, legal, restricted, pricing, discount, or procurement material appears, reflect sensitivity appropriately.

Keep missingContext focused and minimal:
- Include only blocking questions needed before safe automation.
- Do not include nice-to-have details, full source-document requests, generic contact details, or broad research tasks.
- Prefer the smallest validation question, such as "Finance Ops confirmation that old discount context is still current".
- Do not duplicate cautions in missingContext unless a specific confirmation is needed.
- Limit missingContext to at most 4 items, ordered by importance.

Keep cautions focused and non-duplicative:
- Include concise warnings about unsafe wording, stale context, sensitivity, or validation requirements.
- Limit cautions to at most 6 items, ordered by automation risk.`;

const EXTRACTED_EVIDENCE_JSON_SCHEMA = {
	type: 'object',
	additionalProperties: false,
	required: ['claims', 'ownerSignals', 'cautions', 'missingContext', 'suggestedContextNeedKinds'],
	properties: {
		claims: {
			type: 'array',
			maxItems: 16,
			items: {
				type: 'object',
				additionalProperties: false,
				required: ['kind', 'text', 'support', 'stance', 'sensitivity', 'requiresValidation', 'reason'],
				properties: {
					kind: {
						type: 'string',
						enum: [
							'clientConcern',
							'decisionFeedback',
							'implementationRisk',
							'renewalRisk',
							'pricingContext',
							'timelineContext',
							'stakeholderContext',
							'nextStep',
							'other'
						]
					},
					text: { type: 'string' },
					support: { type: 'string', enum: ['direct', 'inferred', 'weak'] },
					stance: { type: 'string', enum: ['supports', 'contradicts', 'none'] },
					sensitivity: { type: 'string', enum: ['low', 'medium', 'high'] },
					requiresValidation: { type: 'boolean' },
					reason: { type: 'string' }
				}
			}
		},
		ownerSignals: {
			type: 'array',
			maxItems: 8,
			items: {
				type: 'object',
				additionalProperties: false,
				required: ['kind', 'name', 'email', 'role', 'organization', 'confidence', 'reason'],
				properties: {
					kind: {
						type: 'string',
						enum: [
							'accountOwner',
							'opportunityOwner',
							'proposalOwner',
							'documentAuthor',
							'meetingAttendee',
							'sourceUploader',
							'unknown'
						]
					},
					name: { type: ['string', 'null'] },
					email: { type: ['string', 'null'] },
					role: { type: ['string', 'null'] },
					organization: { type: ['string', 'null'] },
					confidence: { type: 'number', minimum: 0, maximum: 1 },
					reason: { type: 'string' }
				}
			}
		},
		cautions: { type: 'array', maxItems: 6, items: { type: 'string' } },
		missingContext: { type: 'array', maxItems: 4, items: { type: 'string' } },
		suggestedContextNeedKinds: {
			type: 'array',
			maxItems: 8,
			items: {
				type: 'string',
				enum: [
					'clientConcern',
					'pitchContext',
					'renewalRisk',
					'implementationRisk',
					'decisionCriteria',
					'stakeholderContext',
					'pricingContext',
					'timelineContext',
					'other'
				]
			}
		}
	}
} as const;

export async function extractEvidenceWithOpenAI({
	apiKey,
	fileName,
	text
}: OpenAIEvidenceExtractionInput): Promise<ExtractedEvidence> {
	const response = await fetch(OPENAI_RESPONSES_URL, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: OPENAI_EVIDENCE_EXTRACTION_MODEL,
			reasoning: {
				effort: OPENAI_EVIDENCE_EXTRACTION_REASONING_EFFORT
			},
			input: [
				{
					role: 'system',
					content: [{ type: 'input_text', text: EXTRACTION_SYSTEM_PROMPT }]
				},
				{
					role: 'user',
					content: [
						{
							type: 'input_text',
							text: `File name: ${fileName}\n\nSource text:\n${text}`
						}
					]
				}
			],
			text: {
				format: {
					type: 'json_schema',
					name: 'source_ranking_evidence_extraction',
					strict: true,
					schema: EXTRACTED_EVIDENCE_JSON_SCHEMA
				}
			}
		})
	});

	const payload = await response.json().catch(() => null);

	if (!response.ok) {
		const message = getOpenAIErrorMessage(payload) ?? `OpenAI extraction failed with status ${response.status}.`;
		throw new Error(message);
	}

	const outputText = getOpenAIOutputText(payload);

	if (!outputText) {
		throw new Error('OpenAI extraction returned no structured output.');
	}

	return normalizeExtractedEvidence(JSON.parse(outputText));
}

function getOpenAIOutputText(payload: unknown) {
	if (!isRecord(payload)) {
		return null;
	}

	if (typeof payload.output_text === 'string') {
		return payload.output_text;
	}

	if (!Array.isArray(payload.output)) {
		return null;
	}

	for (const item of payload.output) {
		if (!isRecord(item) || !Array.isArray(item.content)) {
			continue;
		}

		for (const content of item.content) {
			if (isRecord(content) && typeof content.text === 'string') {
				return content.text;
			}
		}
	}

	return null;
}

function getOpenAIErrorMessage(payload: unknown) {
	if (!isRecord(payload) || !isRecord(payload.error)) {
		return null;
	}

	return typeof payload.error.message === 'string' ? payload.error.message : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
