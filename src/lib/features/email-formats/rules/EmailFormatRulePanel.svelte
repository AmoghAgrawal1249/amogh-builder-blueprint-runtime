<script lang="ts">
	import FunnelSimpleIcon from 'phosphor-svelte/lib/FunnelSimpleIcon';
	import PlusIcon from 'phosphor-svelte/lib/PlusIcon';
	import TrashIcon from 'phosphor-svelte/lib/TrashIcon';
	import { Button, IconButton, InfoBar, InlineText } from '$lib/ui';
	import { cn } from '$lib/ui/cn';
	import type { InlineTextContent } from '$lib/ui/inline-text';
	import type { EmailFormatRule } from './types';

	type Props = {
		rules: EmailFormatRule[];
		onRulesChange: (rules: EmailFormatRule[]) => void;
		canSave?: boolean;
		onSave?: () => void;
		infoCard?: {
			label: string;
			content: InlineTextContent;
		};
		canEditRuleText?: boolean;
		canEditRuleList?: boolean;
	};

	let {
		rules,
		onRulesChange,
		canSave = false,
		onSave,
		infoCard,
		canEditRuleText = true,
		canEditRuleList = true
	}: Props = $props();

	function updateRule(ruleId: string, patch: Partial<EmailFormatRule>) {
		if (!canEditRuleText) {
			return;
		}

		onRulesChange(rules.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)));
	}

	function removeRule(ruleId: string) {
		if (!canEditRuleList) {
			return;
		}

		onRulesChange(rules.filter((rule) => rule.id !== ruleId));
	}

	function addRule() {
		if (!canEditRuleList) {
			return;
		}

		onRulesChange([
			...rules,
			{
				id: `custom-${crypto.randomUUID()}`,
				text: ''
			}
		]);
	}

</script>

<aside class="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-stone-50/50 text-stone-950">
	<div class="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 md:px-5">
		<div class="mb-3 flex items-center justify-between gap-3">
			<p class="text-[0.72rem] font-medium text-stone-950">Rules for this email format</p>
			{#if canEditRuleList}
				<Button variant="secondary" class="h-7 px-2.5 text-[0.68rem]" onclick={addRule}>
					{#snippet leading()}
						<PlusIcon size={14} weight="regular" />
					{/snippet}
					Add rule
				</Button>
			{/if}
		</div>

		{#if rules.length > 0}
			<div class="space-y-3">
				<div class="space-y-3.5">
					{#each rules as rule (rule.id)}
						<section class="overflow-hidden rounded-sm border border-stone-200/60 bg-white">
							<div class="px-3 py-3">
								<div class="flex items-start gap-2">
									<div class="min-w-0 flex-1">
										<textarea
											value={rule.text}
											aria-label="Rule"
											aria-readonly={!canEditRuleText}
											readonly={!canEditRuleText}
											tabindex={canEditRuleText ? undefined : -1}
											placeholder="Explain how this email format should behave"
											class={cn(
												'min-h-14 w-full resize-y border-0 bg-transparent p-0 text-[0.74rem] leading-[1.45] text-stone-900 outline-none placeholder:text-stone-400',
												!canEditRuleText && 'pointer-events-none text-stone-500'
											)}
											oninput={(event) => updateRule(rule.id, { text: event.currentTarget.value })}
										></textarea>
									</div>

									{#if canEditRuleList}
										<IconButton
											aria-label="Remove rule"
											variant="ghost"
											class="size-6 shrink-0 text-stone-400 hover:bg-red-50 hover:text-red-600"
											onclick={() => removeRule(rule.id)}
										>
											<TrashIcon size={12} weight="regular" />
										</IconButton>
									{/if}
								</div>
							</div>
						</section>
					{/each}
				</div>

				{#if infoCard}
					<InfoBar label={infoCard.label}>
						<InlineText
							content={infoCard.content}
							tooltipIdPrefix={`email-format-rule-info-${infoCard.label}`}
						/>
					</InfoBar>
				{/if}
			</div>
		{:else}
			<div class="flex min-h-60 flex-1 items-center justify-center px-3 py-8">
				<div class="flex max-w-52 flex-col items-center text-center">
					<FunnelSimpleIcon aria-hidden="true" size={20} weight="regular" class="mb-4 text-stone-950" />

					<h2 class="text-[0.78rem] leading-tight font-medium text-stone-950">No rules yet</h2>

					<p class="mt-2 text-[0.67rem] leading-relaxed text-stone-600">
						Give details about how this email format should behave, when it should fire and what data it should use
					</p>
				</div>
			</div>
		{/if}
	</div>

	{#if onSave}
		<div class="shrink-0 border-t border-stone-100 bg-white px-4 py-3 md:px-5">
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
	{/if}
</aside>
