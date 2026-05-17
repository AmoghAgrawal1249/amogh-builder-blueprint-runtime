import type { BringTheFirmExamples } from './types';

export const establishedProgramExamples = {
	slug: 'established-program',
	description:
		'Examples for firms with an active Bring the firm motion where relationship owners need precise, high-signal recommendations.',
	questionGuidance:
		'Should the note point to one colleague, a small cross-practice team, or a relevant solution asset?',
	examples: [
		{
			slug: 'upcoming-meeting-expert',
			description:
				'Links an upcoming client meeting to a colleague with directly relevant expertise and a clear prep step.',
			matchSignals: ['upcoming meeting', 'known agenda', 'functional expertise', 'availability'],
			emailDraft: {
				to: ['Relationship owner'],
				cc: [],
				attachment: null,
				body: [
					{
						type: 'paragraph',
						text: "Ahead of Tuesday's Acme supply-chain review, Daniel Kim may be worth a 15-minute prep call. He just led a supplier-risk diagnostic for another industrials client with a similar tier-two visibility issue."
					},
					{
						type: 'paragraph',
						text: 'Suggested ask: I can check whether Daniel has time Monday to brief you first. No client outreach or intro unless you think the fit is real.'
					}
				]
			}
		},
		{
			slug: 'existing-stakeholder-relationship',
			description:
				'Uses a known colleague relationship with a client stakeholder while flagging that relationship freshness should be checked.',
			matchSignals: ['stakeholder relationship', 'CRM relationship data', 'new executive'],
			emailDraft: {
				to: ['Client relationship partner'],
				cc: [],
				attachment: null,
				body: [
					{
						type: 'paragraph',
						text: "Maya Iyer appears to know Acme's new CFO from her Northstar role. If that relationship is still warm, she could help you understand the CFO's finance-transformation priorities before the QBR."
					},
					{
						type: 'paragraph',
						text: 'Suggested ask: check with Maya first on relationship freshness and sensitivities. I would not suggest an external intro until you are comfortable with the context.'
					}
				]
			}
		},
		{
			slug: 'live-pursuit-support',
			description:
				'Supports an active pursuit by bringing in a colleague who can sharpen the story before submission.',
			matchSignals: ['open pursuit', 'proposal deadline', 'similar wins', 'practice expertise'],
			emailDraft: {
				to: ['Pursuit lead'],
				cc: [],
				attachment: null,
				body: [
					{
						type: 'paragraph',
						text: "For the Acme analytics renewal, Nikhil Rao may be useful before Friday's proposal review. He has two recent wins where the client needed analytics governance tied to commercial outcomes."
					},
					{
						type: 'bullets',
						items: [
							'Suggested ask: have Nikhil pressure-test the pursuit story, not join the client meeting yet.',
							'Reason to act now: the proposal language can still change before the internal review.'
						]
					}
				]
			}
		},
		{
			slug: 'cross-practice-pursuit-kickoff',
			description:
				'Uses a formal pursuit moment to suggest a small cross-practice working session before proposal content is locked.',
			matchSignals: ['large pursuit', 'proposal deadline', 'cross-practice team', 'solution design'],
			emailDraft: {
				to: ['Pursuit lead'],
				cc: [],
				attachment: null,
				body: [
					{
						type: 'paragraph',
						text: "For the Northwind operating-model RFP, a short cross-practice kickoff this week may help before the proposal story hardens. Rafael Ortiz can pressure-test the technology roadmap, and Meera Shah can cover change adoption."
					},
					{
						type: 'paragraph',
						text: 'Suggested ask: a 25-minute internal working session with you first. If the angles do not strengthen the pursuit, no one needs to be added to the client process.'
					}
				]
			}
		},
		{
			slug: 'solution-ip-match',
			description:
				'Matches a client issue to reusable firm IP or an accelerator, while keeping the recommendation anchored in client value.',
			matchSignals: ['solution accelerator', 'knowledge asset', 'client issue', 'proposal support'],
			emailDraft: {
				to: ['Account lead'],
				cc: [],
				attachment: null,
				body: [
					{
						type: 'paragraph',
						text: "Acme's claims-leakage questions may be a fit for the insurance analytics accelerator Priya Nair's team has been using in recent carrier work. It could give you a concrete way to frame the issue without turning the meeting into a product pitch."
					},
					{
						type: 'paragraph',
						text: 'Suggested ask: have Priya send you a two-slide internal overview and the client situations where it has been useful, then you can decide whether to reference it.'
					}
				]
			}
		},
		{
			slug: 'account-expansion-signal',
			description:
				'Uses an account signal to suggest a relevant colleague without making the note feel like wallet-share mining.',
			matchSignals: ['CRM note', 'client priority', 'unserved practice', 'current work'],
			emailDraft: {
				to: ['Account lead'],
				cc: [],
				attachment: null,
				body: [
					{
						type: 'paragraph',
						text: 'Your March QBR note mentioned finance-process pain at Acme. Sara Malik may be relevant if that topic comes back up; her team has been connecting finance redesign to ERP roadmap decisions for industrial clients.'
					},
					{
						type: 'paragraph',
						text: 'Suggested ask: a short internal readout from Sara on what questions to listen for, then you can decide whether there is a client-service reason to involve her.'
					}
				]
			}
		},
		{
			slug: 'post-delivery-account-review',
			description:
				'Turns a delivery handoff or quarterly account review into a careful next-client-need discussion.',
			matchSignals: ['delivery handoff', 'account review', 'client satisfaction', 'adjacent need'],
			emailDraft: {
				to: ['Global account leader'],
				cc: [],
				attachment: null,
				body: [
					{
						type: 'paragraph',
						text: 'Ahead of the Globex post-delivery account review, it may be worth asking Elena Rossi to join the internal prep. Her team saw working-capital constraints during the implementation, which could affect the next wave of operations work.'
					},
					{
						type: 'paragraph',
						text: 'Suggested ask: have Elena share what she observed and any sensitivities before you decide whether this belongs in the client follow-up.'
					}
				]
			}
		}
	]
} satisfies BringTheFirmExamples;
