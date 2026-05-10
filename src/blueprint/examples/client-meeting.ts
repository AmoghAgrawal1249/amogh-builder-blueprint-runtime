import type { BringTheFirmExamples } from './types';

export const clientMeetingExamples = {
	slug: 'client-meeting',
	description: 'Recommendations for colleagues to bring into scheduled client meetings.',
	// The AI sometimes uses this text more literally than it should, so write it as user-facing question copy.
	questionGuidance:
		'Which ranking signal should matter most when more than one colleague could help?',
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
				attachment: {
					filename: 'Recommended Colleagues.xlsx',
					cells: [
						['Colleague', 'Relevant client', 'Context', 'Recommended talking point'],
						[
							'{{colleague_name}}',
							'{{similar_client}}',
							'{{relevant_context}}',
							'{{recommended_talking_point}}'
						],
						['Avery Chen', 'Northstar Health', 'Recent {{industry}} mandate', 'Implementation risks'],
						['Mira Patel', 'Union Capital', 'Comparable board presentation', 'Decision timeline']
					]
				},
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
				]
			}
		}
	]
} satisfies BringTheFirmExamples;
