<script lang="ts">
	import AuthButton from '$lib/auth/components/AuthButton.svelte';
	import AuthStepFrame from '$lib/auth/components/AuthStepFrame.svelte';
	import AuthTextarea from '$lib/auth/components/AuthTextarea.svelte';
	import AuthTextInput from '$lib/auth/components/AuthTextInput.svelte';

	type Props = {
		name: string;
		collaboration: string;
		onContinue: () => void;
	};

	let { name = $bindable(), collaboration = $bindable(), onContinue }: Props = $props();
	const canContinue = $derived(name.trim().length > 0 && collaboration.trim().length > 0);
</script>

<AuthStepFrame
	title="Tell us about the partner who invited you"
	description="How do you collaborate with the ecosystem partner who invited you to Overbase?"
>
	<form
		class="grid gap-3.5"
		onsubmit={(event) => {
			event.preventDefault();
			if (canContinue) {
				onContinue();
			}
		}}
	>
		<AuthTextInput
			label="Partner company's name"
			bind:value={name}
			autocomplete="organization"
			required
			autofocus
		/>
		<AuthTextarea
			label="How do you collaborate today to get more growth together?"
			bind:value={collaboration}
			required
			submitOnEnter
		/>
		<AuthButton type="submit" disabled={!canContinue}>Done</AuthButton>
	</form>
</AuthStepFrame>
