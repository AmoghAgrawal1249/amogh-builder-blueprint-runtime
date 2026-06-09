<script lang="ts">
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/ui/cn';

	export type EmailFormatActivationStatusBarKind = 'blocked' | 'ready' | 'success';

	type Props = {
		message: string;
		kind?: EmailFormatActivationStatusBarKind;
		actionLabel?: string | null;
		actionDisabled?: boolean;
		onAction?: () => void | Promise<void>;
		class?: ClassValue;
	};

	let {
		message,
		kind = 'blocked',
		actionLabel = null,
		actionDisabled = false,
		onAction,
		class: className = ''
	}: Props = $props();

	const statusBarClass = $derived(
		cn(
			'flex flex-col gap-2 px-4 py-2 text-[0.72rem] leading-relaxed md:flex-row md:items-center md:justify-between md:px-5',
			kind === 'ready' || kind === 'success'
				? 'bg-positive-50 text-positive-700'
				: 'bg-stone-50 text-stone-700',
			className
		)
	);
</script>

<aside class={statusBarClass}>
	<p>{message}</p>
	{#if actionLabel && onAction}
		<button
			type="button"
			class="self-start text-[0.68rem] font-medium underline underline-offset-2 transition-colors hover:text-positive-900 disabled:cursor-default disabled:opacity-55 md:self-auto"
			disabled={actionDisabled}
			onclick={() => void onAction()}
		>
			{actionLabel}
		</button>
	{/if}
</aside>
