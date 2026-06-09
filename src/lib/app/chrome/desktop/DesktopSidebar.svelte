<script lang="ts">
	import type { Doc } from '$convex/_generated/dataModel';
	import type { ViewerIdentity } from '$lib/app/current-workspace.svelte';
	import DesktopNavList from '$lib/app/chrome/desktop/DesktopNavList.svelte';
	import DesktopSidebarProfileMenu from '$lib/app/chrome/desktop/DesktopSidebarProfileMenu.svelte';
	import { cn } from '$lib/ui/cn';
	import HomeLink from '$lib/app/chrome/shared/HomeLink.svelte';
	import {
		getActiveNavRoute,
		NAV_FOOTER_ITEMS,
		NAV_SECTIONS,
		type NavRouteItem
	} from '$lib/app/chrome/shared/nav';
	import { useChromeShellState } from '$lib/app/chrome/shared/shell.svelte';
	import { sidebarIndicator } from '$lib/app/chrome/shared/sidebar-indicator';

	type Props = {
		currentPathname: string;
		user: Doc<'users'>;
		identity: ViewerIdentity;
		class?: string;
	};

	let {
		currentPathname,
		user,
		identity,
		class: className = ''
	}: Props = $props();

	const shellState = useChromeShellState();
	const activeRoute = $derived(getActiveNavRoute(currentPathname));
	const profile = $derived({
		name: user.displayName || identity.email,
		avatarUrl: user.avatar?.url ?? ''
	});
	let hoveredRoute = $state<NavRouteItem | null>(null);

	const indicatorTarget = $derived.by(() => {
		const targetRoute = hoveredRoute ?? activeRoute;

		return {
			targetKey: targetRoute?.id ?? null,
			enabled: Boolean(targetRoute)
		};
	});
</script>

<aside
	class={cn(
		'flex w-(--dashboard-sidebar-width) shrink-0 self-stretch flex-col overflow-hidden pt-2.5 pl-(--dashboard-sidebar-pad-left) pr-(--dashboard-sidebar-pad-right) transition-[width,padding] duration-200',
		shellState.isSidebarExpanded ? 'items-stretch' : 'items-start',
		className
	)}
	aria-label="Dashboard sidebar"
>
	<div class="relative mb-4 ml-0.5 flex w-full items-center pr-0.5">
		<HomeLink class="shrink-0" />

		<DesktopSidebarProfileMenu {profile} expanded={shellState.isSidebarExpanded} />
	</div>

	<nav
		use:sidebarIndicator={indicatorTarget}
		class="relative flex min-h-0 flex-1 flex-col"
		aria-label="Dashboard navigation"
		onmouseleave={() => {
			hoveredRoute = null;
		}}
	>
		<span
			aria-hidden="true"
			class="sidebar-nav-indicator pointer-events-none absolute rounded-sm bg-stone-200/60 transition-[transform,width,height,opacity] duration-200 ease-out will-change-transform"
		></span>
		<DesktopNavList
			sections={NAV_SECTIONS}
			footerItems={NAV_FOOTER_ITEMS}
			{currentPathname}
			expanded={shellState.isSidebarExpanded}
			onRouteHover={(route) => {
				hoveredRoute = route;
			}}
		/>
	</nav>
</aside>
