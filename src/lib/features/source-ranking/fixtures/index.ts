import type { EvidenceFixture } from '$domain/source-ranking';

const ACME = { id: 'client-acme', name: 'Acme Manufacturing' };
const NORTHSTAR = { id: 'client-northstar', name: 'Northstar Bank' };
const HAVEN = { id: 'client-haven', name: 'Haven Health' };
const ALDER = { id: 'client-alder', name: 'Alder Insurance' };
const LUMEN = { id: 'client-lumen', name: 'Lumen Legal' };
const COBALT = { id: 'client-cobalt', name: 'Cobalt Analytics' };
const REDWOOD = { id: 'client-redwood', name: 'Redwood Consulting' };

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

const marcusOpportunityOwner = {
	id: 'owner-marcus-lee',
	name: 'Marcus Lee',
	email: 'marcus.lee@example.com',
	role: 'Opportunity owner',
	organization: 'Overbase'
};

const ninaMeetingAttendee = {
	id: 'owner-nina-patel',
	name: 'Nina Patel',
	email: 'nina.patel@example.com',
	role: 'Solutions lead',
	organization: 'Overbase'
};

const theoDocumentAuthor = {
	id: 'owner-theo-martin',
	name: 'Theo Martin',
	email: 'theo.martin@example.com',
	role: 'Research lead',
	organization: 'Overbase'
};

const julesSourceUploader = {
	id: 'owner-jules-kim',
	name: 'Jules Kim',
	email: 'jules.kim@example.com',
	role: 'Partner operations',
	organization: 'Overbase'
};

