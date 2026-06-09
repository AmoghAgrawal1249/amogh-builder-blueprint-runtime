<script lang="ts">
	import MobileNavList from '$lib/app/chrome/mobile/MobileNavList.svelte';
	import XIcon from 'phosphor-svelte/lib/XIcon';
	import HomeLink from '$lib/app/chrome/shared/HomeLink.svelte';
	import { MOBILE_NAV_SECTIONS, NAV_FOOTER_ITEMS } from '$lib/app/chrome/shared/nav';
	import { useChromeShellState } from '$lib/app/chrome/shared/shell.svelte';
	import { IconButton } from '$lib/ui';

	type Props = {
		currentPathname: string;
	};

	let { currentPathname }: Props = $props();
	const shellState = useChromeShellState();
</script>

{#if shellState.isMobileDrawerOpen}
	<div class="app-layer-drawer fixed inset-0 pointer-events-auto md:hidden">
		<aside id="mobile-nav-drawer" class="flex h-full flex-col bg-white">
			<header class="flex h-11 items-center border-b border-stone-100 bg-white px-(--shell-gutter-mobile)">
				<HomeLink
					onclick={() => {
						shellState.isMobileDrawerOpen = false;
					}}
				/>
				<IconButton
					aria-label="Close navigation menu"
					variant="ghost"
					class="ml-auto size-8 text-stone-700"
					onclick={() => {
						shellState.isMobileDrawerOpen = false;
					}}
				>
					<XIcon size={16} weight="regular" />
				</IconButton>
			</header>

			<div class="flex-1 overflow-y-auto px-(--shell-gutter-mobile) py-4">
				<nav aria-label="Dashboard navigation" class="relative mt-2 min-h-full">
					<MobileNavList
						sections={MOBILE_NAV_SECTIONS}
						footerItems={NAV_FOOTER_ITEMS}
						{currentPathname}
						onRouteSelect={() => {
							shellState.isMobileDrawerOpen = false;
						}}
					/>
				</nav>
			</div>
		</aside>
	</div>
{/if}
