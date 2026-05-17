import type { BringTheFirmExamples } from './types';

export const availabilityFirstExamples = {
	slug: 'availability-first',
	description:
		'Examples for firms that want availability or colleague readiness checked before recommending someone externally.',
	questionGuidance:
		'Should the note only include people whose time is already confirmed, or can it suggest a quiet check first?',
	examples: [
		{
			slug: 'senior-expert-availability-check',
			description:
				'Names a senior expert only with a clear availability caveat and an internal-first next step.',
			matchSignals: ['senior expert', 'board-level issue', 'availability unknown'],
			emailDraft: {
				to: ['Relationship owner'],
				cc: [],
				attachment: null,
				body: [
					{
						type: 'paragraph',
						text: 'A senior cyber voice could help if the Zurich board discussion turns toward operating-model risk. Omar Haddad is the strongest fit, but I would not assume his availability.'
					},
					{
						type: 'paragraph',
						text: 'Suggested ask: I can check whether Omar has time for a short internal prep call next week. If not, we should not mention him to the client.'
					}
				]
			}
		},
		{
			slug: 'more-available-alternative',
			description:
				'Offers a credible, more available colleague when the highest-profile expert may be constrained.',
			matchSignals: ['availability constraint', 'junior expert', 'similar work', 'faster response'],
			emailDraft: {
				to: ['Relationship owner'],
				cc: [],
				attachment: null,
				body: [
					{
						type: 'paragraph',
						text: 'If Omar is too constrained for the Zurich discussion, Lina Park may be the better first call. She led the working team on two recent cyber operating-model projects and has time Thursday.'
					},
					{
						type: 'paragraph',
						text: 'Suggested ask: a 20-minute prep with Lina first. You can decide after that whether a senior sponsor is still needed.'
					}
				]
			}
		},
		{
			slug: 'confirm-before-client-intro',
			description:
				'Keeps the recommendation internal until availability, relevance, and relationship sensitivities are checked.',
			matchSignals: ['client meeting', 'availability policy', 'relationship sensitivity'],
			emailDraft: {
				to: ['Client relationship partner'],
				cc: [],
				attachment: null,
				body: [
					{
						type: 'paragraph',
						text: "Chen Moreau looks relevant for AXA's EU reporting questions, but I would confirm fit and availability before suggesting anything outside the firm."
					},
					{
						type: 'bullets',
						items: [
							'First step: ask Chen for a two-line view on the client issue and whether he has time this week.',
							'Second step: only if you like the angle, decide whether to introduce him or use his input yourself.'
						]
					}
				]
			}
		}
	]
} satisfies BringTheFirmExamples;
