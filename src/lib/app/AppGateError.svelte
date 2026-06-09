<script lang="ts">
	type Props = {
		message: string;
		onRetry: () => void;
	};

	let { message, onRetry }: Props = $props();
</script>

<div class="flex min-h-dvh items-center justify-center bg-white px-6 text-center text-[#202124]">
	<div class="w-full max-w-80">
		<p class="m-0 text-sm leading-6 text-stone-600">{message}</p>
		<button
			type="button"
			class="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-black px-4 text-sm font-semibold text-white outline-none transition hover:bg-[#202124] focus-visible:shadow-[0_0_0_3px_rgb(0_0_0_/_18%)]"
			onclick={onRetry}
		>
			Try again
		</button>
	</div>
</div>
