<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { APP_CONFIG } from '$lib/app/app-config';
	import AppConvexPreloader from '$lib/app/AppConvexPreloader.svelte';
	import FirstEmailFormatPrompt from '$lib/app/FirstEmailFormatPrompt.svelte';
	import {
		provideCurrentWorkspaceContext,
		type CurrentWorkspaceContext
	} from '$lib/app/current-workspace.svelte';
	import DesktopHeader from '$lib/app/chrome/desktop/DesktopHeader.svelte';
	import DesktopSidebar from '$lib/app/chrome/desktop/DesktopSidebar.svelte';
	import MobileDrawer from '$lib/app/chrome/mobile/MobileDrawer.svelte';
	import MobileHeader from '$lib/app/chrome/mobile/MobileHeader.svelte';
	import { getActiveNavRoute } from '$lib/app/chrome/shared/nav';
	import {
		provideRouteTitleState,
		type RouteTitleState
	} from '$lib/app/chrome/shared/route-title.svelte';
	import {
		provideChromeShellState,
		type ChromeShellState
	} from '$lib/app/chrome/shared/shell.svelte';
	import { onMount, type Snippet } from 'svelte';

	type Props = CurrentWorkspaceContext & {
		children: Snippet;
	};

	type ChromeMode = NonNullable<App.PageData['chromeMode']>;
	type ViewportState = 'unknown' | 'mobile' | 'desktop';

	let { user, workspace, identity, children: routeChildren }: Props = $props();

	function getChromeMode(chromeMode?: ChromeMode) {
		return chromeMode ?? 'dashboard';
	}

	const currentWorkspace: CurrentWorkspaceContext = {
		get user() {
			return user;
		},
		get workspace() {
			return workspace;
		},
		get identity() {
			return identity;
		}
	};
	const sidebarExpandedByMode = $state<Record<ChromeMode, boolean>>({
		dashboard: true,
		focused: false
	});
	const initialChromeMode = getChromeMode(page.data.chromeMode);
	const activeChromeMode = $derived(getChromeMode(page.data.chromeMode));
	let currentChromeMode = $state(initialChromeMode);
	const shellState = $state<ChromeShellState>({
		isSidebarExpanded: sidebarExpandedByMode[initialChromeMode],
		isMobileDrawerOpen: false,
		toggleSidebar() {
			const nextSidebarExpanded = !shellState.isSidebarExpanded;
			shellState.isSidebarExpanded = nextSidebarExpanded;
			sidebarExpandedByMode[currentChromeMode] = nextSidebarExpanded;
		}
	});
	const routeTitleState = $state<RouteTitleState>({
		title: APP_CONFIG.name,
		editable: null,
		onTitleChange: null,
		actions: null,
		overflowActions: []
	});
	let viewportState = $state<ViewportState>('unknown');
	const activeRoute = $derived(getActiveNavRoute(page.url.pathname));
	const viewportRequirement = $derived(page.data.viewportRequirement ?? null);
	const routeRequiresDesktop = $derived(viewportRequirement?.minWidth === 'desktop');
	const canRenderRoute = $derived(!routeRequiresDesktop || viewportState === 'desktop');
	const sourceRouteTitle = $derived(
		page.data.headerTitle ?? activeRoute?.headerLabel ?? APP_CONFIG.name
	);
	const routeTitleResetKey = $derived(`${page.url.pathname}:${sourceRouteTitle}`);
	const routeTitleEditable = $derived(
		routeTitleState.editable ?? Boolean(page.data.headerTitleEditable)
	);
	const desktopBreadcrumbParent = $derived(page.data.desktopBreadcrumbParent ?? null);
	let customRouteTitle = $state<string | null>(null);
	let currentRouteTitleResetKey = $state('');
	const routeTitle = $derived(customRouteTitle ?? sourceRouteTitle);

	async function handleRouteTitleChange(title: string) {
		const previousTitle = routeTitleState.title;
		customRouteTitle = title;
		routeTitleState.title = title;

		try {
			await routeTitleState.onTitleChange?.(title);
		} catch {
			customRouteTitle = previousTitle;
			routeTitleState.title = previousTitle;
		}
	}

	$effect(() => {
		if (currentRouteTitleResetKey !== routeTitleResetKey) {
			currentRouteTitleResetKey = routeTitleResetKey;
			customRouteTitle = null;
			routeTitleState.editable = null;
		}
	});

	$effect(() => {
		if (currentChromeMode !== activeChromeMode) {
			sidebarExpandedByMode[currentChromeMode] = shellState.isSidebarExpanded;
			currentChromeMode = activeChromeMode;
			shellState.isSidebarExpanded = sidebarExpandedByMode[currentChromeMode];
		}
	});

	$effect(() => {
		routeTitleState.title = routeTitle;
	});

	$effect(() => {
		if (viewportState === 'mobile' && routeRequiresDesktop && viewportRequirement) {
			void goto(resolve(viewportRequirement.fallbackHref), { replaceState: true });
		}
	});

	onMount(() => {
		const mediaQuery = window.matchMedia('(max-width: 767px)');
		const syncViewportState = () => {
			viewportState = mediaQuery.matches ? 'mobile' : 'desktop';
		};

		syncViewportState();
		mediaQuery.addEventListener('change', syncViewportState);

		return () => {
			mediaQuery.removeEventListener('change', syncViewportState);
		};
	});

	provideCurrentWorkspaceContext(currentWorkspace);
	provideChromeShellState(shellState);
	provideRouteTitleState(routeTitleState);
</script>

<AppConvexPreloader>
	<div class="h-dvh min-h-dvh overflow-hidden bg-stone-50">
		<div
			class="dashboard-surface flex h-full min-h-0 md:gap-(--dashboard-surface-gap)"
			data-sidebar-state={shellState.isSidebarExpanded ? 'expanded' : 'collapsed'}
		>
			<DesktopSidebar
				currentPathname={page.url.pathname}
				user={currentWorkspace.user}
				identity={currentWorkspace.identity}
				class="hidden md:flex"
			/>

			<main
				class="min-w-0 flex min-h-0 flex-1 flex-col overflow-hidden bg-white md:rounded-sm md:border md:border-stone-100"
			>
				{#if canRenderRoute}
					<MobileDrawer currentPathname={page.url.pathname} />
					<MobileHeader
						title={routeTitleState.title}
						titleEditable={routeTitleEditable}
						onTitleChange={handleRouteTitleChange}
						actions={routeTitleState.actions}
					/>
				{/if}

				<div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
					{#if canRenderRoute}
						<DesktopHeader
							title={routeTitleState.title}
							titleEditable={routeTitleEditable}
							breadcrumbParent={desktopBreadcrumbParent}
							onTitleChange={handleRouteTitleChange}
							actions={routeTitleState.actions}
							overflowActions={routeTitleState.overflowActions}
						/>
					{/if}

					<div class="dashboard-main-viewport min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
						<div class="h-full min-h-full min-w-0">
							{#if canRenderRoute}
								{@render routeChildren()}
								<FirstEmailFormatPrompt />
							{/if}
						</div>
					</div>
				</div>
			</main>
		</div>
	</div>
</AppConvexPreloader>
