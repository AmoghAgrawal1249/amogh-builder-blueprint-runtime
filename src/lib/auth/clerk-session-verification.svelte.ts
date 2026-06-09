import type {
	SessionResource,
	SessionVerificationFirstFactor,
	SessionVerificationResource,
	SessionVerificationSecondFactor,
	SessionVerifyPrepareFirstFactorParams,
	SessionVerifyPrepareSecondFactorParams
} from '@clerk/shared/types';

const CLERK_REVERIFICATION_REQUIRED_CODE = 'session_reverification_required';

export type ClerkSessionVerificationStatus = 'idle' | 'preparing' | 'awaitingInput' | 'verifying';
export type ClerkSessionVerificationFactor =
	| { level: 'first_factor'; strategy: 'password' }
	| {
			level: 'first_factor';
			strategy: 'email_code';
			safeIdentifier: string;
	  }
	| {
			level: 'first_factor';
			strategy: 'phone_code';
			safeIdentifier: string;
	  }
	| { level: 'first_factor'; strategy: 'passkey' }
	| {
			level: 'second_factor';
			strategy: 'phone_code';
			safeIdentifier: string;
	  }
	| { level: 'second_factor'; strategy: 'totp' }
	| { level: 'second_factor'; strategy: 'backup_code' };

type SupportedFirstFactor = Extract<
	SessionVerificationFirstFactor,
	{ strategy: 'password' | 'email_code' | 'phone_code' | 'passkey' }
>;
type SupportedSecondFactor = Extract<
	SessionVerificationSecondFactor,
	{ strategy: 'phone_code' | 'totp' | 'backup_code' }
>;

type CreateClerkSessionVerificationOptions = {
	getSession: () => SessionResource | null | undefined;
	onComplete: () => Promise<void> | void;
};
type ClerkErrorLike = {
	code?: string;
	longMessage?: string;
	message?: string;
};

