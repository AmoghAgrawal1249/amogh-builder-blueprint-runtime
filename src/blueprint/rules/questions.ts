import type { GuideDefinition } from '../types';

export const bringTheFirmGuide = {
	intro: "Let's build your Bring the firm notification. I just have a few quick questions.",
	questions: [
		{
			id: 'meeting-trigger',
			type: 'choice',
			title: 'When should we recommend colleagues to bring in?',
			options: [
				'A client meeting is added to my calendar',
				'A pursuit reaches proposal stage',
				'A dormant account schedules a check-in',
				'A strategic account has new stakeholder activity'
			],
			customAnswerPlaceholder: 'Describe another moment...'
		},
		{
			id: 'expertise-signal',
			type: 'choice',
			title: 'What kind of colleague should we look for?',
			options: [
				'Someone with relevant industry experience',
				'Someone who knows the account personally',
				'Someone with a matching service-line specialty',
				'Someone who worked on a similar deal'
			],
			customAnswerPlaceholder: 'Describe the expertise you want...'
		},
		{
			id: 'delivery-channel',
			type: 'text',
			title: 'What context should the recommendation include?',
			placeholder: 'Describe the client context, meeting notes, or expertise signals to include...'
		}
	]
} satisfies GuideDefinition;
