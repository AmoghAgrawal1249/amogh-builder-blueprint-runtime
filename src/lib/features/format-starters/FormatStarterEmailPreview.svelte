<script lang="ts">
	import type { ClassValue } from 'clsx';
	import ArrowSquareOutIcon from 'phosphor-svelte/lib/ArrowSquareOutIcon';
	import PrinterIcon from 'phosphor-svelte/lib/PrinterIcon';
	import type { FormatStarterSampleEmail } from '$lib/features/format-starters/catalog';
	import { cn } from '$lib/ui/cn';

	type Props = {
		content: FormatStarterSampleEmail;
		class?: ClassValue;
	};

	let { content, class: className }: Props = $props();
</script>

<article class={cn('format-starter-email-preview', className)} aria-hidden="true">
	<header class="format-starter-email-preview__header">
		<img src="/logo.png" alt="" class="format-starter-email-preview__logo" draggable="false" />
		<h2 class="format-starter-email-preview__title">{content.subject}</h2>
		<div class="format-starter-email-preview__toolbar">
			<span class="format-starter-email-preview__toolbar-icon">
				<PrinterIcon size="100%" weight="regular" />
			</span>
			<span class="format-starter-email-preview__toolbar-icon">
				<ArrowSquareOutIcon size="100%" weight="regular" />
			</span>
		</div>
	</header>

	<div class="format-starter-email-preview__body">
		{#each content.paragraphs as paragraph, paragraphIndex (paragraphIndex)}
			<p>{paragraph}</p>
		{/each}
	</div>
</article>

<style>
	.format-starter-email-preview {
		position: relative;
		container-type: inline-size;
		display: block;
		width: 100%;
		aspect-ratio: 2234 / 1102;
		overflow: hidden;
		border-radius: inherit;
		background: #fcfcfc;
		color: #050505;
		font-family: "Roboto", Arial, sans-serif;
	}

	.format-starter-email-preview__header {
		position: absolute;
		inset: 0;
	}

	.format-starter-email-preview__logo {
		position: absolute;
		top: 5.8%;
		left: 5.3%;
		width: 5.3%;
		aspect-ratio: 1;
		border-radius: 50%;
		object-fit: cover;
	}

	.format-starter-email-preview__title {
		position: absolute;
		top: 7.35%;
		left: 13.35%;
		right: 19%;
		margin: 0;
		overflow: hidden;
		font-size: 2.95cqw;
		font-weight: 400;
		letter-spacing: 0;
		line-height: 1.08;
		white-space: nowrap;
	}

	.format-starter-email-preview__toolbar {
		position: absolute;
		top: 7%;
		right: 6%;
		display: flex;
		gap: 3.55cqw;
		align-items: center;
		color: #4d4d4d;
	}

	.format-starter-email-preview__toolbar-icon {
		display: block;
		width: 2.55cqw;
		aspect-ratio: 1;
		line-height: 0;
	}

	.format-starter-email-preview__body {
		position: absolute;
		top: 18.85%;
		right: 7.25%;
		left: 13.75%;
		font-size: 1.62cqw;
		font-weight: 400;
		letter-spacing: 0;
		line-height: 1.22;
	}

	.format-starter-email-preview__body p {
		margin: 0;
	}

	.format-starter-email-preview__body p + p {
		margin-top: 1.2cqw;
	}
</style>