export const sourceRankingFixtures: readonly EvidenceFixture[] = [
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
			},
			automationDecision: 'autoHandoff',
			primarySourceIds: ['source-acme-crm-note-june'],
			likelyOwnerIds: ['owner-sarah-chen'],
			validatedClaimIds: ['claim-acme-q3-implementation-window', 'claim-acme-timeline-context'],
			weakClaimIds: [],
			notes: ['Fresh same-opportunity CRM note can support confident handoff.']
		}
	},
	{
		id: 'strong-opportunity-owner-note',
		title: 'Strong: opportunity owner confirms decision criteria',
		description:
			'A current opportunity note directly answers the context need and identifies the owner.',
		contextNeed: {
			id: 'need-alder-decision-criteria',
			kind: 'decisionCriteria',
			label: 'Alder decision criteria',
			description: 'Identify the active buying criteria before the executive handoff.',
			client: ALDER,
			opportunity: { id: 'opp-alder-exec-handoff', name: 'Alder executive handoff' },
			requiredClaimKinds: ['decisionFeedback', 'stakeholderContext'],
			sensitivity: 'low'
		},
		sources: [
			{
				id: 'source-alder-opportunity-note',
				kind: 'opportunityNote',
				title: 'Opportunity note: Alder committee criteria',
				summary:
					'Opportunity owner confirmed the buying committee cares most about implementation timeline and executive reporting.',
				createdAt: Date.parse('2026-06-18T16:00:00Z'),
				updatedAt: Date.parse('2026-06-18T16:00:00Z'),
				client: ALDER,
				opportunity: { id: 'opp-alder-exec-handoff', name: 'Alder executive handoff' },
				createdBy: marcusOpportunityOwner,
				ownerSignals: [
					{
						kind: 'opportunityOwner',
						confidence: 0.96,
						reason: 'The note came from the active opportunity owner.',
						owner: marcusOpportunityOwner
					}
				],
				claims: [
					{
						id: 'claim-alder-buying-criteria',
						kind: 'decisionFeedback',
						text: 'Alder buying committee prioritizes implementation timeline and executive reporting.',
						support: 'direct',
						sensitivity: 'low'
					},
					{
						id: 'claim-alder-committee-context',
						kind: 'stakeholderContext',
						text: 'The active buying committee is engaged through the executive reporting workstream.',
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
				'source-alder-opportunity-note': 'strong'
			},
			automationDecision: 'autoHandoff',
			primarySourceIds: ['source-alder-opportunity-note'],
			likelyOwnerIds: ['owner-marcus-lee'],
			validatedClaimIds: ['claim-alder-buying-criteria', 'claim-alder-committee-context'],
			weakClaimIds: [],
			notes: ['Current opportunity owner note is strong enough for automation.']
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
			},
			automationDecision: 'generateContextRequest',
			primarySourceIds: ['source-northstar-proposal-2024'],
			likelyOwnerIds: ['owner-priya-shah'],
			validatedClaimIds: ['claim-northstar-discount-rationale'],
			weakClaimIds: ['claim-northstar-procurement-feedback'],
			contextRequestOwnerId: 'owner-priya-shah',
			notes: ['Useful stale proposal should be validated by the prior proposal owner.']
		}
	},
	{
		id: 'corroborated-acme-client-concern',
		title: 'Corroborated: meeting notes and proposal feedback support the same concern',
		description:
			'Multiple same-opportunity sources independently support the same Acme implementation concern.',
		contextNeed: {
			id: 'need-acme-corroborated-client-concern',
			kind: 'clientConcern',
			label: 'Acme corroborated client concern',
			description:
				'Confirm whether implementation readiness is a reliable concern to include in the handoff.',
			client: ACME,
			opportunity: { id: 'opp-acme-platform-rollout', name: 'Platform rollout pitch' },
			requiredClaimKinds: ['clientConcern', 'implementationRisk'],
			sensitivity: 'low'
		},
		sources: [
			{
				id: 'source-acme-meeting-notes-readiness',
				kind: 'meeting',
				title: 'Acme stakeholder meeting notes: readiness risk',
				summary:
					'Meeting notes say Acme asked for a rollout-readiness plan before approving the next step.',
				createdAt: Date.parse('2026-06-17T17:00:00Z'),
				updatedAt: Date.parse('2026-06-17T17:30:00Z'),
				client: ACME,
				opportunity: { id: 'opp-acme-platform-rollout', name: 'Platform rollout pitch' },
				createdBy: ninaMeetingAttendee,
				ownerSignals: [
					{
						kind: 'meetingAttendee',
						confidence: 0.86,
						reason: 'The solutions lead attended the stakeholder meeting and wrote the notes.',
						owner: ninaMeetingAttendee
					}
				],
				claims: [
					{
						id: 'claim-acme-readiness-client-concern',
						kind: 'clientConcern',
						text: 'Acme asked for a rollout-readiness plan before approving the next step.',
						support: 'direct',
						sensitivity: 'low'
					},
					{
						id: 'claim-acme-readiness-implementation-risk',
						kind: 'implementationRisk',
						text: 'Acme sees rollout readiness as an implementation risk to resolve before the pitch.',
						support: 'direct',
						sensitivity: 'low'
					}
				],
				sensitivity: 'low'
			},
			{
				id: 'source-acme-proposal-decision-feedback',
				kind: 'proposal',
				title: 'Acme final proposal decision feedback',
				summary:
					'Proposal feedback says Acme wanted rollout-readiness proof and an implementation-risk mitigation section.',
				createdAt: Date.parse('2026-06-11T10:00:00Z'),
				updatedAt: Date.parse('2026-06-13T10:00:00Z'),
				client: ACME,
				opportunity: { id: 'opp-acme-platform-rollout', name: 'Platform rollout pitch' },
				createdBy: priyaProposalOwner,
				ownerSignals: [
					{
						kind: 'proposalOwner',
						confidence: 0.9,
						reason: 'The proposal owner captured final decision feedback.',
						owner: priyaProposalOwner
					}
				],
				claims: [
					{
						id: 'claim-acme-proposal-readiness-concern',
						kind: 'clientConcern',
						text: 'Proposal feedback confirms Acme wanted rollout-readiness proof.',
						support: 'direct',
						sensitivity: 'low'
					},
					{
						id: 'claim-acme-proposal-implementation-risk',
						kind: 'implementationRisk',
						text: 'Proposal feedback confirms implementation-risk mitigation should be mentioned.',
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
				'source-acme-meeting-notes-readiness': 'strong',
				'source-acme-proposal-decision-feedback': 'strong'
			},
			automationDecision: 'autoHandoff',
			primarySourceIds: ['source-acme-meeting-notes-readiness', 'source-acme-proposal-decision-feedback'],
			likelyOwnerIds: ['owner-priya-shah', 'owner-nina-patel'],
			validatedClaimIds: [
				'claim-acme-readiness-client-concern',
				'claim-acme-readiness-implementation-risk',
				'claim-acme-proposal-readiness-concern',
				'claim-acme-proposal-implementation-risk'
			],
			weakClaimIds: [],
			corroboratedClaimKinds: ['clientConcern', 'implementationRisk'],
			notes: ['Two current same-opportunity sources corroborate the same implementation concern.']
		}
	},
	{
		id: 'conflict-acme-timeline-risk',
		title: 'Conflict: current note contradicts stale proposal timeline risk',
		description:
			'A fresh CRM note says timeline risk is resolved, while an older proposal says timeline was a blocker.',
		contextNeed: {
			id: 'need-acme-conflicting-timeline-risk',
			kind: 'implementationRisk',
			label: 'Acme conflicting timeline risk',
			description: 'Determine whether timeline risk is safe to mention in a handoff.',
			client: ACME,
			opportunity: { id: 'opp-acme-platform-rollout', name: 'Platform rollout pitch' },
			requiredClaimKinds: ['implementationRisk'],
			sensitivity: 'medium'
		},
		sources: [
			{
				id: 'source-acme-current-risk-cleared-note',
				kind: 'crmNote',
				title: 'Current CRM note: timeline risk cleared',
				summary:
					'Account owner says Acme accepted the updated rollout timeline and no longer treats timing as the blocker.',
				createdAt: Date.parse('2026-06-19T12:00:00Z'),
				updatedAt: Date.parse('2026-06-19T12:00:00Z'),
				client: ACME,
				opportunity: { id: 'opp-acme-platform-rollout', name: 'Platform rollout pitch' },
				createdBy: sarahAccountOwner,
				ownerSignals: [
					{
						kind: 'accountOwner',
						confidence: 0.94,
						reason: 'The current account owner says the old timeline risk is cleared.',
						owner: sarahAccountOwner
					}
				],
				claims: [
					{
						id: 'claim-acme-current-timeline-risk-cleared',
						kind: 'implementationRisk',
						text: 'Timeline risk should not be stated as active because Acme accepted the updated rollout timeline.',
						support: 'direct',
						stance: 'contradicts',
						sensitivity: 'low'
					}
				],
				sensitivity: 'low'
			},
			{
				id: 'source-acme-old-proposal-timeline-risk',
				kind: 'proposal',
				title: 'Older Acme proposal: timeline risk section',
				summary:
					'Older proposal says implementation timeline was a major concern during a prior proposal round.',
				createdAt: Date.parse('2025-06-10T10:00:00Z'),
				updatedAt: Date.parse('2025-06-10T10:00:00Z'),
				client: ACME,
				opportunity: { id: 'opp-acme-prior-proposal', name: 'Acme prior proposal' },
				createdBy: priyaProposalOwner,
				ownerSignals: [
					{
						kind: 'proposalOwner',
						confidence: 0.82,
						reason: 'The prior proposal owner can explain the old timeline-risk context.',
						owner: priyaProposalOwner
					}
				],
				claims: [
					{
						id: 'claim-acme-old-proposal-timeline-risk',
						kind: 'implementationRisk',
						text: 'Timeline risk was a major concern in the older Acme proposal.',
						support: 'direct',
						sensitivity: 'medium'
					}
				],
				sensitivity: 'medium'
			}
		],
		expected: {
			strongestTier: 'strong',
			sourceTiers: {
				'source-acme-current-risk-cleared-note': 'strong',
				'source-acme-old-proposal-timeline-risk': 'medium'
			},
			automationDecision: 'autoHandoff',
			primarySourceIds: ['source-acme-current-risk-cleared-note'],
			likelyOwnerIds: ['owner-sarah-chen', 'owner-priya-shah'],
			validatedClaimIds: ['claim-acme-current-timeline-risk-cleared'],
			weakClaimIds: [],
			conflictingClaimKinds: ['implementationRisk'],
			notes: ['Fresh account-owner context can override older stale proposal context.']
		}
	},
	{
		id: 'medium-meeting-title-with-owner',
		title: 'Medium: meeting title suggests context but needs notes',
		description:
			'A fresh same-opportunity meeting points to a likely owner but has only weak context detail.',
		contextNeed: {
			id: 'need-lumen-implementation-follow-up',
			kind: 'implementationRisk',
			label: 'Lumen implementation follow-up',
			description: 'Find whether implementation follow-up is needed before sending the handoff.',
			client: LUMEN,
			opportunity: { id: 'opp-lumen-rollout', name: 'Lumen rollout advisory' },
			requiredClaimKinds: ['implementationRisk'],
			sensitivity: 'low'
		},
		sources: [
			{
				id: 'source-lumen-calendar-title',
				kind: 'meeting',
				title: 'Implementation risk sync with Lumen sponsor',
				summary:
					'Calendar title indicates implementation risk was discussed, but there are no meeting notes.',
				createdAt: Date.parse('2026-06-20T14:00:00Z'),
				updatedAt: Date.parse('2026-06-20T14:00:00Z'),
				client: LUMEN,
				opportunity: { id: 'opp-lumen-rollout', name: 'Lumen rollout advisory' },
				createdBy: ninaMeetingAttendee,
				ownerSignals: [
					{
						kind: 'meetingAttendee',
						confidence: 0.75,
						reason: 'A solutions lead attended the meeting and can validate what was discussed.',
						owner: ninaMeetingAttendee
					}
				],
				claims: [
					{
						id: 'claim-lumen-implementation-risk-title',
						kind: 'implementationRisk',
						text: 'The calendar title suggests implementation risk may be active.',
						support: 'weak',
						sensitivity: 'low'
					}
				],
				sensitivity: 'low'
			}
		],
		expected: {
			strongestTier: 'medium',
			sourceTiers: {
				'source-lumen-calendar-title': 'medium'
			},
			automationDecision: 'generateContextRequest',
			primarySourceIds: ['source-lumen-calendar-title'],
			likelyOwnerIds: ['owner-nina-patel'],
			validatedClaimIds: [],
			weakClaimIds: ['claim-lumen-implementation-risk-title'],
			contextRequestOwnerId: 'owner-nina-patel',
			notes: ['Meeting title is fresh and direct but too thin to use without validation.']
		}
	},
	{
		id: 'medium-customer-email-partial-context',
		title: 'Medium: customer email has partial stakeholder context',
		description:
			'A recent customer email is direct and specific, but it only answers part of the context need.',
		contextNeed: {
			id: 'need-cobalt-stakeholder-decision-context',
			kind: 'stakeholderContext',
			label: 'Cobalt stakeholder and decision context',
			description:
				'Identify the likely stakeholder and whether there is enough decision context for a handoff.',
			client: COBALT,
			requiredClaimKinds: ['stakeholderContext', 'decisionFeedback'],
			sensitivity: 'medium'
		},
		sources: [
			{
				id: 'source-cobalt-customer-email',
				kind: 'email',
				title: 'Email from Cobalt VP asking for the risk summary',
				summary:
					'Customer VP asked for a risk summary but did not state the decision criteria explicitly.',
				createdAt: Date.parse('2026-06-12T09:00:00Z'),
				updatedAt: Date.parse('2026-06-12T09:00:00Z'),
				client: COBALT,
				createdBy: sarahAccountOwner,
				ownerSignals: [
					{
						kind: 'accountOwner',
						confidence: 0.8,
						reason: 'Account owner forwarded the customer email and can validate the decision context.',
						owner: sarahAccountOwner
					}
				],
				claims: [
					{
						id: 'claim-cobalt-vp-stakeholder',
						kind: 'stakeholderContext',
						text: 'Cobalt VP is actively engaged and requested a risk summary.',
						support: 'direct',
						sensitivity: 'medium'
					},
					{
						id: 'claim-cobalt-decision-context-missing',
						kind: 'decisionFeedback',
						text: 'The email implies decision context matters, but does not state the decision criteria.',
						support: 'weak',
						sensitivity: 'medium'
					}
				],
				sensitivity: 'medium'
			}
		],
		expected: {
			strongestTier: 'medium',
			sourceTiers: {
				'source-cobalt-customer-email': 'medium'
			},
			automationDecision: 'generateContextRequest',
			primarySourceIds: ['source-cobalt-customer-email'],
			likelyOwnerIds: ['owner-sarah-chen'],
			validatedClaimIds: ['claim-cobalt-vp-stakeholder'],
			weakClaimIds: ['claim-cobalt-decision-context-missing'],
			contextRequestOwnerId: 'owner-sarah-chen',
			notes: ['Direct customer email is useful but missing decision feedback.']
		}
	},
	{
		id: 'medium-account-note-adjacent-work',
		title: 'Medium: same-client adjacent account note',
		description:
			'Same-client adjacent work is useful but should be validated before use in the current opportunity.',
		contextNeed: {
			id: 'need-redwood-client-concern',
			kind: 'clientConcern',
			label: 'Redwood client concern',
			description: 'Understand the main current concern before sending a partner handoff.',
			client: REDWOOD,
			opportunity: { id: 'opp-redwood-partner-handoff', name: 'Redwood partner handoff' },
			requiredClaimKinds: ['clientConcern', 'timelineContext'],
			sensitivity: 'low'
		},
		sources: [
			{
				id: 'source-redwood-adjacent-account-note',
				kind: 'accountNote',
				title: 'Account note from Redwood onboarding project',
				summary:
					'Prior onboarding project noted concern around client-side data readiness.',
				createdAt: Date.parse('2026-01-10T11:00:00Z'),
				updatedAt: Date.parse('2026-01-10T11:00:00Z'),
				client: REDWOOD,
				opportunity: { id: 'opp-redwood-onboarding', name: 'Redwood onboarding' },
				createdBy: sarahAccountOwner,
				ownerSignals: [
					{
						kind: 'accountOwner',
						confidence: 0.88,
						reason: 'Account owner wrote the adjacent work note.',
						owner: sarahAccountOwner
					}
				],
				claims: [
					{
						id: 'claim-redwood-data-readiness-concern',
						kind: 'clientConcern',
						text: 'Redwood previously worried about client-side data readiness.',
						support: 'direct',
						sensitivity: 'low'
					},
					{
						id: 'claim-redwood-readiness-timeline',
						kind: 'timelineContext',
						text: 'The old readiness concern may affect timeline, but the current timeline is not confirmed.',
						support: 'weak',
						sensitivity: 'low'
					}
				],
				sensitivity: 'low'
			}
		],
		expected: {
			strongestTier: 'medium',
			sourceTiers: {
				'source-redwood-adjacent-account-note': 'medium'
			},
			automationDecision: 'generateContextRequest',
			primarySourceIds: ['source-redwood-adjacent-account-note'],
			likelyOwnerIds: ['owner-sarah-chen'],
			validatedClaimIds: ['claim-redwood-data-readiness-concern'],
			weakClaimIds: ['claim-redwood-readiness-timeline'],
			contextRequestOwnerId: 'owner-sarah-chen',
			notes: ['Same-client adjacent work needs confirmation for the current opportunity.']
		}
	},
	{
		id: 'weak-similar-client-proposal',
		title: 'Weak: stale similar-client proposal',
		description:
			'A stale similar-client proposal should not be used confidently for same-client handoff context.',
		contextNeed: {
			id: 'need-alder-renewal-risk',
			kind: 'renewalRisk',
			label: 'Alder renewal risk',
			description: 'Determine whether renewal risk should be mentioned in the handoff.',
			client: ALDER,
			requiredClaimKinds: ['renewalRisk', 'pricingContext'],
			sensitivity: 'medium'
		},
		sources: [
			{
				id: 'source-northstar-similar-proposal-2023',
				kind: 'proposal',
				title: 'Northstar similar-client renewal proposal',
				summary:
					'Old finance renewal proposal included pricing-risk framing that may be directionally similar.',
				createdAt: Date.parse('2023-08-01T09:00:00Z'),
				updatedAt: Date.parse('2023-08-01T09:00:00Z'),
				client: NORTHSTAR,
				ownerSignals: [
					{
						kind: 'sourceUploader',
						confidence: 0.4,
						reason: 'Uploader can identify where the source came from, but cannot validate Alder context.',
						owner: julesSourceUploader
					}
				],
				claims: [
					{
						id: 'claim-alder-directional-renewal-risk',
						kind: 'renewalRisk',
						text: 'Similar finance clients sometimes framed renewal risk around budget ownership.',
						support: 'inferred',
						sensitivity: 'medium'
					},
					{
						id: 'claim-alder-directional-pricing-context',
						kind: 'pricingContext',
						text: 'Similar-client proposal suggests pricing context may matter, but not for Alder directly.',
						support: 'weak',
						sensitivity: 'medium'
					}
				],
				sensitivity: 'medium'
			}
		],
		expected: {
			strongestTier: 'weak',
			sourceTiers: {
				'source-northstar-similar-proposal-2023': 'weak'
			},
			automationDecision: 'needsUserReview',
			primarySourceIds: ['source-northstar-similar-proposal-2023'],
			likelyOwnerIds: ['owner-jules-kim'],
			validatedClaimIds: [],
			weakClaimIds: ['claim-alder-directional-renewal-risk', 'claim-alder-directional-pricing-context'],
			reviewPromptKind: 'similarClientMatch',
			notes: ['Similar-client proposal can only be used directionally if the user approves.']
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
			},
			automationDecision: 'blocked',
			primarySourceIds: [],
			likelyOwnerIds: [],
			validatedClaimIds: [],
			weakClaimIds: ['claim-haven-executive-sponsor'],
			blockedReason: 'Sensitive partner material is stale and has no reliable owner for validation.',
			notes: ['No reliable path forward without a validator.']
		}
	},
	{
		id: 'blocked-generic-deck-no-owner',
		title: 'Blocked: generic deck has no owner or reliable path',
		description:
			'A stale generic deck cannot support a current client-specific handoff and has no owner signal.',
		contextNeed: {
			id: 'need-haven-decision-criteria',
			kind: 'decisionCriteria',
			label: 'Haven decision criteria',
			description: 'Determine the current decision criteria for a client-specific handoff.',
			client: HAVEN,
			requiredClaimKinds: ['decisionFeedback'],
			sensitivity: 'medium'
		},
		sources: [
			{
				id: 'source-generic-transformation-deck-2022',
				kind: 'deck',
				title: 'Generic digital transformation deck',
				summary:
					'Generic deck says buyers care about transformation velocity, with no Haven-specific details.',
				createdAt: Date.parse('2022-09-14T12:00:00Z'),
				updatedAt: Date.parse('2022-09-14T12:00:00Z'),
				ownerSignals: [
					{
						kind: 'unknown',
						confidence: 0,
						reason: 'The deck has no owner or client-specific provenance.'
					}
				],
				claims: [
					{
						id: 'claim-generic-transformation-velocity',
						kind: 'decisionFeedback',
						text: 'Buyers often care about transformation velocity.',
						support: 'weak',
						sensitivity: 'medium'
					}
				],
				sensitivity: 'medium'
			}
		],
		expected: {
			strongestTier: 'weak',
			sourceTiers: {
				'source-generic-transformation-deck-2022': 'weak'
			},
			automationDecision: 'blocked',
			primarySourceIds: [],
			likelyOwnerIds: [],
			validatedClaimIds: [],
			weakClaimIds: ['claim-generic-transformation-velocity'],
			blockedReason: 'Generic stale deck is not client-specific and has no owner to validate it.',
			notes: ['The system should not send anything automatically from this evidence.']
		}
	},
	{
		id: 'needs-review-document-unclear-owner',
		title: 'Needs review: useful document but unclear owner',
		description:
			'A useful same-client document contains likely context but lacks a current owner and has inferred claims.',
		contextNeed: {
			id: 'need-cobalt-implementation-and-decision-context',
			kind: 'implementationRisk',
			label: 'Cobalt implementation and decision context',
			description:
				'Check whether implementation risk and decision context are safe to mention in the handoff.',
			client: COBALT,
			requiredClaimKinds: ['implementationRisk', 'decisionFeedback'],
			sensitivity: 'medium'
		},
		sources: [
			{
				id: 'source-cobalt-research-document',
				kind: 'document',
				title: 'Cobalt discovery research notes',
				summary:
					'Research notes mention rollout dependency and possible committee review, but ownership is unclear.',
				createdAt: Date.parse('2026-04-02T13:00:00Z'),
				updatedAt: Date.parse('2026-04-05T13:00:00Z'),
				client: COBALT,
				createdBy: theoDocumentAuthor,
				ownerSignals: [
					{
						kind: 'documentAuthor',
						confidence: 0.5,
						reason: 'The document author can explain the notes but is not clearly the current owner.',
						owner: theoDocumentAuthor
					}
				],
				claims: [
					{
						id: 'claim-cobalt-rollout-dependency',
						kind: 'implementationRisk',
						text: 'Cobalt rollout may depend on data-migration readiness.',
						support: 'inferred',
						sensitivity: 'medium'
					},
					{
						id: 'claim-cobalt-committee-review',
						kind: 'decisionFeedback',
						text: 'Committee review may be needed before the handoff claim is safe.',
						support: 'weak',
						sensitivity: 'medium'
					}
				],
				sensitivity: 'medium'
			}
		],
		expected: {
			strongestTier: 'medium',
			sourceTiers: {
				'source-cobalt-research-document': 'medium'
			},
			automationDecision: 'needsUserReview',
			primarySourceIds: ['source-cobalt-research-document'],
			likelyOwnerIds: ['owner-theo-martin'],
			validatedClaimIds: [],
			weakClaimIds: ['claim-cobalt-rollout-dependency', 'claim-cobalt-committee-review'],
			reviewPromptKind: 'unclearOwner',
			notes: ['Same-client document is useful, but the owner and claims need user resolution.']
		}
	}
];
