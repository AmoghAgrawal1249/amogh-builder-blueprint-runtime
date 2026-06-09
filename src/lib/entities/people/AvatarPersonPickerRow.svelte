<script lang="ts">
	import CheckIcon from 'phosphor-svelte/lib/CheckIcon';
	import { cn } from '$lib/ui/cn';
	import PersonAvatar from './PersonAvatar.svelte';
	import type { AvatarPersonPickerPerson } from './avatar-person-picker-types';

	type Props = {
		person: AvatarPersonPickerPerson;
		selected: boolean;
		removalBlocked: boolean;
		onToggle: (personId: string) => void;
	};

	let { person, selected, removalBlocked, onToggle }: Props = $props();
</script>

<button
	type="button"
	role="checkbox"
	aria-checked={selected}
	aria-disabled={removalBlocked}
	disabled={removalBlocked}
	class={cn(
		'flex h-9 w-full items-center gap-2 px-2.5 text-left transition-colors hover:bg-stone-50 disabled:cursor-default disabled:hover:bg-white',
		selected ? 'text-stone-950' : 'text-stone-700'
	)}
	onclick={() => onToggle(person.id)}
>
	<PersonAvatar
		{person}
		size={22}
		class="border border-stone-100"
		alt={`${person.name} avatar`}
	/>
	<span class="min-w-0 flex-1 truncate text-[0.72rem] font-normal">{person.name}</span>
	<span
		class={cn(
			'inline-flex size-4 shrink-0 items-center justify-center rounded-full border',
			selected ? 'border-stone-950 bg-stone-950 text-white' : 'border-stone-200 text-transparent'
		)}
		aria-hidden="true"
	>
		<CheckIcon size={10} weight="bold" />
	</span>
</button>
