import { APP_LINKS } from '$lib/app/app-links';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	return {
		emailFormatId: params.emailFormatId,
		headerTitle: 'Email format',
		desktopBreadcrumbParent: {
			label: 'My formats',
			href: APP_LINKS.emailFormats.pathname
		},
		chromeMode: 'focused'
	};
};
