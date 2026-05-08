<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children?: Snippet;
	};

	let { children }: Props = $props();

</script>

<div class="hidden h-full min-h-full min-w-0 md:block">
	{@render children?.()}
</div>
