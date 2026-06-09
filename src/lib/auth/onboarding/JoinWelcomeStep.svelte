<script lang="ts">
	import AuthHotkeyButton from '$lib/auth/components/AuthHotkeyButton.svelte';
	import AuthStepFrame from '$lib/auth/components/AuthStepFrame.svelte';

	type Props = {
		onContinue: () => void;
	};

	let { onContinue }: Props = $props();
</script>

<AuthStepFrame
	title="Welcome to Overbase"
	description="You connect your company's data. Your partners connect their data. Then Overbase sends opportunities by email"
	descriptionClass="text-[15px] text-[#4f5359]"
>
	<AuthHotkeyButton onclick={onContinue}>Join Overbase</AuthHotkeyButton>
</AuthStepFrame>
