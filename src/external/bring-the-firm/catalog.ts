import { bringTheFirmGuide } from './rules/questions';
import type { AppCatalogDefinition } from './types';

export const bringTheFirmCatalog = {
	slug: 'bring-the-firm',
	categoryIds: ['consulting', 'law'],
	title: 'Bring the firm',
	description: 'Receive recommendations of colleagues to bring to meetings',
	artwork: {
		id: 'team-violet',
		card: {
			tone: 'violet',
			iconId: 'users-round',
			symbolSize: 'md'
		},
		panel: {
			backColor: '#9DE5F3',
			frontColor: '#DFA0F4',
			iconId: 'users-round',
			iconCenterX: '60%',
			iconCenterY: '46%'
		}
	},
	showInGallery: true,
	sortOrder: 10,
	status: 'active',
	mode: 'guided',
	guide: bringTheFirmGuide
} satisfies AppCatalogDefinition;
