<script lang="ts">
	import AuthButton from '$lib/auth/components/AuthButton.svelte';
	import AuthStepFrame from '$lib/auth/components/AuthStepFrame.svelte';
	import AuthTextInput from '$lib/auth/components/AuthTextInput.svelte';
	import { SelectMenu } from '$lib/ui';
	import {
		COMPANY_INDUSTRY_OPTIONS,
		UNSUPPORTED_COMPANY_INDUSTRY_ID,
		isSupportedCompanyIndustry
	} from '$domain/company-industries';

	type Props = {
		name: string;
		industry: string;
		errorText: string | null;
		isSubmitting: boolean;
		onContinue: () => void;
	};

	let {
		name = $bindable(),
		industry = $bindable(),
		errorText,
		isSubmitting,
		onContinue
	}: Props = $props();
	const hasUnsupportedIndustry = $derived(industry === UNSUPPORTED_COMPANY_INDUSTRY_ID);
	const canContinue = $derived(
		name.trim().length > 0 && isSupportedCompanyIndustry(industry) && !isSubmitting
	);
</script>

<AuthStepFrame title="About your company">
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
			label="Your company's name"
			bind:value={name}
			autocomplete="organization"
			required
			autofocus
		/>
		<SelectMenu
			id="join-company-industry"
			ariaLabel="Select your company's industry"
			placeholder="Your company's industry"
			selectedId={industry || null}
			options={COMPANY_INDUSTRY_OPTIONS}
			onSelect={(selectedIndustry) => {
				industry = selectedIndustry;
			}}
			width="full"
			size="comfortable"
		/>
		{#if hasUnsupportedIndustry}
			<p class="m-0 text-sm leading-5 text-red-600">Overbase hasn't reached your industry yet</p>
		{/if}
		{#if errorText}
			<p class="m-0 text-sm leading-5 text-red-600">{errorText}</p>
		{/if}
		<AuthButton type="submit" disabled={!canContinue}>
			{isSubmitting ? 'Saving...' : 'Last step'}
		</AuthButton>
	</form>
</AuthStepFrame>
