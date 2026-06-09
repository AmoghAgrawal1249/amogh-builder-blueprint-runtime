<script lang="ts">
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { SUPPORTED_COMPANY_INDUSTRIES } from '$domain/company-industries';
	import { useCurrentWorkspaceContext } from '$lib/app/current-workspace.svelte';
	import { CompanyAvatar, PersonAvatar } from '$lib/entities/people';
	import { useConvexClient } from 'convex-svelte';
	import SettingsAvatarCard from '$lib/features/settings/SettingsAvatarCard.svelte';
	import SettingsDangerCard from '$lib/features/settings/SettingsDangerCard.svelte';
	import SettingsReadonlyFieldCard from '$lib/features/settings/SettingsReadonlyFieldCard.svelte';
	import SettingsSelectFieldCard from '$lib/features/settings/SettingsSelectFieldCard.svelte';
	import SettingsTextFieldCard from '$lib/features/settings/SettingsTextFieldCard.svelte';

	const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

	const currentWorkspace = useCurrentWorkspaceContext();
	const client = useConvexClient();
	const userName = $derived(currentWorkspace.user.displayName ?? '');
	const userDisplayLabel = $derived(
		currentWorkspace.user.displayName || currentWorkspace.identity.email
	);
	const userEmail = $derived(currentWorkspace.identity.email);
	const userAvatarUrl = $derived(currentWorkspace.user.avatar?.url ?? '');
	const workspaceName = $derived(currentWorkspace.workspace.name);
	const workspaceIndustry = $derived(currentWorkspace.workspace.industry);
	const workspaceAvatarUrl = $derived(currentWorkspace.workspace.avatar?.url ?? '');
	const avatarPreviewClass =
		'border border-stone-200/70 bg-stone-100 text-xl text-stone-500';

	let savingUserName = $state(false);
	let savingWorkspaceName = $state(false);
	let savingWorkspaceIndustry = $state(false);
	let uploadingUserAvatar = $state(false);
	let uploadingWorkspaceAvatar = $state(false);
	let userNameErrorText = $state<string | null>(null);
	let workspaceNameErrorText = $state<string | null>(null);
	let workspaceIndustryErrorText = $state<string | null>(null);
	let userAvatarErrorText = $state<string | null>(null);
	let workspaceAvatarErrorText = $state<string | null>(null);

	function getErrorMessage(error: unknown, fallback: string) {
		return error instanceof Error ? error.message : fallback;
	}

	async function saveUserName(displayName: string) {
		savingUserName = true;
		userNameErrorText = null;

		try {
			await client.mutation(api.settings.updateUserName, { displayName });
		} catch (error) {
			userNameErrorText = getErrorMessage(error, 'Unable to save your name.');
		} finally {
			savingUserName = false;
		}
	}

	async function saveWorkspaceName(name: string) {
		savingWorkspaceName = true;
		workspaceNameErrorText = null;

		try {
			await client.mutation(api.settings.updateWorkspaceName, { name });
		} catch (error) {
			workspaceNameErrorText = getErrorMessage(error, 'Unable to save company name.');
		} finally {
			savingWorkspaceName = false;
		}
	}

	async function saveWorkspaceIndustry(industry: string) {
		savingWorkspaceIndustry = true;
		workspaceIndustryErrorText = null;

		try {
			await client.mutation(api.settings.updateWorkspaceIndustry, { industry });
		} catch (error) {
			workspaceIndustryErrorText = getErrorMessage(error, 'Unable to save company industry.');
		} finally {
			savingWorkspaceIndustry = false;
		}
	}

	function validateAvatarFile(file: File) {
		if (!file.type.startsWith('image/')) {
			return 'Avatar file must be an image.';
		}

		if (file.size > MAX_AVATAR_BYTES) {
			return 'Avatar image must be 2 MB or smaller.';
		}

		return null;
	}

	async function uploadAvatar(file: File) {
		const uploadUrl = await client.mutation(api.settings.generateAvatarUploadUrl, {});
		const response = await fetch(uploadUrl, {
			method: 'POST',
			headers: { 'Content-Type': file.type },
			body: file
		});

		if (!response.ok) {
			throw new Error('Unable to upload avatar image.');
		}

		const result = (await response.json()) as { storageId?: Id<'_storage'> };

		if (!result.storageId) {
			throw new Error('Avatar upload did not return a storage ID.');
		}

		return result.storageId;
	}

	async function saveUserAvatar(file: File) {
		const validationErrorText = validateAvatarFile(file);
		userAvatarErrorText = validationErrorText;

		if (validationErrorText) {
			return;
		}

		uploadingUserAvatar = true;

		try {
			const storageId = await uploadAvatar(file);
			const result = await client.mutation(api.settings.saveUserAvatar, {
				storageId,
				fileName: file.name
			});

			if ('errorText' in result) {
				userAvatarErrorText = result.errorText;
				return;
			}

			userAvatarErrorText = null;
		} catch (error) {
			userAvatarErrorText = getErrorMessage(error, 'Unable to save user avatar.');
		} finally {
			uploadingUserAvatar = false;
		}
	}

	async function saveWorkspaceAvatar(file: File) {
		const validationErrorText = validateAvatarFile(file);
		workspaceAvatarErrorText = validationErrorText;

		if (validationErrorText) {
			return;
		}

		uploadingWorkspaceAvatar = true;

		try {
			const storageId = await uploadAvatar(file);
			const result = await client.mutation(api.settings.saveWorkspaceAvatar, {
				storageId,
				fileName: file.name
			});

			if ('errorText' in result) {
				workspaceAvatarErrorText = result.errorText;
				return;
			}

			workspaceAvatarErrorText = null;
		} catch (error) {
			workspaceAvatarErrorText = getErrorMessage(error, 'Unable to save company avatar.');
		} finally {
			uploadingWorkspaceAvatar = false;
		}
	}