export function createClerkSessionVerification(options: CreateClerkSessionVerificationOptions) {
	let status = $state<ClerkSessionVerificationStatus>('idle');
	let factor = $state<ClerkSessionVerificationFactor | null>(null);
	let input = $state('');
	let errorText = $state<string | null>(null);

	const trimmedInput = $derived(input.trim());
	const busy = $derived(status === 'preparing' || status === 'verifying');
	const canSubmit = $derived(
		status === 'awaitingInput' &&
			factor !== null &&
			(factor.strategy === 'passkey' || trimmedInput.length > 0)
	);

	function reset() {
		status = 'idle';
		factor = null;
		input = '';
		errorText = null;
	}

	function clearError() {
		errorText = null;
	}

	function setUnsupportedFactorError() {
		status = 'idle';
		factor = null;
		errorText = 'This action requires a verification method that is not supported here.';
	}

	function getSession(fallback: string) {
		const session = options.getSession();

		if (!session) {
			errorText = fallback;
			status = 'idle';
			return null;
		}

		return session;
	}

	async function start() {
		reset();
		status = 'preparing';

		const session = getSession('Unable to start identity verification right now.');

		if (!session) {
			return;
		}

		try {
			await handleVerificationResult(await session.startVerification({ level: 'second_factor' }));
		} catch (error) {
			errorText = getErrorMessage(error, 'Unable to start identity verification.');
			status = 'idle';
		}
	}

	async function submit() {
		if (!canSubmit || !factor || busy) {
			return;
		}

		if (factor.strategy === 'passkey') {
			await verifyWithPasskey();
			return;
		}

		errorText = null;
		status = 'verifying';

		const session = getSession('Unable to verify your identity right now.');

		if (!session) {
			status = 'awaitingInput';
			return;
		}

		try {
			if (factor.level === 'first_factor') {
				const result =
					factor.strategy === 'password'
						? await session.attemptFirstFactorVerification({
								strategy: 'password',
								password: input
							})
						: await session.attemptFirstFactorVerification({
								strategy: factor.strategy,
								code: trimmedInput
							});

				await handleVerificationAttemptResult(result);
				return;
			}

			await handleVerificationAttemptResult(
				await session.attemptSecondFactorVerification({
					strategy: factor.strategy,
					code: trimmedInput
				})
			);
		} catch (error) {
			errorText = getErrorMessage(error, 'Unable to verify your identity.');
			status = 'awaitingInput';
		}
	}

	async function verifyWithPasskey() {
		errorText = null;
		status = 'verifying';

		const session = getSession('Unable to verify your identity right now.');

		if (!session) {
			status = 'awaitingInput';
			return;
		}

		try {
			await handleVerificationAttemptResult(await session.verifyWithPasskey());
		} catch (error) {
			errorText = getErrorMessage(error, 'Unable to verify your passkey.');
			status = 'awaitingInput';
		}
	}

	async function handleVerificationResult(result: SessionVerificationResource) {
		errorText = null;

		if (result.status === 'complete') {
			await options.onComplete();
			return;
		}

		if (result.status === 'needs_first_factor') {
			await prepareFirstFactorVerification(result);
			return;
		}

		await prepareSecondFactorVerification(result);
	}

	async function handleVerificationAttemptResult(result: SessionVerificationResource) {
		const verificationError = getVerificationError(result, factor);

		if (verificationError) {
			errorText =
				verificationError.longMessage ??
				verificationError.message ??
				'Unable to verify your identity.';
			status = 'awaitingInput';
			return;
		}

		input = '';
		await handleVerificationResult(result);
	}

	async function prepareFirstFactorVerification(result: SessionVerificationResource) {
		const supportedFactor = findSupportedFirstFactor(result.supportedFirstFactors);

		if (!supportedFactor) {
			setUnsupportedFactorError();
			return;
		}

		input = '';

		switch (supportedFactor.strategy) {
			case 'password':
				factor = { level: 'first_factor', strategy: 'password' };
				status = 'awaitingInput';
				return;
			case 'email_code':
			case 'phone_code': {
				const preparationParams = getFirstFactorPreparationParams(supportedFactor);

				if (!preparationParams) {
					setUnsupportedFactorError();
					return;
				}

				factor = {
					level: 'first_factor',
					strategy: supportedFactor.strategy,
					safeIdentifier: supportedFactor.safeIdentifier
				};
				status = 'preparing';

				const session = getSession('Unable to prepare identity verification right now.');

				if (!session) {
					return;
				}

				try {
					await session.prepareFirstFactorVerification(preparationParams);
					status = 'awaitingInput';
				} catch (error) {
					errorText = getErrorMessage(error, 'Unable to prepare identity verification.');
					status = 'idle';
				}
				return;
			}
			case 'passkey':
				factor = { level: 'first_factor', strategy: 'passkey' };
				status = 'awaitingInput';
				await verifyWithPasskey();
		}
	}

	async function prepareSecondFactorVerification(result: SessionVerificationResource) {
		const supportedFactor = findSupportedSecondFactor(result.supportedSecondFactors);

		if (!supportedFactor) {
			setUnsupportedFactorError();
			return;
		}

		input = '';

		switch (supportedFactor.strategy) {
			case 'phone_code': {
				const preparationParams = getSecondFactorPreparationParams(supportedFactor);

				if (!preparationParams) {
					setUnsupportedFactorError();
					return;
				}

				factor = {
					level: 'second_factor',
					strategy: 'phone_code',
					safeIdentifier: supportedFactor.safeIdentifier
				};
				status = 'preparing';

				const session = getSession('Unable to prepare identity verification right now.');

				if (!session) {
					return;
				}

				try {
					await session.prepareSecondFactorVerification(preparationParams);
					status = 'awaitingInput';
				} catch (error) {
					errorText = getErrorMessage(error, 'Unable to prepare identity verification.');
					status = 'idle';
				}
				return;
			}
			case 'totp':
				factor = { level: 'second_factor', strategy: 'totp' };
				status = 'awaitingInput';
				return;
			case 'backup_code':
				factor = { level: 'second_factor', strategy: 'backup_code' };
				status = 'awaitingInput';
		}
	}

	return {
		get status() {
			return status;
		},
		get factor() {
			return factor;
		},
		get input() {
			return input;
		},
		set input(value: string) {
			input = value;
		},
		get errorText() {
			return errorText;
		},
		get busy() {
			return busy;
		},
		get canSubmit() {
			return canSubmit;
		},
		clearError,
		reset,
		start,
		submit
	};
}

