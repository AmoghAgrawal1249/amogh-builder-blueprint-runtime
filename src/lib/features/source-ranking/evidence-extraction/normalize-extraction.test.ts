import { describe, expect, it } from 'vitest';
import { assessEvidenceBundle } from '$domain/source-ranking';
import { buildContextSourceFromExtractedEvidence, normalizeExtractedEvidence } from './normalize-extraction';
import type { ExtractedEvidence } from './types';

describe('evidence extraction normalization', () => {
	it('filters invalid fields and clamps owner confidence', () => {
		const extracted = normalizeExtractedEvidence({
			claims: [
				{
					kind: 'pricingContext',
					text: 'Pricing is only historical context.',
					support: 'unsupported-value',
					stance: 'unsupported-stance',
					sensitivity: 'unsupported-sensitivity',
					requiresValidation: true,
					reason: 'Needs finance confirmation.'
				},
				{
					kind: 'implementationRisk',
					text: '',
					support: 'direct',
					stance: 'supports',
					sensitivity: 'low',
					requiresValidation: false,
					reason: 'Blank text should be removed.'
				}
			],
			ownerSignals: [
				{
					kind: 'proposalOwner',
					name: 'Priya Shah',
					email: 'priya@example.com',
					role: 'Proposal owner',
					organization: null,
					confidence: 4.2,
					reason: 'Can validate old proposal context.'
				},
				{
					kind: 'unknown',
					name: 'No reason',
					confidence: 0.5,
					reason: ''
				}
			],
			cautions: [' Do not state as current. '],
			missingContext: [' Finance confirmation '],
			suggestedContextNeedKinds: ['pricingContext', 'invalidKind']
		});

		expect(extracted.claims).toHaveLength(1);
		expect(extracted.claims[0]).toMatchObject({
			kind: 'pricingContext',
			support: 'weak',
			stance: 'none',
			sensitivity: 'medium',
			requiresValidation: true
		});
		expect(extracted.ownerSignals).toHaveLength(1);
		expect(extracted.ownerSignals[0]?.confidence).toBe(1);
		expect(extracted.cautions).toEqual(['Do not state as current.']);
		expect(extracted.missingContext).toEqual(['Finance confirmation']);
		expect(extracted.suggestedContextNeedKinds).toEqual(['pricingContext']);
	});

	it('builds an AI extracted source with cautions, missing context, and owner signals', () => {
		const extracted: ExtractedEvidence = {
			claims: [
				{
					kind: 'pricingContext',
					text: 'Old proposal mentioned pricing concerns, but current relevance is uncertain.',
					support: 'weak',
					stance: 'supports',
					sensitivity: 'medium',
					requiresValidation: true,
					reason: 'The email says not to state pricing as the main blocker unless Finance confirms.'
				},
				{
					kind: 'implementationRisk',
					text: 'Implementation timeline was raised twice in recent customer emails.',
					support: 'direct',
					stance: 'supports',
					sensitivity: 'low',
					requiresValidation: false,
					reason: 'The email states this as current context.'
				},
				{
					kind: 'pricingContext',
					text: 'Do not state pricing is the main blocker without Finance confirmation.',
					support: 'direct',
					stance: 'contradicts',
					sensitivity: 'medium',
					requiresValidation: true,
					reason: 'The source explicitly cautions against this claim.'
				}
			],
			ownerSignals: [
				{
					kind: 'proposalOwner',
					name: 'Priya Shah',
					email: 'priya.shah@example.com',
					role: 'Proposal owner',
					organization: 'Overbase',
					confidence: 0.76,
					reason: 'Forwarded the stale proposal context and can validate it.'
				}
			],
			cautions: ['Do not state pricing is the main blocker unless Finance confirms.'],
			missingContext: ['Finance Ops confirmation that discount context is current.'],
			suggestedContextNeedKinds: ['implementationRisk', 'timelineContext', 'pricingContext']
		};
		const source = buildContextSourceFromExtractedEvidence({
			id: 'uploaded-1-northstar-renewal-thread',
			fileName: 'northstar-renewal-thread.eml',
			text: 'Old proposal says pricing, but recent emails focus on implementation timeline.',
			lastModified: Date.parse('2026-06-20T12:00:00Z'),
			extracted
		});

		expect(source.extractionKind).toBe('ai');
		expect(source.kind).toBe('email');
		expect(source.client?.id).toBe('client-uploaded');
		expect(source.cautions).toEqual([
			'Do not state pricing is the main blocker unless Finance confirms.'
		]);
		expect(source.missingContext).toEqual([
			'Finance Ops confirmation that discount context is current.'
		]);
		expect(source.ownerSignals[0]?.owner?.name).toBe('Priya Shah');
		expect(source.claims).toHaveLength(3);
		expect(source.claims.find((claim) => claim.kind === 'implementationRisk')?.support).toBe('direct');
		expect(source.claims.find((claim) => claim.kind === 'pricingContext')?.requiresValidation).toBe(true);
		expect(source.claims.some((claim) => claim.stance === 'contradicts')).toBe(true);
	});

	it('falls back to the email sender as an owner signal and avoids weak directness', () => {
		const source = buildContextSourceFromExtractedEvidence({
			id: 'uploaded-1-northstar-renewal-thread',
			fileName: 'northstar-renewal-thread.eml',
			text: 'From: Priya Shah <priya.shah@example.com>\nSubject: Northstar renewal\n\nImplementation timeline is current. Pricing is stale.',
			lastModified: Date.parse('2026-06-20T12:00:00Z'),
			extracted: {
				claims: [
					{
						kind: 'implementationRisk',
						text: 'Implementation timeline is the current active concern.',
						support: 'direct',
						stance: 'supports',
						sensitivity: 'low',
						requiresValidation: false,
						reason: 'The source says implementation timeline is current.'
					}
				],
				ownerSignals: [
					{
						kind: 'unknown',
						name: 'Finance Ops',
						email: null,
						role: null,
						organization: null,
						confidence: 0.8,
						reason: 'Finance Ops can validate pricing, but not implementation timeline.'
					}
				],
				cautions: [],
				missingContext: [],
				suggestedContextNeedKinds: ['implementationRisk']
			}
		});
		const assessment = assessEvidenceBundle({
			bundle: {
				id: 'uploaded-bundle',
				title: 'Uploaded bundle',
				contextNeed: {
					id: 'need-uploaded-context-review',
					kind: 'other',
					label: 'Uploaded review',
					description: 'Evaluate uploaded evidence.',
					client: { id: 'client-uploaded', name: 'Uploaded data' },
					requiredClaimKinds: ['implementationRisk'],
					sensitivity: 'low'
				},
				sources: [source]
			},
			now: Date.parse('2026-06-22T12:00:00Z')
		});

		expect(source.ownerSignals.some((ownerSignal) => ownerSignal.owner?.name === 'Priya Shah')).toBe(true);
		expect(assessment.likelyOwnerSignals.map((ownerSignal) => ownerSignal.owner?.name)).toContain('Priya Shah');
		expect(assessment.sourceAssessments[0]?.scores.confidence.directness).toBeGreaterThanOrEqual(0.8);
		expect(assessment.strongestTier).not.toBe('weak');
	});
});
