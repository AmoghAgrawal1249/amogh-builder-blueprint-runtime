import type { BringTheFirmExample } from './types';

export type { BringTheFirmExample } from './types';

export const bringTheFirmExamples: BringTheFirmExample[] = [
	{
		to: ['Client team owner'],
		cc: [],
		attachments: ['Recommended colleagues.pdf'],
		body: [
			{
				type: 'paragraph',
				text: 'A client meeting was added for {{client_name}}, and Overbase found colleagues who may strengthen the conversation.'
			},
			{
				type: 'bullets',
				items: [
					'{{colleague_name}} has recent experience with {{relevant_context}}.',
					'The recommended talking point is {{recommended_talking_point}}.',
					'Review the attached colleague summary before the meeting.'
				]
			}
		],
		fireReason:
			'This email fires when a client or pursuit moment matches the configured Bring the firm trigger and relevant colleague expertise is found.'
	}
];
