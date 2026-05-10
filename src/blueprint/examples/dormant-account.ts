import type { BringTheFirmExamples } from './types';

export const dormantAccountExamples = {
	slug: 'dormant-account',
	description: 'Recommendations for reactivating accounts that have been quiet.',
	// The AI sometimes uses this text more literally than it should, so write it as user-facing question copy.
	questionGuidance:
		'What dormant-account window or relationship signal should control the alert?',
	examples: [
		{
			slug: 'dormant-account-check-in',
			description: 'Recommend a colleague when a dormant account schedules new activity.',
			matchSignals: [
				'dormant account',
				'check-in scheduled',
				'account has been quiet',
				'knows the account personally'
			],
			emailDraft: {
				to: ['Account owner'],
				cc: [],
				attachments: ['Dormant Account Context.xlsx'],
				body: [
					{
						type: 'paragraph',
						text: '{{account_name}} has a new check-in after {{dormant_period}} without meaningful activity.'
					},
					{
						type: 'bullets',
						items: [
							'{{colleague_name}} previously worked with {{account_contact}}.',
							'Last relevant matter: {{matter_or_project_summary}}.',
							'Consider inviting them if the meeting touches {{relationship_context}}.'
						]
					}
				]
			}
		}
	]
} satisfies BringTheFirmExamples;
