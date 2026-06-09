<script lang="ts">
	import { resolve } from '$app/paths';
	import { useSignIn, useSignUp } from 'svelte-clerk';
	import { AUTH_LINKS, type AppHref, type AuthEntryHref } from '$lib/app/app-links';
	import AuthCodeStep from '$lib/auth/components/AuthCodeStep.svelte';
	import AuthEntryShell from '$lib/auth/components/AuthEntryShell.svelte';
	import AuthHotkeyButton from '$lib/auth/components/AuthHotkeyButton.svelte';
	import AuthStepFrame from '$lib/auth/components/AuthStepFrame.svelte';
	import AuthTextInput from '$lib/auth/components/AuthTextInput.svelte';
	import { buildAuthEntryHref } from '$lib/auth/navigation';
	import { createClerkEmailCodeAuthController, getClerkErrorCode } from '$lib/auth/email-code-auth';

	type LoginStep = 'login' | 'code';

	type Props = {
		returnTo?: AppHref;
		returnButtonHref?: string;
		entryReturnHref?: AuthEntryHref;
	};

	let { returnTo, returnButtonHref, entryReturnHref }: Props = $props();

	const signUpState = useSignUp();
	const signInState = useSignIn();
	const authController = createClerkEmailCodeAuthController({
		getSignIn: () => signInState.signIn,
		getSignUp: () => signUpState.signUp
	});

	let step = $state<LoginStep>('login');
	let email = $state('');
	let verificationCode = $state('');
	let authErrorText = $state<string | null>(null);
	let isSubmittingEmail = $state(false);
	let isSubmittingCode = $state(false);
	let isResendingCode = $state(false);

	const joinHref = $derived(
		buildAuthEntryHref(AUTH_LINKS.join.pathname, {
			returnTo,
			fromAuth: AUTH_LINKS.login.pathname
		})
	);
	const currentReturnButtonHref = $derived(
		step === 'login' ? (entryReturnHref ?? returnButtonHref) : undefined
	);
	const canContinue = $derived(email.trim().length > 0 && !isSubmittingEmail);

	async function submitEmail() {
		const normalizedEmail = email.trim().toLowerCase();
		if (!normalizedEmail || isSubmittingEmail) return;

		isSubmittingEmail = true;
		authErrorText = null;
		verificationCode = '';

		try {
			await authController.sendLoginCode(normalizedEmail);
			email = normalizedEmail;
			step = 'code';
		} catch (error) {
			authErrorText =
				getClerkErrorCode(error) === 'form_identifier_not_found'
					? "Couldn't find your account."
					: authController.getErrorMessage(error);
		} finally {
			isSubmittingEmail = false;
		}
	}

	async function submitCode() {
		const code = verificationCode.trim();
		if (!code || isSubmittingCode) return;

		isSubmittingCode = true;
		authErrorText = null;

		try {
			await authController.verifyCode(code);
		} catch (error) {
			authErrorText = authController.getErrorMessage(error);
		} finally {
			isSubmittingCode = false;
		}
	}

	async function resendCode() {
		if (isResendingCode) return;

		isResendingCode = true;
		authErrorText = null;

		try {
			await authController.resendCode();
		} catch (error) {
			authErrorText = authController.getErrorMessage(error);
		} finally {
			isResendingCode = false;
		}
	}

	function showEmailStep() {
		authErrorText = null;
		step = 'login';
	}
</script>

<AuthEntryShell
	accent="link"
	onReturnButtonClick={step === 'code' ? showEmailStep : undefined}
	returnButtonHref={currentReturnButtonHref}
	showFooter={step === 'login'}
>
	{#snippet footer()}
		<p class="m-0 text-[13px] leading-5 text-[#8f9297]">
			Need an account?
			<a
				href={resolve(joinHref)}
				class="text-stone-500 underline underline-offset-2 transition-colors hover:text-[#202124]"
			>
				Join
			</a>
		</p>
	{/snippet}

	{#if step === 'login'}
		<AuthStepFrame title="Log in to Overbase">
			<form
				class="grid gap-3.5"
				onsubmit={(event) => {
					event.preventDefault();
					if (canContinue) {
						void submitEmail();
					}
				}}
			>
				<AuthTextInput
					label="Your work email"
					bind:value={email}
					type="email"
					autocomplete="email"
					required
					autofocus
					invalid={Boolean(authErrorText)}
				/>
				{#if authErrorText}
					<p class="m-0 text-sm leading-5 text-[#ff3a1e]">{authErrorText}</p>
				{/if}
				<AuthHotkeyButton type="submit" disabled={!canContinue}>
					{isSubmittingEmail ? 'Sending...' : 'Email me a code'}
				</AuthHotkeyButton>
			</form>
		</AuthStepFrame>
	{:else}
		<AuthCodeStep
			email={email}
			bind:code={verificationCode}
			errorText={authErrorText}
			isSubmitting={isSubmittingCode}
			isResending={isResendingCode}
			onSubmit={() => void submitCode()}
			onResend={() => void resendCode()}
			onChangeEmail={showEmailStep}
		/>
	{/if}
</AuthEntryShell>
