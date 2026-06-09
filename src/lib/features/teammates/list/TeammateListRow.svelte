<script lang="ts">
	import { slide } from 'svelte/transition';
	import { Button } from '$lib/ui';
	import type { SelectableListItem } from '$lib/layout/list';

	export type TeammateItem = SelectableListItem & {
		email: string;
		role: string;
		displayName: string;
		isEditing: boolean;
		nameDraft: string;
		emailDraft: string;
		roleDraft: string;
		deleteLabel: string;
		saveLabel: string;
		deleteDisabled: boolean;
		saveDisabled: boolean;
		onEdit: () => void;
		onCancel: () => void;
		onSave: () => void | Promise<void>;
		onDelete: () => void | Promise<void>;
		onNameDraftChange: (name: string) => void;
		onEmailDraftChange: (email: string) => void;
		onRoleDraftChange: (role: string) => void;
	};

	type Props = {
		item: TeammateItem;
	};

	let { item }: Props = $props();
</script>

<div class="grid min-h-9 min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3">
	<span class="block min-w-0">
		<span class="block truncate text-[0.7rem] text-stone-950">{item.displayName}</span>
		{#if item.role}
			<span class="block truncate text-[0.68rem] text-stone-400">{item.role}</span>
		{/if}
	</span>
	{#if !item.isEditing}
		<Button
			variant="secondary"
			class="h-7 px-2.5 text-[0.7rem] font-medium"
			onclick={item.onEdit}
		>
			Edit
		</Button>
	{/if}
</div>

{#if item.isEditing}
	<div class="mt-2 min-w-0 overflow-hidden pb-2" transition:slide={{ duration: 140 }}>
		<div class="grid gap-2">
			<label class="min-w-0 text-[0.68rem] text-stone-700">
				<span class="sr-only">Name</span>
				<input
					type="text"
					placeholder="Name"
					value={item.nameDraft}
					oninput={(event) => item.onNameDraftChange(event.currentTarget.value)}
					class="h-8 w-full rounded-sm border border-stone-200/70 bg-white px-2.5 text-[0.74rem] text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400"
				/>
			</label>

			<label class="min-w-0 text-[0.68rem] text-stone-700">
				<span class="sr-only">Email</span>
				<input
					type="email"
					placeholder="Email"
					value={item.emailDraft}
					oninput={(event) => item.onEmailDraftChange(event.currentTarget.value)}
					class="h-8 w-full rounded-sm border border-stone-200/70 bg-white px-2.5 text-[0.74rem] text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400"
				/>
			</label>

			<label class="min-w-0 text-[0.68rem] text-stone-700">
				<span class="sr-only">Role</span>
				<input
					type="text"
					placeholder="Role"
					value={item.roleDraft}
					oninput={(event) => item.onRoleDraftChange(event.currentTarget.value)}
					class="h-8 w-full rounded-sm border border-stone-200/70 bg-white px-2.5 text-[0.74rem] text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400"
				/>
			</label>
		</div>

		<div class="mt-2 flex items-center justify-between gap-3">
			<Button
				disabled={item.deleteDisabled}
				class="h-7 bg-red-600 px-2.5 text-[0.7rem] font-medium text-white hover:bg-red-700 disabled:bg-red-200 disabled:text-red-50"
				onclick={() => void item.onDelete()}
			>
				{item.deleteLabel}
			</Button>
			<div class="flex items-center justify-end gap-2">
				<Button
					variant="secondary"
					disabled={item.saveDisabled}
					class="h-7 px-2.5 text-[0.7rem] font-medium"
					onclick={item.onCancel}
				>
					Cancel
				</Button>
				<Button
					disabled={item.saveDisabled}
					class="h-7 px-2.5 text-[0.7rem] font-medium"
					onclick={() => void item.onSave()}
				>
					{item.saveLabel}
				</Button>
			</div>
		</div>
	</div>
{/if}
