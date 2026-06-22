import type { EvidenceFixture } from '$domain/source-ranking';

const ACME = { id: 'client-acme', name: 'Acme Manufacturing' };
const NORTHSTAR = { id: 'client-northstar', name: 'Northstar Bank' };
const HAVEN = { id: 'client-haven', name: 'Haven Health' };

const sarahAccountOwner = {
	id: 'owner-sarah-chen',
	name: 'Sarah Chen',
	email: 'sarah.chen@example.com',
	role: 'Account owner',
	organization: 'Overbase'
};

const priyaProposalOwner = {
	id: 'owner-priya-shah',
	name: 'Priya Shah',
	email: 'priya.shah@example.com',
	role: 'Proposal owner',
	organization: 'Overbase'
};

export const sourceRankingFixtures = [
	{
		id: 'strong-current-account-note',
		title: 'Strong: current account note confirms implementation concern',
		description:
			'A recent same-client CRM note from the account owner directly supports the context need.',
		contextNeed: {
			id: 'need-acme-implementation-concern',
			kind: 'implementationRisk',
			label: 'Acme implementation concern',
			description:
				'Before the upcoming pitch, identify whether implementation timeline is a current client concern.',
			client: ACME,
			opportunity: { id: 'opp-acme-platform-rollout', name: 'Platform rollout pitch' },
			requiredClaimKinds: ['implementationRisk', 'timelineContext'],
			sensitivity: 'low'
		},
		sources: [
			{
				id: 'source-acme-crm-note-june',
				kind: 'crmNote',
				title: 'Account note after Acme stakeholder call',
				summary:
					'Account owner noted that Acme wants confidence the rollout can fit their Q3 implementation window.',
				createdAt: Date.parse('2026-06-14T15:30:00Z'),
				updatedAt: Date.parse('2026-06-14T15:30:00Z'),
				client: ACME,
				opportunity: { id: 'opp-acme-platform-rollout', name: 'Platform rollout pitch' },
				createdBy: sarahAccountOwner,
				ownerSignals: [
					{
						kind: 'accountOwner',
						confidence: 0.95,
						reason: 'The note was created by the current account owner.',
						owner: sarahAccountOwner
					}
				],
				claims: [
					{
						id: 'claim-acme-q3-implementation-window',
						kind: 'implementationRisk',
						text: 'Acme is concerned about whether the rollout can fit their Q3 implementation window.',
						support: 'direct',
						sensitivity: 'low'
					},
					{
						id: 'claim-acme-timeline-context',
						kind: 'timelineContext',
						text: 'The implementation timeline should be addressed before the pitch.',
						support: 'direct',
						sensitivity: 'low'
					}
				],
				sensitivity: 'low'
			}
		],
		expected: {
			strongestTier: 'strong',
			sourceTiers: {
				'source-acme-crm-note-june': 'strong'
			}
		}
	},
	{
		id: 'medium-old-proposal-with-owner',
		title: 'Medium: old proposal has useful detail and a likely owner',
		description:
			'An older same-client proposal contains concrete context, but it needs validation before confident automation.',
		contextNeed: {
			id: 'need-northstar-pricing-context',
			kind: 'pricingContext',
			label: 'Northstar renewal pricing context',
			description:
				'Understand whether prior discount approval is relevant to the current renewal conversation.',
			client: NORTHSTAR,
			opportunity: { id: 'opp-northstar-renewal', name: 'Northstar renewal' },
			requiredClaimKinds: ['pricingContext', 'decisionFeedback'],
			sensitivity: 'medium'
		},
		sources: [
			{
				id: 'source-northstar-proposal-2024',
				kind: 'proposal',
				title: 'Northstar renewal proposal v3',
				summary:
					'Final proposal includes discount rationale and notes that procurement cared about renewal-term flexibility.',
				createdAt: Date.parse('2024-12-05T12:00:00Z'),
				updatedAt: Date.parse('2024-12-09T09:15:00Z'),
				client: NORTHSTAR,
				opportunity: { id: 'opp-northstar-renewal-2024', name: 'Northstar renewal 2024' },
				createdBy: priyaProposalOwner,
				ownerSignals: [
					{
						kind: 'proposalOwner',
						confidence: 0.82,
						reason: 'The final proposal has a clear prior owner who can validate whether it still applies.',
						owner: priyaProposalOwner
					}
				],
				claims: [
					{
						id: 'claim-northstar-discount-rationale',
						kind: 'pricingContext',
						text: 'Northstar previously required discount justification tied to renewal-term flexibility.',
						support: 'direct',
						sensitivity: 'medium'
					},
					{
						id: 'claim-northstar-procurement-feedback',
						kind: 'decisionFeedback',
						text: 'Procurement gave positive feedback when the proposal included flexible renewal terms.',
						support: 'inferred',
						sensitivity: 'medium'
					}
				],
				sensitivity: 'medium'
			}
		],
		expected: {
			strongestTier: 'medium',
			sourceTiers: {
				'source-northstar-proposal-2024': 'medium'
			}
		}
	},
	{
		id: 'weak-sensitive-partner-deck',
		title: 'Weak: sensitive partner deck with unclear owner',
		description:
			'Partner-channel material is stale, indirect, sensitive, and lacks a reliable owner signal.',
		contextNeed: {
			id: 'need-haven-stakeholder-context',
			kind: 'stakeholderContext',
			label: 'Haven stakeholder context',
			description:
				'Determine whether Haven has an active executive sponsor before preparing a context handoff.',
			client: HAVEN,
			requiredClaimKinds: ['stakeholderContext'],
			sensitivity: 'high'
		},
		sources: [
			{
				id: 'source-haven-partner-deck-2023',
				kind: 'partnerMaterial',
				title: 'Partner channel overview: Haven expansion',
				summary:
					'Old partner deck mentions an executive sponsor but does not identify whether the relationship is current.',
				createdAt: Date.parse('2023-11-20T10:00:00Z'),
				updatedAt: Date.parse('2023-11-20T10:00:00Z'),
				client: HAVEN,
				ownerSignals: [
					{
						kind: 'unknown',
						confidence: 0,
						reason: 'The deck has no clear current owner or validator.'
					}
				],
				claims: [
					{
						id: 'claim-haven-executive-sponsor',
						kind: 'stakeholderContext',
						text: 'Haven may have had an executive sponsor through the partner channel.',
						support: 'weak',
						sensitivity: 'high'
					}
				],
				sensitivity: 'high'
			}
		],
		expected: {
			strongestTier: 'weak',
			sourceTiers: {
				'source-haven-partner-deck-2023': 'weak'
			}
		}
	}
] as const satisfies readonly EvidenceFixture[];
