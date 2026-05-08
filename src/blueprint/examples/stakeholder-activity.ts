import type { BringTheFirmExamples } from './types';

export const stakeholderActivityExamples = {
	slug: 'stakeholder-activity',
	description: 'Recommendations when strategic accounts show new stakeholder activity.',
	questionGuidance:
		'Ask which stakeholder movement or account tier should be considered important enough to notify.',
	examples: [
		{
			slug: 'new-stakeholder-specialty-match',
			description: 'Recommend colleagues when a new stakeholder creates a cross-practice opening.',
			matchSignals: [
				'strategic account stakeholder',
				'new stakeholder activity',
				'matching service-line specialty',
				'cross-practice introduction'
			],
			emailDraft: {
				to: ['Strategic account lead'],
				cc: ['Client team owner'],
				attachments: ['Stakeholder Activity Recommendations.pdf'],
				body: [
					{
						type: 'paragraph',
						text: '{{account_name}} has new stakeholder activity involving {{stakeholder_name}}, and Overbase found colleagues with relevant context.'
					},
					{
						type: 'bullets',
						items: [
							'{{colleague_name}} knows {{stakeholder_company_or_role}} from {{source_context}}.',
							'Relevant specialty: {{specialty_context}}.',
							'Suggested use: prepare an introduction path before the next account meeting.'
						]
					}
				],
				fireReason:
					'The email fires when a strategic account has new stakeholder activity and a colleague has relevant relationship or specialty context.'
			}
		}
	]
} satisfies BringTheFirmExamples;
