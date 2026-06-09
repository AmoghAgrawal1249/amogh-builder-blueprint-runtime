import { tick } from 'svelte';
import type { SignInFutureResource, SignUpFutureResource } from '@clerk/shared/types';

type ClerkAuthMode = 'signUp' | 'signIn';
type ClerkMutationResult = { error: unknown | null };
type SignInEmailCodeFactor = Extract<
	SignInFutureResource['supportedFirstFactors'][number],
	{ strategy: 'email_code' }
>;

export type ClerkEmailCodeAuthController = {
	sendJoinCode(email: string): Promise<void>;
	sendLoginCode(email: string): Promise<void>;
	verifyCode(code: string): Promise<void>;
	resendCode(): Promise<void>;
	getErrorMessage(error: unknown): string;
};

type ClerkEmailCodeAuthControllerDeps = {
	getSignIn: () => SignInFutureResource | null;
	getSignUp: () => SignUpFutureResource | null;
	waitForClerkUpdate?: () => Promise<void>;
};

export function createClerkEmailCodeAuthController({
	getSignIn,
	getSignUp,
	waitForClerkUpdate = tick
}: ClerkEmailCodeAuthControllerDeps): ClerkEmailCodeAuthController {
	let mode: ClerkAuthMode | null = null;
	let signInEmailAddressId: string | null = null;
	let activeEmail: string | null = null;

	async function sendJoinCode(email: string) {
		const normalizedEmail = email.trim().toLowerCase();
		if (!normalizedEmail) {
			throw new Error('Enter your work email.');
		}

		resetActiveAttempt();
		await sendSignUpCode(normalizedEmail);
	}

	async function sendLoginCode(email: string) {
		const normalizedEmail = email.trim().toLowerCase();
		if (!normalizedEmail) {
			throw new Error('Enter your work email.');
		}

		resetActiveAttempt();
		await sendSignInCode(normalizedEmail);
	}

	async function verifyCode(code: string) {
		const normalizedCode = code.trim();
		if (!normalizedCode) {
			throw new Error('Enter your verification code.');
		}

		if (mode === 'signIn') {
			const signIn = requireSignIn();
			throwIfClerkError(await signIn.emailCode.verifyCode({ code: normalizedCode }));
			await waitForClerkUpdate();
			const verifiedSignIn = requireSignIn();
			assertSignInComplete(verifiedSignIn);
			throwIfClerkError(await verifiedSignIn.finalize());
			return;
		}

		if (mode === 'signUp') {
			const signUp = requireSignUp();
			throwIfClerkError(await signUp.verifications.verifyEmailCode({ code: normalizedCode }));
			await waitForClerkUpdate();
			const verifiedSignUp = requireSignUp();
			assertSignUpComplete(verifiedSignUp);
			throwIfClerkError(await verifiedSignUp.finalize());
			return;
		}

		throw new Error('Start the email verification again.');
	}

	async function resendCode() {
		if (mode === 'signIn') {
			const signIn = requireSignIn();

			if (signInEmailAddressId) {
				throwIfClerkError(
					await signIn.emailCode.sendCode({ emailAddressId: signInEmailAddressId })
				);
				return;
			}

			if (activeEmail) {
				await sendSignInCode(activeEmail);
				return;
			}
		}

		if (mode === 'signUp') {
			throwIfClerkError(await requireSignUp().verifications.sendEmailCode());
			return;
		}

		throw new Error('Start the email verification again.');
	}

	async function sendSignUpCode(email: string) {
		const signUp = requireSignUp();
		throwIfClerkError(await signUp.create({ emailAddress: email, legalAccepted: true }));
		throwIfClerkError(await signUp.verifications.sendEmailCode());
		mode = 'signUp';
		activeEmail = email;
		signInEmailAddressId = null;
	}

	async function sendSignInCode(email: string) {
		const signIn = requireSignIn();
		throwIfClerkError(await signIn.create({ identifier: email }));
		await waitForClerkUpdate();

		const emailFactor = requireSignIn().supportedFirstFactors.find(isEmailCodeFactor);
		if (!emailFactor) {
			throw new Error('Email code sign-in is not enabled in Clerk.');
		}

		throwIfClerkError(
			await requireSignIn().emailCode.sendCode({ emailAddressId: emailFactor.emailAddressId })
		);
		mode = 'signIn';
		activeEmail = email;
		signInEmailAddressId = emailFactor.emailAddressId;
	}

	function requireSignIn() {
		const signIn = getSignIn();
		if (!signIn) {
			throw new Error('Clerk is still loading.');
		}
		return signIn;
	}

	function requireSignUp() {
		const signUp = getSignUp();
		if (!signUp) {
			throw new Error('Clerk is still loading.');
		}
		return signUp;
	}

	function resetActiveAttempt() {
		mode = null;
		signInEmailAddressId = null;
		activeEmail = null;
	}

	return { sendJoinCode, sendLoginCode, verifyCode, resendCode, getErrorMessage };
}

function throwIfClerkError(result: ClerkMutationResult) {
	if (result.error) {
		throw result.error;
	}
}

export function getClerkErrorCode(error: unknown) {
	const clerkErrors = (error as { errors?: { code?: string }[] })?.errors;
	return clerkErrors?.[0]?.code ?? (error as { code?: string })?.code;
}

export function getErrorMessage(error: unknown) {
	const clerkErrors = (error as { errors?: { longMessage?: string; message?: string }[] })?.errors;
	const clerkError = error as { longMessage?: string; message?: string };
	return (
		clerkErrors?.[0]?.longMessage ??
		clerkErrors?.[0]?.message ??
		clerkError.longMessage ??
		clerkError.message ??
		(error instanceof Error ? error.message : 'Something went wrong.')
	);
}

function describeClerkFields(fields: readonly string[]) {
	return fields.length > 0 ? fields.join(', ') : 'none reported';
}

function assertSignInComplete(signIn: SignInFutureResource) {
	if (signIn.status !== 'complete') {
		throw new Error(`Clerk sign-in is not complete. Current status: ${signIn.status}.`);
	}
}

function assertSignUpComplete(signUp: SignUpFutureResource) {
	if (signUp.status !== 'complete') {
		throw new Error(
			`Clerk sign-up is not complete. Current status: ${signUp.status}. Missing required fields: ${describeClerkFields(signUp.missingFields)}.`
		);
	}
}

function isEmailCodeFactor(
	factor: SignInFutureResource['supportedFirstFactors'][number]
): factor is SignInEmailCodeFactor {
	return factor.strategy === 'email_code';
}
