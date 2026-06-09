<script lang="ts">
	import { resolve } from '$app/paths';
	import { cn } from '$lib/ui/cn';
	import type { SelectableListItem } from '$lib/layout/list';
	import { PersonAvatar } from '$lib/entities/people';

	export type EmailFormatListItem = SelectableListItem & {
		title: string;
		status: 'active' | 'paused';
		statusLabel: string;
		statusLabelClass: string;
		createdAtLabel: string;
		creator: {
			name: string;
			avatarUrl: string;
		};
	};

	type Props = {
		item: EmailFormatListItem;
	};

	let { item }: Props = $props();
</script>

<div class="grid min-w-0 grid-cols-1 items-center gap-x-4 sm:grid-cols-[minmax(0,1fr)_max-content_auto]">
	<div class="min-w-0">
		{#if item.href}
			<a
				href={resolve(item.href)}
				class="flex min-w-0 flex-col gap-0.5 rounded-sm focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:outline-none"
			>
				<span class="truncate text-[0.7rem] text-stone-950">
					{item.title}
				</span>
				<span class={cn('truncate text-[0.72rem]', item.statusLabelClass)}>
					{item.statusLabel}
				</span>
			</a>
		{:else}
			<span class="flex min-w-0 flex-col gap-0.5">
				<span class="truncate text-[0.7rem] text-stone-950">
					{item.title}
				</span>
				<span class={cn('truncate text-[0.72rem]', item.statusLabelClass)}>
					{item.statusLabel}
				</span>
			</span>
		{/if}
	</div>

	<div class="hidden whitespace-nowrap text-[0.72rem] text-stone-400 sm:block">
		{item.createdAtLabel}
	</div>

	<div class="hidden sm:flex">
		<PersonAvatar
			person={item.creator}
			size={22}
			class="ring-1 ring-stone-200/70"
		/>
	</div>
</div>
