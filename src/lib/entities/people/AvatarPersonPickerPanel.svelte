<script lang="ts">
	import MagnifyingGlassIcon from 'phosphor-svelte/lib/MagnifyingGlassIcon';
	import AvatarPersonPickerRow from './AvatarPersonPickerRow.svelte';
	import type { AvatarPersonPickerPerson } from './avatar-person-picker-types';

	type Props = {
		id: string;
		ariaLabel: string;
		searchLabel: string;
		searchPlaceholder: string;
		emptyLabel: string;
		panelStyle: string;
		visiblePeople: readonly AvatarPersonPickerPerson[];
		selectedIdSet: ReadonlySet<string>;
		minSelected: number;
		selectedCount: number;
		searchQuery: string;
		onSearchQueryChange: (value: string) => void;
		onTogglePerson: (personId: string) => void;
		panelRef?: HTMLDivElement | null;
		searchInputRef?: HTMLInputElement | null;
	};

	let {
		id,
		ariaLabel,
		searchLabel,
		searchPlaceholder,
		emptyLabel,
		panelStyle,
		visiblePeople,
		selectedIdSet,
		minSelected,
		selectedCount,
		searchQuery,
		onSearchQueryChange,
		onTogglePerson,
		panelRef = $bindable(null),
		searchInputRef = $bindable(null)
	}: Props = $props();
</script>

<div
	bind:this={panelRef}
	{id}
	role="dialog"
	aria-label={ariaLabel}
	class="fixed z-50 overflow-hidden rounded-sm border border-stone-200 bg-white text-left shadow-lg shadow-stone-950/5"
	style={panelStyle}
>
	<label class="sr-only" for={`${id}-search`}>{searchLabel}</label>
	<div class="relative border-b border-stone-100">
		<MagnifyingGlassIcon
			aria-hidden="true"
			size={14}
			weight="regular"
			class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-stone-400"
		/>
		<input
			bind:this={searchInputRef}
			id={`${id}-search`}
			type="search"
			value={searchQuery}
			placeholder={searchPlaceholder}
			class="h-9 w-full border-0 bg-white pr-3 pl-8 text-[0.72rem] text-stone-900 outline-none placeholder:text-stone-400"
			oninput={(event) => onSearchQueryChange(event.currentTarget.value)}
		/>
	</div>

	<div class="max-h-64 overflow-y-auto py-1">
		{#if visiblePeople.length > 0}
			{#each visiblePeople as person (person.id)}
				{@const selected = selectedIdSet.has(person.id)}
				<AvatarPersonPickerRow
					{person}
					{selected}
					removalBlocked={selected && selectedCount <= minSelected}
					onToggle={onTogglePerson}
				/>
			{/each}
		{:else}
			<p class="px-3 py-4 text-center text-[0.72rem] text-stone-500">{emptyLabel}</p>
		{/if}
	</div>
</div>
