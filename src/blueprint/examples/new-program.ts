import type { BringTheFirmExamples } from './types';

export const newProgramExamples = {
	slug: 'new-program',
	description:
		"Examples for firms where Bring the firm is new, informal, or not yet trusted by relationship owners.",
	// The AI sometimes uses this text more literally than it should, so write it as user-facing question copy.
	questionGuidance:
		'When people are still getting used to this motion, what would make a recommendation feel worth acting on?',
	examples: [
		{
			slug: 'executive-sponsorship',
			description:
				'Uses leadership sponsorship carefully, while still leaving the relationship owner in control.',
			matchSignals: ['new program', 'leadership sponsorship', 'upcoming client meeting'],
			emailDraft: {
				to: ['Relationship owner'],
				cc: [],
				attachment: null,
				body: [
					{
						type: 'paragraph',
						text: 'Ahead of your Tuesday meeting with Liam Taylor at Allianz, one colleague may be worth considering. Ajay Agrawal has recent carrier AI modernization work and can help frame where claims automation budgets are moving.'
					},
					{
						type: 'bullets',
						items: [
							'Suggested ask: I can check whether Ajay has 15 minutes Monday to brief you first.',
							'Positioning: Nicolas and the leadership team are encouraging these expert matches, but no client intro unless you think it fits.'
						]
					}
				]
			}
		},
		{
			slug: 'similar-client-proof',
			description:
				'Uses a similar-client proof point to make the recommendation credible without sounding like a sales pitch.',
			matchSignals: ['similar client work', 'sector relevance', 'client issue'],
			emailDraft: {
				to: ['Account lead'],
				cc: [],
				attachment: null,
				body: [
					{
						type: 'paragraph',
						text: "For the Medtronic margin discussion, Laura Stein may be a useful internal first call. She led a pricing redesign for another global medtech client with similar distributor pressure."
					},
					{
						type: 'paragraph',
						text: 'Suggested ask: a short prep call with you, then you can decide whether her experience belongs in the client conversation. She can keep the reference at the pattern level and avoid client-specific details.'
					}
				]
			}
		},
		{
			slug: 'industry-trend-signal',
			description:
				'Turns a timely market or regulatory signal into a low-pressure colleague recommendation.',
			matchSignals: ['recent client news', 'industry trend', 'thought leadership'],
			emailDraft: {
				to: ['Relationship owner'],
				cc: [],
				attachment: null,
				body: [
					{
						type: 'paragraph',
						text: "With new EU reporting rules likely to affect AXA's operating model work, Chen Moreau may be worth a quiet internal check. He has been helping insurers translate reporting changes into finance and risk-roadmap decisions."
					},
					{
						type: 'paragraph',
						text: 'Suggested ask: have Chen send you a two-line implication note before you decide whether to bring him into the next client touchpoint.'
					}
				]
			}
		},
		{
			slug: 'multi-option-recommendation',
			description:
				'Gives the relationship owner two distinct angles without overwhelming them or implying both should be used.',
			matchSignals: ['multiple plausible experts', 'uncertain client agenda', 'relationship owner choice'],
			emailDraft: {
				to: ['Relationship owner'],
				cc: [],
				attachment: null,
				body: [
					{
						type: 'paragraph',
						text: "For Thursday's Allianz growth review, there are two possible angles depending on where you want to steer the conversation."
					},
					{
						type: 'bullets',
						items: [
							'Priya Nair for pricing analytics, if Liam focuses on margin leakage.',
							'Ben Wallace for salesforce incentives, if the discussion moves toward advisor productivity.'
						]
					},
					{
						type: 'paragraph',
						text: 'I would start with one angle, not both. Happy to check availability quietly before anyone is copied.'
					}
				]
			}
		}
	]
} satisfies BringTheFirmExamples;
