<script lang="ts">
	import PlusIcon from 'phosphor-svelte/lib/PlusIcon';
	import { Button } from '$lib/ui';

	type Tone = 'primary' | 'secondary';

	type Props = {
		label: string;
		tone?: Tone;
		class?: string;
		onclick?: () => void;
	};

	let { label, tone = 'primary', class: className = '', onclick }: Props = $props();
</script>

<Button
	variant={tone}
	class={[
		'text-[0.72rem] font-normal md:text-[0.74rem]',
		tone === 'secondary' && 'border-stone-200/70 text-stone-950',
		className
	]}
	{onclick}
>
	{#snippet leading()}
		<PlusIcon aria-hidden="true" size={14} weight="regular" />
	{/snippet}
	<span>{label}</span>
</Button>
