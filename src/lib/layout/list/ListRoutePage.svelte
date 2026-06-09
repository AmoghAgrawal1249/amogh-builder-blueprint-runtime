<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/ui/cn';
	import EmptyListState from './EmptyListState.svelte';
	import EmptyListNextSteps from './EmptyListNextSteps.svelte';
	import ListContentState from './ListContentState.svelte';
	import ListToolbar from './ListToolbar.svelte';
	import type {
		EmptyListStateConfig,
		ListRouteStatus,
		ListToolbarConfig,
		NoResultsListStateConfig
	} from './types';

	type ListRouteContentState = 'loading' | 'error' | 'empty' | 'noResults' | 'records';

	type Props = {
		toolbar: ListToolbarConfig;
		empty: EmptyListStateConfig;
		noResults: NoResultsListStateConfig;
		status: ListRouteStatus;
		totalRecords: number;
		visibleRecords: number;
		isQueryActive: boolean;
		loadingMessage?: string;
		errorMessage?: string;
		class?: string;
		contentClass?: string;
		contentHeader?: Snippet;
		children?: Snippet;
		footer?: Snippet;
	};

	let {
		toolbar: toolbarConfig,
		empty,
		noResults,
		status,
		totalRecords,
		visibleRecords,
		isQueryActive,
		loadingMessage = 'Loading...',
		errorMessage = 'Could not load records.',
		class: className = '',
		contentClass = '',
		contentHeader,
		children,
		footer: footerContent
	}: Props = $props();

	const hasActualRecords = $derived(totalRecords > 0);
	const contentState = $derived.by<ListRouteContentState>(() => {
		if (status === 'loading') {
			return 'loading';
		}

		if (status === 'error') {
			return 'error';
		}

		if (totalRecords === 0 && !isQueryActive) {
			return 'empty';
		}

		if (visibleRecords === 0) {
			return 'noResults';
		}

		return 'records';
	});
</script>

<section class="flex h-full min-h-full w-full px-4 py-6 md:px-8 md:py-8">
	<div class="min-h-0 min-w-0 flex-1">
		<div class={cn('mx-auto flex min-h-full w-full max-w-270 flex-col gap-3 pb-12', className)}>
			<ListToolbar {...toolbarConfig} />

			<section
				class={cn('min-h-0 overflow-hidden rounded-sm border border-stone-200/70 bg-white', contentClass)}
				aria-label="List results"
			>
				{#if contentState === 'loading'}
					<ListContentState kind="loading" message={loadingMessage} />
				{:else if contentState === 'error'}
					<ListContentState kind="error" message={errorMessage} />
				{:else if contentState === 'empty'}
					<EmptyListState {...empty} />
				{:else if contentState === 'noResults'}
					{#if hasActualRecords}
						{@render contentHeader?.()}
					{/if}
					<EmptyListState icon={empty.icon} {...noResults} />
				{:else}
					{@render contentHeader?.()}
					{@render children?.()}
				{/if}
			</section>

			{#if status === 'ready' && !hasActualRecords && empty.nextSteps}
				<EmptyListNextSteps message={empty.nextSteps} />
			{/if}
			{#if status === 'ready' && hasActualRecords}
				{@render footerContent?.()}
			{/if}
		</div>
	</div>
</section>
