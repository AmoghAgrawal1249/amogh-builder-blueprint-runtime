import type { BringTheFirmExamples } from './types';

export const pursuitStageExamples = {
	slug: 'pursuit-stage',
	description: 'Recommendations for specialists to add when a pursuit reaches proposal stage.',
	questionGuidance:
		'Ask which pursuit stage, service line, or proposal risk should trigger the recommendation.',
	examples: [
		{
			slug: 'proposal-specialist-match',
			description: 'Recommend a specialist when a proposal reaches a stage needing deeper expertise.',
			matchSignals: [
				'proposal stage',
				'pursuit reaches proposal',
				'service line specialty',
				'similar deal'
			],
			emailDraft: {
				to: ['Pursuit owner'],
				cc: ['Practice lead'],
				attachments: ['Proposal Specialist Recommendations.pdf'],
				body: [
					{
						type: 'paragraph',
						text: '{{pursuit_name}} reached proposal stage, and Overbase found colleagues who have supported similar work.'
					},
					{
						type: 'bullets',
						items: [
							'{{colleague_name}} has recent experience with {{service_line_or_deal_type}}.',
							'Relevant credential: {{credential_summary}}.',
							'Suggested next step: invite them to the proposal working session.'
						]
					}
				],
				fireReason:
					'The email fires when a pursuit reaches the configured proposal stage and a colleague has matching specialty or deal experience.'
			}
		}
	]
} satisfies BringTheFirmExamples;
