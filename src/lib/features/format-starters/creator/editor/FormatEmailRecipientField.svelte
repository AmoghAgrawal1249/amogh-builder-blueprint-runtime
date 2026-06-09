<script lang="ts">
	type Props = {
		value: string;
		readonlyValue: readonly string[];
		editable: boolean;
		ariaLabel: string;
		placeholder: string;
		onFocus?: () => void;
		onInput: (value: string) => void;
		onCommit: (value: string) => void;
	};

	let {
		value,
		readonlyValue,
		editable,
		ariaLabel,
		placeholder,
		onFocus,
		onInput,
		onCommit
	}: Props = $props();

	const formattedReadonlyValue = $derived(readonlyValue.join(', '));
</script>

{#if !editable}
	<p class="min-w-0 flex-1 truncate text-[0.79rem] text-stone-800">
		{formattedReadonlyValue}
	</p>
{:else}
	<input
		{value}
		aria-label={ariaLabel}
		{placeholder}
		class="min-w-0 flex-1 border-0 bg-transparent p-0 text-[0.79rem] text-stone-800 outline-none placeholder:text-stone-400"
		onfocus={onFocus}
		oninput={(event) => {
			onInput(event.currentTarget.value);
		}}
		onblur={(event) => onCommit(event.currentTarget.value)}
	/>
{/if}
