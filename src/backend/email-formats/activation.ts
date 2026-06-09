import type { Doc } from '../../convex/_generated/dataModel';
import type { EmailFormatRule } from '../../domain/email-formats';
import { getEmailFormatActivationReadiness } from '../../domain/email-formats/activation';

export const EMAIL_FORMAT_CONTENT_EDIT_POLICY = {
	title: true,
	to: true,
	cc: true,
	attachment: true,
	body: true
} as const;

export const EMAIL_FORMAT_RULES_EDIT_POLICY = {
	text: true,
	list: true
} as const;

export const EMAIL_FORMAT_RULE_INFO_CARD = {
	label: 'Next steps:',
	content:
		'Make these rules as precise and detailed as possible, you can also train the AI by giving feedback on specific sent emails'
} as const;

const EMAIL_FORMAT_ACTIVATION_REQUIREMENTS = [
	{ kind: 'recipients' },
	{ kind: 'rules' },
	{ kind: 'dataSources' }
] as const;

export async function getEmailFormatActivationState(
	format: Pick<Doc<'emailFormats'>, 'recipientCount' | 'rules'>
) {
	return {
		readiness: getEmailFormatActivationReadiness({
			recipientCount: format.recipientCount,
			linkedDataSourceCount: 0,
			rules: format.rules,
			requirements: EMAIL_FORMAT_ACTIVATION_REQUIREMENTS
		})
	};
}

export function getInitialRules(): EmailFormatRule[] {
	return [];
}
