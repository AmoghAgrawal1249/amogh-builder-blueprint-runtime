<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import SidebarSimpleIcon from 'phosphor-svelte/lib/SidebarSimpleIcon';
	import CaretRightIcon from 'phosphor-svelte/lib/CaretRightIcon';
	import EditableHeaderTitle from '$lib/app/chrome/shared/EditableHeaderTitle.svelte';
	import HeaderOverflowButton from '$lib/app/chrome/shared/HeaderOverflowButton.svelte';
	import type { BreadcrumbParent } from '$lib/app/chrome/shared/breadcrumb';
	import { useChromeShellState } from '$lib/app/chrome/shared/shell.svelte';
	import { FloatingTooltip, IconButton, type FloatingActionMenuAction } from '$lib/ui';

	type Props = {
		title: string;
		titleEditable?: boolean;
		breadcrumbParent?: BreadcrumbParent | null;
		onTitleChange?: (title: string) => void;
		actions?: Snippet | null;
		overflowActions?: FloatingActionMenuAction[];
	};

	let {
		title,
		titleEditable = false,
		breadcrumbParent = null,
		onTitleChange,
		actions = null,
		overflowActions = []
	}: Props = $props();
	const shellState = useChromeShellState();
	const sidebarToggleTooltipText = $derived(
		shellState.isSidebarExpanded ? 'Close sidebar' : 'Open sidebar'
	);
</script>

<header class="hidden h-11 items-center border-b border-stone-100 bg-white pl-1 pr-4 md:flex">
	<div class="flex min-w-0 flex-1 items-center">
		<FloatingTooltip
			id="desktop-sidebar-toggle-tooltip"
			text={sidebarToggleTooltipText}
			placement="bottom"
			maxWidth={104}
			fitContent
			panelClass="whitespace-nowrap border-stone-200 bg-stone-100 px-2 py-1 text-[0.68rem] leading-none font-medium text-stone-700 shadow-sm shadow-stone-950/5"
		>
			{#snippet trigger({ describedBy })}
				<IconButton
					aria-label={sidebarToggleTooltipText}
					aria-describedby={describedBy}
					variant="ghost"
					class="mr-1 ml-1 size-7 text-stone-500 hover:bg-stone-100 hover:text-stone-700 focus-visible:bg-stone-100 focus-visible:text-stone-700 focus-visible:ring-2 focus-visible:ring-stone-300"
					onclick={() => {
						shellState.toggleSidebar();
					}}
				>
					<SidebarSimpleIcon size={14} weight="regular" />
				</IconButton>
			{/snippet}
		</FloatingTooltip>

		{#if breadcrumbParent}
			<nav aria-label="Breadcrumb" class="ml-2 flex min-w-0 flex-1 items-center gap-1.5">
				<a
					href={resolve(breadcrumbParent.href)}
					class="block min-w-0 shrink truncate text-[0.74rem] font-medium tracking-wide text-stone-400 transition-colors hover:text-stone-600"
				>
					{breadcrumbParent.label}
				</a>
				<CaretRightIcon size={12} weight="regular" class="shrink-0 text-stone-300" />
				<EditableHeaderTitle
					{title}
					editable={titleEditable}
					{onTitleChange}
					class="min-w-0 flex-1"
					textClass="text-[0.74rem] font-medium"
				/>
			</nav>
		{:else}
			<EditableHeaderTitle
				{title}
				editable={titleEditable}
				{onTitleChange}
				class="flex-1"
				textClass="text-[0.74rem] font-medium"
			/>
		{/if}
	</div>

	<div class="flex items-center gap-2">
		{@render actions?.()}
		<HeaderOverflowButton actions={overflowActions} />
	</div>
</header>
