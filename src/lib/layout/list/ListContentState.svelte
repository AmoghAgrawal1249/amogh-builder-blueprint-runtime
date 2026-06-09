<script lang="ts">
	import CircleNotchIcon from 'phosphor-svelte/lib/CircleNotchIcon';
	import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';
	import { cn } from '$lib/ui/cn';

	type ContentStateKind = 'loading' | 'error' | 'empty';

	type Props = {
		kind: ContentStateKind;
		message: string;
		class?: string;
	};

	let { kind, message, class: className = '' }: Props = $props();

	const Icon = $derived(kind === 'error' ? WarningCircleIcon : CircleNotchIcon);
	const toneClass = $derived(
		kind === 'error'
			? 'border-red-100 bg-red-50/40 text-red-700'
			: 'border-stone-200/70 bg-white text-stone-500'
	);
</script>

<div
	class={cn(
		'flex min-h-40 items-center justify-center border-y px-4 py-8 text-center text-[0.76rem] md:px-5',
		toneClass,
		className
	)}
>
	<div class="inline-flex items-center gap-2">
		<Icon
			aria-hidden="true"
			size={14}
			weight="regular"
			class={cn(kind === 'loading' && 'animate-spin', kind === 'empty' && 'hidden')}
		/>
		<span>{message}</span>
	</div>
</div>
