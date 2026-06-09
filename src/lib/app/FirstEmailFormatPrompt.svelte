<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { getCompanyIndustryLabel } from '$domain/company-industries';
	import { useAppConvexPreloader } from '$lib/app/app-convex-preloader.svelte';
	import { APP_LINKS } from '$lib/app/app-links';
	import { useCurrentWorkspaceContext } from '$lib/app/current-workspace.svelte';
	import ArrowUpRightIcon from 'phosphor-svelte/lib/ArrowUpRightIcon';

	const currentWorkspace = useCurrentWorkspaceContext();
	const appConvexPreloader = useAppConvexPreloader();
	const createFormatsPathname = APP_LINKS.createFormats.pathname;
	const workspaceIndustryLabel = $derived(
		getCompanyIndustryLabel(currentWorkspace.workspace.industry)?.toLowerCase() ?? 'your industry'
	);
	const isCreateFormatsRoute = $derived(
		page.url.pathname === createFormatsPathname ||
			page.url.pathname.startsWith(`${createFormatsPathname}/`)
	);
	const shouldShow = $derived(
		!isCreateFormatsRoute &&
			appConvexPreloader.emailFormatsReady &&
			!appConvexPreloader.hasEmailFormats
	);
</script>

{#if shouldShow}
	<aside
		class="pointer-events-auto fixed right-3 bottom-3 z-20 w-[calc(100vw-2rem)] max-w-48 rounded-sm border border-stone-200/50 bg-white px-3 py-2.5 shadow-[0_2px_6px_rgba(41,37,36,0.06)] md:right-4 md:bottom-4"
		aria-label="Create first email format"
	>
		<p class="text-[0.6875rem] leading-3.5 text-stone-500">First step</p>
		<p class="mt-1 text-xs font-medium leading-4 text-stone-800">
			Create email formats designed for {workspaceIndustryLabel}
		</p>
		<a
			href={resolve(createFormatsPathname)}
			class="mt-2 inline-flex items-center gap-1 text-xs leading-4 text-info-500 outline-none hover:text-link-600 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-link-500 focus-visible:ring-offset-2 focus-visible:ring-offset-link-50"
		>
			Create formats
			<ArrowUpRightIcon size={11} weight="bold" aria-hidden="true" />
		</a>
	</aside>
{/if}
