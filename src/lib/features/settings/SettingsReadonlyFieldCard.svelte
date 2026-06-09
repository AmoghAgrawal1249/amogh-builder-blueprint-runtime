<script lang="ts">
	import SettingsCard from './SettingsCard.svelte';

	type Props = {
		title: string;
		description: string;
		value: string;
		fieldId: string;
		label: string;
		footerText: string;
	};

	let { title, description, value, fieldId, label, footerText }: Props = $props();
</script>

<SettingsCard {title} {description}>
	<div class="mt-4 max-w-sm space-y-2">
		<label class="sr-only" for={fieldId}>{label}</label>
		<input
			id={fieldId}
			type="text"
			readonly
			value={value}
			class="h-8 w-full rounded-sm border border-stone-200/70 bg-stone-50 px-2.5 text-[0.74rem] text-stone-500 outline-none"
		/>
	</div>

	{#snippet footer()}
		<p>{footerText}</p>
	{/snippet}
</SettingsCard>
