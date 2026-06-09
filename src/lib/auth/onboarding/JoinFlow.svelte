<script lang="ts">
	import { goto, preloadData } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { api } from '$convex/_generated/api';
	import { SvelteMap } from 'svelte/reactivity';
	import {
		APP_DYNAMIC_ROUTE_IDS,
		AUTH_LINKS,
		createFormatsGalleryHref,
		type AppHref,
		type AuthEntryHref
	} from '$lib/app/app-links';
	import { useConvexClient } from 'convex-svelte';
	import { useSignIn, useSignUp } from 'svelte-clerk';
	import AuthButton from '$lib/auth/components/AuthButton.svelte';
	import AuthCodeStep from '$lib/auth/components/AuthCodeStep.svelte';
	import AuthEntryShell from '$lib/auth/components/AuthEntryShell.svelte';
	import AuthStepFrame from '$lib/auth/components/AuthStepFrame.svelte';
	import AuthTextInput from '$lib/auth/components/AuthTextInput.svelte';
	import { createClerkEmailCodeAuthController, getClerkErrorCode } from '$lib/auth/email-code-auth';
	import { buildAuthEntryHref } from '$lib/auth/navigation';
	import JoinFormatStarterStep from './JoinFormatStarterStep.svelte';
	import JoinCompanyStep from './JoinCompanyStep.svelte';
	import JoinPartnerStep from './JoinPartnerStep.svelte';
	import JoinWelcomeStep from './JoinWelcomeStep.svelte';
	import { getJoinFormatStarterRecommendation } from './join-format-starter';

	type JoinStep = 'welcome' | 'join' | 'code' | 'company' | 'partner' | 'formatStarter';

	type Props = {
		returnTo?: AppHref;
		returnButtonHref?: string;
		entryReturnHref?: AuthEntryHref;
		initialStep?: JoinStep;
		isSignedIn?: boolean;
	};

	let {
		returnTo,
		returnButtonHref,
		entryReturnHref,
		initialStep,
		isSignedIn = false
	}: Props = $props();

	const client = useConvexClient();
	const signUpState = useSignUp();
	const signInState = useSignIn();
	const authController = createClerkEmailCodeAuthController({
		getSignIn: () => signInState.signIn,
		getSignUp: () => signUpState.signUp
	});
	const getInitialStep = () => initialStep ?? (isSignedIn ? 'company' : 'welcome');

	let step = $state<JoinStep>(getInitialStep());
	let email = $state('');
	let verificationCode = $state('');
	let authErrorText = $state<string | null>(null);
	let isSubmittingEmail = $state(false);
	let isSubmittingCode = $state(false);
	let isResendingCode = $state(false);
	let company = $state({
		name: '',
		industry: ''
	});
	let partner = $state({
		name: '',
		collaboration: ''
	});
	let companyErrorText = $state<string | null>(null);
	let isSavingCompany = $state(false);
	const joinFormatStarter = $derived(getJoinFormatStarterRecommendation(company.industry));
	let completionErrorText = $state<string | null>(null);
	let completingFormatStarterSlug = $state<string | null>(null);
	let isOpeningFormatStarterGallery = $state(false);
	const formatStarterRoutePreloadPromises = new SvelteMap<string, Promise<void>>();

	const loginHref = $derived(
		buildAuthEntryHref(AUTH_LINKS.login.pathname, {
			returnTo,
			fromAuth: AUTH_LINKS.join.pathname
		})
	);
	const currentReturnButtonHref = $derived.by(() => {
		if (step === 'welcome') {
			return entryReturnHref ?? returnButtonHref;
		}

		if (step === 'company' && isSignedIn) {
			return returnButtonHref;
		}

		return undefined;
	});
	const currentReturnButtonClick = $derived.by<(() => void) | undefined>(() => {
		if (step === 'join') {
			return showWelcomeStep;
		}

		if (step === 'code') {
			return showEmailStep;
		}

		if (step === 'company' && !isSignedIn) {
			return showEmailStep;
		}

		if (step === 'partner') {
			return showCompanyStep;
		}

		return undefined;
	});
	const canContinue = $derived(email.trim().length > 0 && !isSubmittingEmail);
	const isCompletingOnboarding = $derived(
		Boolean(completingFormatStarterSlug) || isOpeningFormatStarterGallery
	);

	async function submitEmail() {
		const normalizedEmail = email.trim().toLowerCase();
		if (!normalizedEmail || isSubmittingEmail) return;

		isSubmittingEmail = true;
		authErrorText = null;
		verificationCode = '';

		try {
			await authController.sendJoinCode(normalizedEmail);
			email = normalizedEmail;
			step = 'code';
		} catch (error) {
			authErrorText =
				getClerkErrorCode(error) === 'form_identifier_exists'
					? 'An account already exists for that email.'
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

	async function saveCompany() {
		if (isSavingCompany) return;

		isSavingCompany = true;
		companyErrorText = null;

		try {
			await client.mutation(api.auth.saveOnboardingCompany, {
				companyName: company.name,
				companyIndustry: company.industry
			});
			step = 'partner';
		} catch (error) {
			companyErrorText = authController.getErrorMessage(error);
		} finally {
			isSavingCompany = false;
		}
	}

	function preloadFormatStarterRoute(formatStarterSlug: string) {
		const existingPreloadPromise = formatStarterRoutePreloadPromises.get(formatStarterSlug);

		if (existingPreloadPromise) {
			return existingPreloadPromise;
		}

		const preloadPromise = preloadData(
			resolve(APP_DYNAMIC_ROUTE_IDS.createFormat, { formatStarterSlug })
		).then(
			() => undefined,
			() => undefined
		);

		formatStarterRoutePreloadPromises.set(formatStarterSlug, preloadPromise);

		return preloadPromise;
	}

	async function selectFormatStarter(formatStarterSlug: string) {
		if (isCompletingOnboarding) return;

		completionErrorText = null;
		completingFormatStarterSlug = formatStarterSlug;

		try {
			await client.mutation(api.auth.markOnboardingComplete, {});
			await goto(resolve(APP_DYNAMIC_ROUTE_IDS.createFormat, { formatStarterSlug }));
		} catch (error) {
			completionErrorText = authController.getErrorMessage(error);
		} finally {
			completingFormatStarterSlug = null;
		}
	}

	async function openFormatStarterGallery() {
		if (isCompletingOnboarding) return;

		completionErrorText = null;
		isOpeningFormatStarterGallery = true;

		try {
			await client.mutation(api.auth.markOnboardingComplete, {});
			await goto(resolve(createFormatsGalleryHref({ industry: company.industry })));
		} catch (error) {
			completionErrorText = authController.getErrorMessage(error);
		} finally {
			isOpeningFormatStarterGallery = false;
		}
	}

	function showEmailStep() {
		authErrorText = null;
		step = 'join';
	}

	function showWelcomeStep() {
		authErrorText = null;
		step = 'welcome';
	}

	function showCompanyStep() {
		companyErrorText = null;
		step = 'company';
	}

	$effect(() => {
		if (step === 'formatStarter' && !joinFormatStarter) {
			step = 'company';
		}
	});

	$effect(() => {
		if (step === 'partner' && joinFormatStarter) {
			void preloadFormatStarterRoute(joinFormatStarter.slug);
		}
	});
</script>

{#if step === 'formatStarter'}
	{#if joinFormatStarter}
		<JoinFormatStarterStep
			formatStarter={joinFormatStarter}
			completionErrorText={completionErrorText}
			isSelectingFormatStarter={Boolean(completingFormatStarterSlug)}
			isOpeningFormatStarterGallery={isOpeningFormatStarterGallery}
			onSelect={() => void selectFormatStarter(joinFormatStarter.slug)}
			onPreload={() => void preloadFormatStarterRoute(joinFormatStarter.slug)}
			onOpenFormatStarterGallery={() => void openFormatStarterGallery()}
		/>
	{/if}
{:else}
	<AuthEntryShell
		accent="link"
		onReturnButtonClick={currentReturnButtonClick}
		returnButtonHref={currentReturnButtonHref}
		showFooter={step === 'join'}
	>
		{#snippet footer()}
			<p class="m-0 text-[13px] leading-5 text-[#8f9297]">
					Already have an account?
					<a
						href={resolve(loginHref)}
						class="text-stone-500 underline underline-offset-2 transition-colors hover:text-[#202124]"
					>
					Log in
				</a>
			</p>
		{/snippet}

		{#if step === 'welcome'}
			<JoinWelcomeStep
				onContinue={() => {
					step = 'join';
				}}
			/>
		{:else if step === 'join'}
			<AuthStepFrame title="What's your email?">
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
					<AuthButton type="submit" disabled={!canContinue}>
						{isSubmittingEmail ? 'Sending...' : 'Email me a code'}
					</AuthButton>
					<p class="m-0 text-center text-[13px] leading-5 text-[#8f9297]">
						By continuing, you accept the
						<a
							href="https://overbase.app/legal/terms-of-service"
							class="text-stone-500 underline underline-offset-2 transition-colors hover:text-[#202124]"
							target="_blank"
							rel="external noopener noreferrer"
						>
							Terms of Service
						</a>
						and
						<a
							href="https://overbase.app/legal/dpa"
							class="text-stone-500 underline underline-offset-2 transition-colors hover:text-[#202124]"
							target="_blank"
							rel="external noopener noreferrer"
						>
							Privacy Policy
						</a>
					</p>
				</form>
			</AuthStepFrame>
		{:else if step === 'code'}
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
		{:else if step === 'company'}
			<JoinCompanyStep
				bind:name={company.name}
				bind:industry={company.industry}
				errorText={companyErrorText}
				isSubmitting={isSavingCompany}
				onContinue={() => {
					void saveCompany();
				}}
			/>
		{:else if step === 'partner'}
			<JoinPartnerStep
				bind:name={partner.name}
				bind:collaboration={partner.collaboration}
				onContinue={() => {
					step = 'formatStarter';
				}}
			/>
		{/if}
	</AuthEntryShell>
{/if}