export function getErrorMessage(error: unknown, fallback: string) {
	const clerkError = getClerkErrors(error)[0];
	const topLevelError = getClerkErrorLike(error);

	return (
		clerkError?.longMessage ??
		clerkError?.message ??
		topLevelError?.longMessage ??
		topLevelError?.message ??
		(error instanceof Error ? error.message : fallback)
	);
}

export function isReverificationRequiredError(error: unknown) {
	return getClerkErrorCode(error) === CLERK_REVERIFICATION_REQUIRED_CODE;
}

export function getClerkErrorCode(error: unknown) {
	return getClerkErrors(error)[0]?.code ?? getClerkErrorLike(error)?.code;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function getClerkErrorLike(value: unknown): ClerkErrorLike | null {
	if (!isRecord(value)) {
		return null;
	}

	return {
		code: getStringProperty(value, 'code'),
		longMessage: getStringProperty(value, 'longMessage'),
		message: getStringProperty(value, 'message')
	};
}

function getStringProperty(value: Record<string, unknown>, key: string) {
	const property = value[key];
	return typeof property === 'string' ? property : undefined;
}

function getClerkErrors(error: unknown) {
	if (!isRecord(error) || !Array.isArray(error.errors)) {
		return [];
	}

	return error.errors.map(getClerkErrorLike).filter((clerkError) => clerkError !== null);
}

function getVerificationError(
	result: SessionVerificationResource,
	factor: ClerkSessionVerificationFactor | null
) {
	if (!factor) {
		return null;
	}

	return factor.level === 'first_factor'
		? result.firstFactorVerification.error
		: result.secondFactorVerification.error;
}

function findSupportedFirstFactor(factors: SessionVerificationFirstFactor[] | null) {
	return (
		factors?.find((factor): factor is SupportedFirstFactor => {
			return (
				factor.strategy === 'password' ||
				factor.strategy === 'email_code' ||
				factor.strategy === 'phone_code' ||
				factor.strategy === 'passkey'
			);
		}) ?? null
	);
}

function findSupportedSecondFactor(factors: SessionVerificationSecondFactor[] | null) {
	return (
		factors?.find((factor): factor is SupportedSecondFactor => {
			return (
				factor.strategy === 'phone_code' ||
				factor.strategy === 'totp' ||
				factor.strategy === 'backup_code'
			);
		}) ?? null
	);
}

function getFirstFactorPreparationParams(
	factor: SupportedFirstFactor
): SessionVerifyPrepareFirstFactorParams | null {
	switch (factor.strategy) {
		case 'email_code':
			return {
				strategy: 'email_code',
				emailAddressId: factor.emailAddressId
			};
		case 'phone_code':
			return {
				strategy: 'phone_code',
				phoneNumberId: factor.phoneNumberId,
				channel: factor.channel
			};
		case 'passkey':
		case 'password':
			return null;
	}
}

function getSecondFactorPreparationParams(
	factor: SupportedSecondFactor
): SessionVerifyPrepareSecondFactorParams | null {
	if (factor.strategy !== 'phone_code') {
		return null;
	}

	return {
		strategy: 'phone_code',
		phoneNumberId: factor.phoneNumberId
	};
}
