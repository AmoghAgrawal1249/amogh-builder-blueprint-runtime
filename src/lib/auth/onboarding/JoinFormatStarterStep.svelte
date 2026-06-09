<script lang="ts">
	import FormatStarterCard from '$lib/features/format-starters/FormatStarterCard.svelte';
	import type { JoinFormatStarterRecommendation } from './join-format-starter';

	type Props = {
		formatStarter: JoinFormatStarterRecommendation;
		completionErrorText: string | null;
		isSelectingFormatStarter: boolean;
		isOpeningFormatStarterGallery: boolean;
		onSelect: () => void;
		onPreload: () => void;
		onOpenFormatStarterGallery: () => void;
	};

	let {
		formatStarter,
		completionErrorText,
		isSelectingFormatStarter,
		isOpeningFormatStarterGallery,
		onSelect,
		onPreload,
		onOpenFormatStarterGallery
	}: Props = $props();
	const isCompletingOnboarding = $derived(
		isSelectingFormatStarter || isOpeningFormatStarterGallery
	);

	function selectFormatStarter(event: MouseEvent) {
		if (isCompletingOnboarding) {
			event.preventDefault();
			return;
		}

		if (
			event.defaultPrevented ||
			event.button !== 0 ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey
		) {
			return;
		}

		event.preventDefault();
		onSelect();
	}

	function preloadFormatStarter() {
		if (!isCompletingOnboarding) {
			onPreload();
		}
	}
</script>

<section
	class="flex min-h-dvh items-center justify-center overflow-auto bg-white px-6 py-16 text-[#202124]"
	aria-label="Recommended format"
>
	<div class="w-full max-w-190 text-center">
		<h1 class="mt-5 mb-0 text-[30px] leading-[1.08] font-medium text-[#08090a]">
			Receive opportunities by email
		</h1>
		<p class="mx-auto mt-4 max-w-sm text-sm leading-[1.45] text-[#686b73]">
			Create a custom email format your team will receive with easy opportunities to grow revenue
		</p>

		<div class="mt-10 flex justify-center">
			<div class="w-full">
				<div class="mx-auto grid max-w-92 grid-cols-1 gap-2.5">
					<FormatStarterCard
						{formatStarter}
						disabled={isCompletingOnboarding}
						emailPreviewFrame="zoomed"
						showDataSources={false}
						onpointerenter={preloadFormatStarter}
						onfocus={preloadFormatStarter}
						onclick={selectFormatStarter}
					/>
				</div>
				{#if completionErrorText}
					<p class="mx-auto mt-5 max-w-75 text-sm leading-5 text-red-600">
						{completionErrorText}
					</p>
				{/if}
				<button
					type="button"
					class="mt-7 text-sm text-stone-400/50 underline underline-offset-2 transition hover:text-stone-400/70 focus-visible:rounded-sm focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(120_113_108_/_20%)] disabled:cursor-not-allowed disabled:text-stone-300"
					disabled={isCompletingOnboarding}
					onclick={onOpenFormatStarterGallery}
				>
					{isOpeningFormatStarterGallery ? 'Opening...' : 'Let me explore the service'}
				</button>
			</div>
		</div>
	</div>
</section>
