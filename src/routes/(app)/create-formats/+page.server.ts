import { listFormatStarterGalleryEntries } from '$lib/features/format-starters/catalog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		formatStarters: listFormatStarterGalleryEntries(),
		headerTitle: 'Create email formats'
	};
};
