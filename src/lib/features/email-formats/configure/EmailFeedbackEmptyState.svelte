<script lang="ts">
	import ChatCircleIcon from 'phosphor-svelte/lib/ChatCircleIcon';
</script>

<section class="flex h-full min-h-0 items-center justify-center bg-stone-50/50 px-5 py-8">
	<div class="flex max-w-60 flex-col items-center text-center">
		<ChatCircleIcon aria-hidden="true" size={20} weight="regular" class="mb-4 text-stone-950" />

		<h2 class="text-[0.78rem] leading-tight font-medium text-stone-950">
			No sent emails yet
		</h2>

		<p class="mt-2 text-[0.67rem] leading-relaxed text-stone-600">
			Once this email format sends emails, you can give feedback on specific sent emails and train the AI on what to improve.
		</p>
	</div>
</section>
