<script lang="ts">
	import { EmailFormatRulePanel } from '$lib/features/email-formats/rules';
	import type { EmailFormatRule } from './email-format-configure-types';
	import type {
		EmailFormatInlineTextContent,
		EmailFormatRulesEditPolicy
	} from '$domain/email-formats';
	import SectionConflictActions from './SectionConflictActions.svelte';

const EDIT_ALL_RULE_FIELDS = {
	text: true,
	list: true
} satisfies EmailFormatRulesEditPolicy;

	type Props = {
		rules: EmailFormatRule[];
		editPolicy: EmailFormatRulesEditPolicy | null;
		canSave: boolean;
		conflict: boolean;
		isSaving?: boolean;
		ruleInfoCard?: {
			label: string;
			content: EmailFormatInlineTextContent;
		} | null;
		onRulesChange: (rules: EmailFormatRule[]) => void;
		onSave: () => void;
		onKeepMine: () => void | Promise<void>;
		onUseLatest: () => void;
	};

	let {
		rules,
		editPolicy,
		canSave,
		conflict,
		isSaving = false,
		ruleInfoCard = null,
		onRulesChange,
		onSave,
		onKeepMine,
		onUseLatest
	}: Props = $props();
	const activeEditPolicy = $derived(editPolicy ?? EDIT_ALL_RULE_FIELDS);
</script>

<div class="flex h-full min-h-0 min-w-0 flex-col">
	<div class="min-h-0 flex-1">
		<EmailFormatRulePanel
			{rules}
			canSave={canSave && !isSaving}
			{onRulesChange}
			{onSave}
			infoCard={ruleInfoCard ?? undefined}
			canEditRuleText={activeEditPolicy.text}
			canEditRuleList={activeEditPolicy.list}
		/>
	</div>
	{#if conflict}
		<div class="shrink-0 bg-white px-4 py-3 md:px-5">
			<SectionConflictActions
				{conflict}
				{isSaving}
				{onKeepMine}
				{onUseLatest}
			/>
		</div>
	{/if}
</div>
