<script lang="ts">
	import { useClerkContext } from 'svelte-clerk';
	import {
		createClerkSessionVerification,
		type ClerkSessionVerificationFactor,
		getErrorMessage,
		isReverificationRequiredError
	} from '$lib/auth/clerk-session-verification.svelte';
	import { useViewerSession } from '$lib/auth/viewer-session.svelte';
	import { Button, destructiveButtonClass, ModalShell } from '$lib/ui';

	const CONFIRMATION_TEXT = 'delete my account';

	type ModalStep = 'confirmDeletion' | 'verifyIdentity';

	type Props = {
		open: boolean;
		onClose: () => void;
	};

	let { open, onClose }: Props = $props();
	const clerk = useClerkContext();
	const viewerSession = useViewerSession();
	const verification = createClerkSessionVerification({
		getSession: () => clerk.session,
		onComplete: retryDeleteAfterVerification
	});

	let step = $state<ModalStep>('confirmDeletion');
	let confirmationText = $state('');
	let deleteErrorText = $state<string | null>(null);
	let deleting = $state(false);
	let lastOpen = $state(false);

	const trimmedConfirmationText = $derived(confirmationText.trim());
	const canDeleteAccount = $derived(trimmedConfirmationText === CONFIRMATION_TEXT);
	const errorText = $derived(
		step === 'confirmDeletion' ? deleteErrorText : verification.errorText
	);
	const verificationTitle = $derived(getVerificationTitle(verification.factor));
	const verificationDescription = $derived(getVerificationDescription(verification.factor));
	const verificationInputType = $derived(
		verification.factor?.strategy === 'password' ? 'password' : 'text'
	);
	const verificationAutocomplete = $derived(
		verification.factor?.strategy === 'password' ? 'current-password' : 'one-time-code'
	);
	const verificationInputMode = $derived(getVerificationInputMode(verification.factor));
	const showVerificationInput = $derived(
		verification.factor !== null && verification.factor.strategy !== 'passkey'
	);
	const showPasskeyPrompt = $derived(
		verification.factor?.strategy === 'passkey' && verification.status === 'awaitingInput'
	);
	const verificationActionText = $derived(getVerificationActionText());

	$effect(() => {
		if (open && !lastOpen) {
			resetModalState();
		}

		lastOpen = open;
	});

	function resetModalState() {
		confirmationText = '';
		deleteErrorText = null;
		deleting = false;
		step = 'confirmDeletion';
		verification.reset();
	}

	function closeDeleteModal() {
		if (deleting || verification.busy) {
			return;
		}

		onClose();
		resetModalState();
	}

	function getVerificationTitle(factor: ClerkSessionVerificationFactor | null) {
		if (!factor) {
			return 'Verify your identity';
		}

		switch (factor.strategy) {
			case 'password':
				return 'Enter your password';
			case 'email_code':
				return 'Enter the email code';
			case 'phone_code':
				return 'Enter the phone code';
			case 'totp':
				return 'Enter your authenticator code';
			case 'backup_code':
				return 'Enter a backup code';
			case 'passkey':
				return 'Verify with your passkey';
		}
	}

	function getVerificationDescription(factor: ClerkSessionVerificationFactor | null) {
		if (!factor) {
			return 'Clerk requires identity verification before deleting this account.';
		}

		if (
			(factor.strategy === 'email_code' || factor.strategy === 'phone_code') &&
			factor.safeIdentifier
		) {
			return `Clerk sent a verification code to ${factor.safeIdentifier}.`;
		}

		if (factor.strategy === 'passkey') {
			return 'Use your passkey to verify this sensitive action with Clerk.';
		}

		return 'Clerk requires identity verification before deleting this account.';
	}

	function getVerificationInputMode(factor: ClerkSessionVerificationFactor | null) {
		switch (factor?.strategy) {
			case 'email_code':
			case 'phone_code':
			case 'totp':
				return 'numeric';
			case 'backup_code':
				return 'text';
			case 'password':
			case 'passkey':
			case undefined:
				return undefined;
		}
	}

	function getVerificationActionText() {
		if (verification.status === 'preparing') {
			return 'Preparing...';
		}

		if (verification.status === 'verifying') {
			return 'Verifying...';
		}

		return verification.factor?.strategy === 'passkey' ? 'Verify with passkey' : 'Verify and delete';
	}

	async function signOutDeletedUser() {
		try {
			await viewerSession.signOut();
		} catch {
			viewerSession.reset();
		}
	}

	async function completeDeletedUserSignOut() {
		await signOutDeletedUser();
		onClose();
		resetModalState();
	}

	function getDeletionContext() {
		if (!clerk.isLoaded || !clerk.user || !clerk.session) {
			return {
				ok: false,
				errorText: 'Unable to delete your account right now.'
			} as const;
		}

		if (!clerk.user.deleteSelfEnabled) {
			return {
				ok: false,
				errorText:
					'Clerk account self-deletion is disabled. Enable user self-deletion in the Clerk Dashboard.'
			} as const;
		}

		return {
			ok: true,
			user: clerk.user
		} as const;
	}

	function returnToConfirmationWithError(message: string) {
		step = 'confirmDeletion';
		verification.reset();
		deleteErrorText = message;
	}

	async function retryDeleteAfterVerification() {
		deleteErrorText = null;

		const deletionContext = getDeletionContext();

		if (!deletionContext.ok) {
			returnToConfirmationWithError(deletionContext.errorText);
			return;
		}

		deleting = true;

		try {
			await deletionContext.user.delete();
			await completeDeletedUserSignOut();
		} catch (error) {
			deleting = false;
			returnToConfirmationWithError(
				isReverificationRequiredError(error)
					? 'Clerk still requires identity verification before deleting this account. Please try again.'
					: getErrorMessage(error, 'Unable to delete your account.')
			);
		}
	}

	async function beginIdentityVerification() {
		step = 'verifyIdentity';
		await verification.start();
	}

	async function deleteAccount() {
		if (!canDeleteAccount || deleting || verification.busy) {
			return;
		}

		deleteErrorText = null;
		const deletionContext = getDeletionContext();

		if (!deletionContext.ok) {
			deleteErrorText = deletionContext.errorText;
			return;
		}

		deleting = true;

		try {
			await deletionContext.user.delete();
			await completeDeletedUserSignOut();
		} catch (error) {
			deleting = false;

			if (isReverificationRequiredError(error)) {
				await beginIdentityVerification();
				return;
			}

			deleteErrorText = getErrorMessage(error, 'Unable to delete your account.');
		}
	}
