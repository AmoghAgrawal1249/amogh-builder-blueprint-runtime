<script lang="ts">
	import { resolve } from '$app/paths';
	import { APP_CONFIG } from '$lib/app/app-config';
	import { DEFAULT_APP_LINK } from '$lib/app/app-links';
	import { cn } from '$lib/ui/cn';

	type Props = {
		class?: string;
		onclick?: (event: MouseEvent) => void;
	};

	let { class: className = '', onclick }: Props = $props();
</script>

<a
	href={resolve(DEFAULT_APP_LINK.pathname)}
	aria-label={`Go to ${APP_CONFIG.name}`}
	class={cn('overflow-hidden rounded-sm', className)}
	{onclick}
>
	<img src={APP_CONFIG.logoUrl} alt={APP_CONFIG.logoAlt} class="size-6 shrink-0" />
</a>
