<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		to: Snippet;
		cc: Snippet;
		attachment: Snippet;
		body: Snippet;
	};

	let { to, cc, attachment, body }: Props = $props();
</script>

<div class="email-compose-document flex min-h-full w-full flex-1 flex-col">
	<div class="flex h-8 items-stretch gap-2.5">
		<div
			class="flex h-8 w-12 shrink-0 items-center justify-center rounded-sm border border-stone-200 bg-white text-[0.64rem] font-medium text-stone-950"
		>
			To
		</div>
		<div class="email-compose-line-field flex h-8 min-w-0 flex-1 items-center border-b border-stone-200">
			{@render to()}
		</div>
	</div>

	<div class="mt-3 flex h-8 items-stretch gap-2.5">
		<div
			class="flex h-8 w-12 shrink-0 items-center justify-center rounded-sm border border-stone-200 bg-white text-[0.64rem] font-medium text-stone-950"
		>
			Cc
		</div>
		<div class="email-compose-line-field flex h-8 min-w-0 flex-1 items-center border-b border-stone-200">
			{@render cc()}
		</div>
	</div>

	<div class="border-b border-stone-200 py-2 text-[0.76rem] leading-snug">
		<div class="email-compose-attachment-field flex h-9 min-w-0 items-center">
			{@render attachment()}
		</div>
	</div>

	<div class="email-compose-body-field pt-5 text-[0.76rem] leading-[1.52]">
		{@render body()}
	</div>
</div>

<style>
	.email-compose-line-field :global(input) {
		height: 100%;
	}

	.email-compose-line-field :global(p) {
		min-width: 0;
	}

	.email-compose-attachment-field :global(input) {
		height: auto;
		line-height: inherit;
	}

	.email-compose-body-field {
		min-height: calc(1.52em * 4 + 1.25rem);
	}

	.email-compose-body-field :global(textarea) {
		min-height: calc(1.52em * 4);
		field-sizing: content;
	}
</style>