</script>

<ModalShell {open} title="Delete account" onClose={closeDeleteModal}>
	<div class="space-y-4">
		{#if step === 'confirmDeletion'}
			<p class="text-sm leading-6 text-stone-700">
				This permanently deletes your account. Overbase will remove workspace data after Clerk
				confirms deletion.
			</p>

			<div>
				<label for="delete-account-confirmation" class="block text-xs text-stone-950">
					Type <strong>"delete my account"</strong> to continue
				</label>
				<input
					id="delete-account-confirmation"
					type="text"
					bind:value={confirmationText}
					autocomplete="off"
					class="mt-2 h-9 w-full rounded-sm border border-stone-200/80 bg-white px-3 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400 disabled:bg-stone-50 disabled:text-stone-500"
					disabled={deleting}
					oninput={() => {
						deleteErrorText = null;
					}}
				/>
			</div>
		{:else}
			<div>
				<h3 class="text-sm leading-tight font-medium text-stone-950">
					{verificationTitle}
				</h3>
				<p class="mt-2 text-sm leading-6 text-stone-700">
					{verificationDescription}
				</p>
			</div>

			{#if verification.status === 'preparing'}
				<p class="text-[0.72rem] leading-5 text-stone-500">Preparing verification...</p>
			{:else if showVerificationInput}
				<div>
					<label for="delete-account-verification" class="block text-xs text-stone-950">
						{verificationTitle}
					</label>
					<input
						id="delete-account-verification"
						type={verificationInputType}
						bind:value={verification.input}
						autocomplete={verificationAutocomplete}
						inputmode={verificationInputMode}
						class="mt-2 h-9 w-full rounded-sm border border-stone-200/80 bg-white px-3 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400 disabled:bg-stone-50 disabled:text-stone-500"
						disabled={verification.busy || deleting}
						oninput={() => {
							verification.clearError();
						}}
					/>
				</div>
			{:else if showPasskeyPrompt}
				<p class="text-[0.72rem] leading-5 text-stone-500">
					Continue with the passkey prompt to verify your identity.
				</p>
			{/if}
		{/if}

		{#if errorText}
			<p class="text-[0.72rem] leading-5 text-red-700">{errorText}</p>
		{/if}
	</div>

	{#snippet footer()}
		{#if step === 'confirmDeletion'}
			<Button variant="secondary" disabled={deleting} onclick={closeDeleteModal}>Cancel</Button>
			<Button
				disabled={!canDeleteAccount || deleting || verification.busy}
				class={destructiveButtonClass}
				onclick={deleteAccount}
			>
				{deleting ? 'Deleting...' : 'Delete account'}
			</Button>
		{:else}
			<Button variant="secondary" disabled={deleting || verification.busy} onclick={closeDeleteModal}>
				Cancel
			</Button>
			<Button
				disabled={!verification.canSubmit || deleting || verification.busy}
				class={destructiveButtonClass}
				onclick={verification.submit}
			>
				{deleting ? 'Deleting...' : verificationActionText}
			</Button>
		{/if}
	{/snippet}
</ModalShell>
