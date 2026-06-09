<script lang="ts">
	import { cn } from '$lib/ui/cn';

	type Props = {
		src?: string | null;
		defaultSrc: string;
		alt: string;
		size?: number;
		class?: string;
	};

	let { src, defaultSrc, alt, size = 20, class: classProp = '' }: Props = $props();
	let failedSrc = $state<string | null>(null);
	const uploadedSrc = $derived(src?.trim() ?? '');
	const imageSrc = $derived(
		uploadedSrc && failedSrc !== uploadedSrc ? uploadedSrc : defaultSrc
	);
	const showImage = $derived(failedSrc !== imageSrc);
</script>

<span
	class={cn(
		'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-100',
		classProp
	)}
	style={`width:${size}px;height:${size}px;`}
>
	{#if showImage}
		<img
			src={imageSrc}
			{alt}
			class="block h-full w-full object-cover"
			onerror={() => {
				failedSrc = imageSrc;
			}}
		/>
	{/if}
</span>
