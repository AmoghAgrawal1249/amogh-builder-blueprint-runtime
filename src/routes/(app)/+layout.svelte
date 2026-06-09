<script lang="ts">
	import AppSessionGate from '$lib/app/AppSessionGate.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<AppSessionGate>
	{@render children()}
</AppSessionGate>
