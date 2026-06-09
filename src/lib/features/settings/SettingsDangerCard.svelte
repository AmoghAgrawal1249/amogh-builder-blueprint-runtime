<script lang="ts">
	import InfoIcon from 'phosphor-svelte/lib/InfoIcon';
	import { Button, destructiveButtonClass } from '$lib/ui';
	import DeleteAccountModal from './DeleteAccountModal.svelte';
	import SettingsCard from './SettingsCard.svelte';

	let modalOpen = $state(false);

	function openDeleteModal() {
		modalOpen = true;
	}

	function closeDeleteModal() {
		modalOpen = false;
	}
</script>

<SettingsCard
	title="Delete account"
	description="Permanently remove your account and delete all data"
>
	<div
		class="mt-4 flex min-h-9 items-center gap-2 rounded-sm bg-stone-100 px-3 text-[0.74rem] leading-5 text-stone-600"
	>
		<InfoIcon size={15} weight="regular" class="shrink-0 text-stone-500" />
		<p>Deleting your account permanently deletes all data on Overbase</p>
	</div>

	{#snippet footer()}
		<p>This action is not reversible</p>
	{/snippet}

	{#snippet action()}
		<Button
			class={destructiveButtonClass}
			onclick={openDeleteModal}
		>
			Delete account
		</Button>
	{/snippet}
</SettingsCard>

<DeleteAccountModal open={modalOpen} onClose={closeDeleteModal} />
