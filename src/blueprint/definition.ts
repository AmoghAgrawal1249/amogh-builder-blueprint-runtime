import { bringTheFirmGuide } from './guide';
import type { BuilderAppManifest } from './types';

export const bringTheFirmManifest = {
	slug: 'bring-the-firm',
	title: 'Bring the firm',
	description: 'Receive recommendations of colleagues to bring to meetings',
	mode: 'guided',
	guide: bringTheFirmGuide
} satisfies BuilderAppManifest;
