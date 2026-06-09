<script lang="ts">
	import Avatar from './Avatar.svelte';

	const DEFAULT_COMPANY_AVATAR_SRC = '/default-company-avatar.png';

	type CompanyAvatarCompany = {
		name: string;
		avatarUrl?: string | null;
	};

	type Props = {
		company: CompanyAvatarCompany;
		size?: number;
		alt?: string;
		class?: string;
	};

	let { company, size = 20, alt, class: classProp = '' }: Props = $props();
</script>

<Avatar
	src={company.avatarUrl}
	defaultSrc={DEFAULT_COMPANY_AVATAR_SRC}
	alt={alt ?? `${company.name} avatar`}
	{size}
	class={classProp}
/>
