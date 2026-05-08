<script lang="ts">
	import { PenLine } from 'lucide-svelte';

	type Props = {
		name: string;
		value: string;
		placeholder: string;
		onValueChange: (value: string) => void;
	};

	let { name, value, placeholder, onValueChange }: Props = $props();
</script>

<label class="flex min-h-10 min-w-0 flex-1 items-center gap-3 text-[0.76rem] text-zinc-500 md:text-[0.8rem]">
	<PenLine class="size-3.5 shrink-0" />
	<input
		type="text"
		{name}
		{value}
		oninput={(event) => {
			onValueChange(event.currentTarget.value);
		}}
		{placeholder}
		class="min-w-0 flex-1 border-0 bg-transparent p-0 text-[0.76rem] text-zinc-800 outline-none placeholder:text-zinc-500 md:text-[0.8rem]"
	/>
</label>
