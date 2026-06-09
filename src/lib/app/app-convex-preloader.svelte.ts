import type { Id } from '$convex/_generated/dataModel';
import { getContext, setContext } from 'svelte';

const APP_CONVEX_PRELOADER_CONTEXT = Symbol('app-convex-preloader');

export type AppConvexPreloader = {
	readonly hasEmailFormats: boolean;
	readonly emailFormatsReady: boolean;
	preloadEmailFormatConfiguration: (emailFormatId: Id<'emailFormats'>) => void;
};

export function provideAppConvexPreloader(preloader: AppConvexPreloader) {
	setContext(APP_CONVEX_PRELOADER_CONTEXT, preloader);
}

export function useAppConvexPreloader() {
	const preloader = getContext<AppConvexPreloader | undefined>(APP_CONVEX_PRELOADER_CONTEXT);

	if (!preloader) {
		throw new Error('AppConvexPreloader context is missing.');
	}

	return preloader;
}
