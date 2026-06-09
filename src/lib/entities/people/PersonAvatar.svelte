<script lang="ts">
	import Avatar from './Avatar.svelte';

	const DEFAULT_AVATAR_SRC = '/default-avatar.png';

	type PersonAvatarPerson = {
		name: string;
		avatarUrl?: string | null;
	};

	type Props = {
		person: PersonAvatarPerson;
		size?: number;
		alt?: string;
		class?: string;
	};

	let { person, size = 20, alt, class: classProp = '' }: Props = $props();
</script>

<Avatar
	src={person.avatarUrl}
	defaultSrc={DEFAULT_AVATAR_SRC}
	alt={alt ?? `${person.name} avatar`}
	{size}
	class={classProp}
/>
