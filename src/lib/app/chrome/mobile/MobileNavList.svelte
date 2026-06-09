<script lang="ts">
	import { resolve } from '$app/paths';
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
		onRouteSelect?: (route: NavRouteItem) => void;
	};

	let { sections, footerItems, currentPathname, onRouteSelect }: Props = $props();

	function getItemClassName(params: { isActive: boolean; disabled?: boolean }) {
		const { isActive, disabled = false } = params;

		return cn(
			'inline-flex h-10 w-full items-center justify-start gap-2.5 rounded-md px-2 text-xs tracking-wide text-stone-600 transition-colors hover:bg-stone-100/70 hover:text-stone-900',
			disabled && 'pointer-events-none opacity-40',
			isActive && 'bg-stone-100/70 text-stone-900'
		);
	}
</script>

<div class="flex min-h-full flex-col">
	{#each sections as section (section.id)}
		<div class={cn('flex flex-col', section.mobileSectionClass)}>
			<p class="px-2 pb-2 text-[11px] uppercase tracking-wide text-stone-400">{section.heading}</p>

			<ul class="flex flex-col gap-1.5">
				{#each section.items as item (item.id)}
					{@const Icon = item.icon}
					<li>
						<a
							href={resolve(item.pathname)}
							class={getItemClassName({
								isActive: isNavItemActive(item.pathname, currentPathname)
							})}
							onclick={() => {
								onRouteSelect?.(item);
							}}
						>
							<Icon size={14} weight="regular" class="shrink-0" />
							<span class="min-w-0 truncate">{item.label}</span>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/each}

	{#if footerItems.length}
		<div class="mt-auto flex flex-col pt-6">
			<ul class="flex flex-col gap-1.5">
				{#each footerItems as item (item.id)}
					{@const Icon = item.icon}
					<li>
						{#if item.kind === 'external-link'}
							<a
								href={item.href}
								target="_blank"
								rel="external noreferrer"
								class={getItemClassName({ isActive: false })}
							>
								<Icon size={14} weight="regular" class="shrink-0" />
								<span class="min-w-0 truncate">{item.label}</span>
							</a>
						{:else}
							<span class={getItemClassName({ isActive: false, disabled: true })}>
								<Icon size={14} weight="regular" class="shrink-0" />
								<span class="min-w-0 truncate">{item.label}</span>
							</span>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
