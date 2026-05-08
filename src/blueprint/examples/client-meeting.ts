import type { BringTheFirmExamples } from './types';

export const clientMeetingExamples = {
	slug: 'client-meeting',
	description: 'Recommendations for colleagues to bring into scheduled client meetings.',
	questionGuidance:
		'Ask which ranking signal should matter most when more than one colleague could help.',
	examples: [
		{
			slug: 'calendar-meeting-industry-match',
			description: 'Recommend colleagues before a client meeting based on industry experience.',
			matchSignals: [
				'client meeting added',
				'industry experience',
				'calendar meeting',
				'recommended colleague before meeting'
			],
			emailDraft: {
				to: ['Client team owner'],
				cc: ['Relationship partner'],
				attachments: ['Recommended Colleagues.pdf'],
				body: [
					{
						type: 'paragraph',
						text: 'A client meeting was added for {{client_name}}, and Overbase found colleagues with recent {{industry}} experience who may strengthen the conversation.'
					},
					{
						type: 'bullets',
						items: [
							'{{colleague_name}} worked with {{similar_client}} on {{relevant_context}}.',
							'Recommended talking point: {{recommended_talking_point}}.',
							'Review the attached colleague summary before the meeting.'
						]
					}
				],
				fireReason:
					'The email fires when a client meeting is added and at least one colleague has matching industry or account context.'
			}
		}
	]
} satisfies BringTheFirmExamples;
