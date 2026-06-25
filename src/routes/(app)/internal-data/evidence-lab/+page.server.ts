import {
	buildEvidenceLabViewData,
	parseEvidenceLabHiddenSourceIds
} from '$lib/features/source-ranking/evidence-lab';
import { APP_LINKS } from '$lib/app/app-links';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	return {
		headerTitle: 'Evidence lab',
		desktopBreadcrumbParent: {
			label: 'Internal data',
			href: APP_LINKS.internalData.pathname
		},
		evidenceLab: buildEvidenceLabViewData({
			fixtureId: url.searchParams.get('fixture'),
			now: url.searchParams.get('now'),
			hiddenSourceIds: parseEvidenceLabHiddenSourceIds(url.searchParams)
		})
	};
};