</script>

<section class="flex h-full min-h-full w-full bg-white px-3 py-4 md:px-6 md:py-6">
	<div class="min-h-0 min-w-0 flex-1">
		<div class="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-10 md:gap-7 md:pb-16">
			<SettingsTextFieldCard
				title="Name"
				description="This is your visible name in Overbase."
				fieldId="settings-user-name"
				label="User name"
				value={userName}
				footerText="Use 32 characters at maximum."
				saving={savingUserName}
				errorText={userNameErrorText}
				onSave={saveUserName}
			/>

			<SettingsReadonlyFieldCard
				title="Email"
				description="This is the email address used to sign in to Overbase."
				fieldId="settings-user-email"
				label="Email address"
				value={userEmail}
				footerText="Email is managed by your sign-in provider."
			/>

			<SettingsTextFieldCard
				title="Company name"
				description="This is your company's visible name in Overbase."
				fieldId="settings-company-name"
				label="Company name"
				value={workspaceName}
				footerText="Use the company or department name your team recognizes."
				saving={savingWorkspaceName}
				errorText={workspaceNameErrorText}
				onSave={saveWorkspaceName}
			/>

			<SettingsSelectFieldCard
				title="Industry"
				description="This controls the starter formats Overbase shows for your company."
				fieldId="settings-company-industry"
				label="Company industry"
				value={workspaceIndustry}
				options={SUPPORTED_COMPANY_INDUSTRIES}
				placeholder="Company industry"
				footerText="Changing this updates your default create-formats category."
				saving={savingWorkspaceIndustry}
				errorText={workspaceIndustryErrorText}
				onSave={saveWorkspaceIndustry}
			/>

			<SettingsAvatarCard
				title="User avatar"
				description={["This is your personal avatar."]}
				footerText="An avatar is optional but helps team members recognize you."
				ariaLabel="Upload user avatar"
				uploading={uploadingUserAvatar}
				errorText={userAvatarErrorText}
				onFileSelected={saveUserAvatar}
			>
				{#snippet preview()}
					<PersonAvatar
						person={{ name: userDisplayLabel, avatarUrl: userAvatarUrl }}
						size={68}
						class={`${avatarPreviewClass} ${uploadingUserAvatar ? 'opacity-55' : ''}`}
					/>
				{/snippet}
			</SettingsAvatarCard>

			<SettingsAvatarCard
				title="Company avatar"
				description={["This is your company's avatar."]}
				footerText="An avatar is optional but strongly recommended."
				ariaLabel="Upload company avatar"
				uploading={uploadingWorkspaceAvatar}
				errorText={workspaceAvatarErrorText}
				onFileSelected={saveWorkspaceAvatar}
			>
				{#snippet preview()}
					<CompanyAvatar
						company={{ name: workspaceName, avatarUrl: workspaceAvatarUrl }}
						size={68}
						class={`${avatarPreviewClass} ${uploadingWorkspaceAvatar ? 'opacity-55' : ''}`}
					/>
				{/snippet}
			</SettingsAvatarCard>

			<SettingsDangerCard />
		</div>
	</div>
</section>
