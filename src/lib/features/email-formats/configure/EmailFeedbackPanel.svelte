<script lang="ts">
	import { Button, InfoBar } from '$lib/ui';

	type Props = {
		likedValue: string;
		improvementValue: string;
		canSave: boolean;
		onLikedValueChange: (value: string) => void;
		onImprovementValueChange: (value: string) => void;
		onSave: () => void;
	};

	let {
		likedValue,
		improvementValue,
		canSave,
		onLikedValueChange,
		onImprovementValueChange,
		onSave
	}: Props = $props();
</script>

<aside class="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-stone-50/50 text-stone-950">
	<div class="flex min-h-0 flex-1 flex-col px-4 py-4 md:px-5">
		<div class="flex min-h-0 flex-1 flex-col gap-4">
			<section class="flex min-h-0 flex-1 flex-col">
				<label for="feedback-liked" class="mb-3 text-[0.72rem] font-medium text-stone-950">
					What I like
				</label>

				<textarea
					id="feedback-liked"
					value={likedValue}
					aria-label="What I like"
					placeholder="What worked well in this opportunity?"
					class="min-h-0 w-full flex-1 resize-none rounded-sm border border-stone-200/60 bg-white px-3 py-3 text-[0.76rem] leading-[1.45] text-stone-900 outline-none placeholder:text-stone-400"
					oninput={(event) => onLikedValueChange(event.currentTarget.value)}
				></textarea>
			</section>

			<section class="flex min-h-0 flex-1 flex-col">
				<label for="feedback-improved" class="mb-3 text-[0.72rem] font-medium text-stone-950">
					Could be improved next time
				</label>

				<textarea
					id="feedback-improved"
					value={improvementValue}
					aria-label="Could be improved next time"
					placeholder="What should change before the next send?"
					class="min-h-0 w-full flex-1 resize-none rounded-sm border border-stone-200/60 bg-white px-3 py-3 text-[0.76rem] leading-[1.45] text-stone-900 outline-none placeholder:text-stone-400"
					oninput={(event) => onImprovementValueChange(event.currentTarget.value)}
				></textarea>
			</section>

			<InfoBar label="Next step:" class="shrink-0">
				Train the AI by telling us what you like and don't like about this specific opportunity
			</InfoBar>
		</div>
	</div>

	<div class="shrink-0 bg-white px-4 py-3 md:px-5">
		<div class="flex items-center justify-end">
			<Button
				variant="secondary"
				class="px-3 text-[0.74rem] text-stone-800"
				disabled={!canSave}
				onclick={onSave}
			>
				Save changes
			</Button>
		</div>
	</div>
</aside>
