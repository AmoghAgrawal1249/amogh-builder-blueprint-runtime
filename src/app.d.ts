import type { BreadcrumbParent } from '$lib/app/chrome/shared/breadcrumb';
import type { CreateFormatsViewportFallbackPathname } from '$lib/app/app-links';
import type { AuthObject } from 'svelte-clerk/server';

declare global {
	namespace App {
		interface Locals {
			auth: () => AuthObject;
		}

		interface PageData {
			chromeMode?: 'dashboard' | 'focused';
			headerTitle?: string;
			headerTitleEditable?: boolean;
			desktopBreadcrumbParent?: BreadcrumbParent;
			viewportRequirement?: {
				minWidth: 'desktop';
				fallbackHref: CreateFormatsViewportFallbackPathname;
			};
		}

	}
}

export {};
