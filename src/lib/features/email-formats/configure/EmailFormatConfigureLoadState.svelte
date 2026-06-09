<script lang="ts">
	import type { EmailFormatConfigureLoadState } from './email-format-configure-types';

	type Props = {
		loadState: EmailFormatConfigureLoadState;
		variant: 'desktop' | 'mobile';
	};

	let { loadState, variant }: Props = $props();

	const stateContent = $derived.by(() => {
		if (loadState === 'loading') {
			return { message: 'Loading email format...', tone: 'muted' };
		}

		if (loadState === 'error') {
			return { message: 'Could not load email format.', tone: 'error' };
		}

		if (loadState === 'notFound') {
			return { message: 'Email format not found.', tone: 'muted' };
		}

		return null;
	});
</script>

{#if stateContent}
	<div
		class={`flex ${variant === 'desktop' ? 'h-full' : 'min-h-60'} items-center justify-center text-[0.74rem] ${stateContent.tone === 'error' ? 'text-red-600' : 'text-stone-500'}`}
	>
		{stateContent.message}
	</div>
{/if}
