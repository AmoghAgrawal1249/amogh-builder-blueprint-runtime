<script lang="ts">
	import { resolve } from '$app/paths';
	import { fly } from 'svelte/transition';
	import { cn } from '$lib/ui/cn';
	import {
		isNavItemActive,
		type NavFooterItem,
		type NavRouteItem,
		type NavSection
	} from '$lib/app/chrome/shared/nav';

	type Props = {
		sections: readonly NavSection[];
		footerItems: readonly NavFooterItem[];
		currentPathname: string;
		expanded: boolean;
		onRouteHover?: (route: NavRouteItem) => void;
	};

	let {
		sections,
		footerItems,
		currentPathname,
		expanded,
		onRouteHover
	}: Props = $props();

	function shouldShowCollapsedDivider(sectionIndex: number) {
		if (expanded) {
			return false;
		}

		const section = sections[sectionIndex];
		const previousSection = sections[sectionIndex - 1];

		return Boolean(section?.showCollapsedDivider && previousSection?.items.length && section.items.length);
	}

	function getRouteItemClassName(isActive: boolean) {
		return cn(
			'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm tracking-wide transition-colors',
			expanded
				? 'h-7 w-full justify-start gap-2.5 rounded-sm border border-transparent px-2 text-xs text-stone-600 hover:bg-transparent hover:text-stone-800'
				: 'size-7 justify-center rounded-sm border border-transparent text-stone-500 hover:bg-transparent hover:text-stone-800',
			isActive && 'text-stone-900'
		);
	}

	function getFooterItemClassName(disabled = false) {
		return cn(
			'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm tracking-wide transition-colors',
			expanded
				? 'h-7 w-full justify-start gap-2.5 rounded-sm border border-transparent px-2 text-xs text-stone-600 hover:bg-transparent hover:text-stone-800'
				: 'size-7 justify-center rounded-full border border-stone-100 bg-white text-stone-500 hover:bg-stone-100 hover:text-stone-700',
			disabled && 'pointer-events-none opacity-50'
		);
	}
</script>

<div class="flex min-h-0 flex-1 flex-col">
	{#each sections as section, sectionIndex (section.id)}
		<div class={cn('flex flex-col', expanded && section.desktopSectionClass)}>
			{#if expanded}
				<div class="mb-2" in:fly={{ x: -4, duration: 200 }}>
					<p class="px-2 text-[11px] uppercase tracking-wide text-stone-400">{section.heading}</p>
				</div>
			{:else if shouldShowCollapsedDivider(sectionIndex)}
				<div class="py-3">
					<span aria-hidden="true" class="mx-auto block h-px w-4 bg-stone-200/50"></span>
				</div>
			{/if}

			<ul class="flex flex-col gap-1.5">
				{#each section.items as item (item.id)}
					{@const Icon = item.icon}
					<li>
						<span class={cn('relative', expanded ? 'block w-full' : 'inline-flex')}>
							<a
								href={resolve(item.pathname)}
								data-sidebar-indicator-key={item.id}
								class={getRouteItemClassName(isNavItemActive(item.pathname, currentPathname))}
								onmouseenter={() => {
									onRouteHover?.(item);
								}}
								onfocus={() => {
									onRouteHover?.(item);
								}}
							>
								<Icon size={14} weight="regular" class="shrink-0" />
								{#if expanded}
									<span class="min-w-0 overflow-hidden" in:fly={{ x: -4, duration: 200 }}>
										<span class="block truncate text-left">{item.label}</span>
									</span>
								{:else}
									<span class="sr-only">{item.label}</span>
								{/if}
							</a>
						</span>
					</li>
				{/each}
			</ul>
		</div>
	{/each}

	{#if footerItems.length}
		<div class={cn('mt-auto flex flex-col pt-3', expanded ? '' : 'pb-1')}>
			<ul class="flex flex-col gap-1.5">
				{#each footerItems as item (item.id)}
					{@const Icon = item.icon}
					<li>
						<span class={cn('relative', expanded ? 'block w-full' : 'inline-flex self-center')}>
							{#if item.kind === 'external-link'}
								<a
									href={item.href}
									target="_blank"
									rel="external noreferrer"
									class={getFooterItemClassName()}
								>
									<Icon size={14} weight="regular" class="shrink-0" />
									{#if expanded}
										<span class="min-w-0 overflow-hidden">
											<span class="block truncate text-left">{item.label}</span>
										</span>
									{:else}
										<span class="sr-only">{item.label}</span>
									{/if}
								</a>
							{:else}
								<span class={getFooterItemClassName(true)}>
									<Icon size={14} weight="regular" class="shrink-0" />
									{#if expanded}
										<span class="min-w-0 overflow-hidden">
											<span class="block truncate text-left">{item.label}</span>
										</span>
									{:else}
										<span class="sr-only">{item.label}</span>
									{/if}
								</span>
							{/if}
						</span>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
