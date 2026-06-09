<script lang="ts">
	import type { PhosphorIcon } from './icons';

	type Props = {
		icon: PhosphorIcon;
		text: string;
	};

	let { icon: Icon, text }: Props = $props();
</script>

<aside
	class="flex items-start gap-2.5 rounded-[0.45rem] bg-info-50 px-3.5 py-3 text-info-400"
>
	<Icon size={16} weight="regular" class="mt-0.5 shrink-0" aria-hidden="true" />
	<p class="text-[0.72rem] leading-relaxed text-stone-800">
		{text}
	</p>
</aside>
