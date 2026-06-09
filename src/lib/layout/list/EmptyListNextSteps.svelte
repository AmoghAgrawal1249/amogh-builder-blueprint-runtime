<script lang="ts">
	import { InfoBar, InfoBarAction } from '$lib/ui';
	import type { EmptyListNextStepsContent } from './types';

	type Props = {
		message: EmptyListNextStepsContent;
		label?: string;
		class?: string;
	};

	let { message, label = 'Next steps:', class: className = '' }: Props = $props();
</script>

<InfoBar {label} class={className}>
	{#if typeof message === 'string'}
		{message}
	{:else}
		{#each message as part, index (`${part.kind}-${index}`)}
			{#if part.kind === 'text'}
				<span>{part.text}</span>
			{:else}
				<InfoBarAction href={part.href}>
					{part.text}
				</InfoBarAction>
			{/if}
		{/each}
	{/if}
</InfoBar>
