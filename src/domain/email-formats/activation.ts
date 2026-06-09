import type { EmailFormatActivationRequirement } from './types';

export type EmailFormatActivationMissingRequirement =
	| 'recipients'
	| 'rules'
	| 'dataSources';

export type EmailFormatActivationRule = {
	text: string;
};

export type EmailFormatActivationReadiness = {
	canActivate: boolean;
	missingRequirements: EmailFormatActivationMissingRequirement[];
	message: string | null;
};

type EmailFormatActivationReadinessInput = {
	recipientCount: number;
	linkedDataSourceCount: number;
	rules: readonly EmailFormatActivationRule[];
	requirements: readonly EmailFormatActivationRequirement[];
};

function hasSavedRule(rules: readonly EmailFormatActivationRule[]) {
	return rules.some((rule) => rule.text.trim().length > 0);
}

export function getEmailFormatActivationReadiness({
	recipientCount,
	linkedDataSourceCount,
	rules,
	requirements
}: EmailFormatActivationReadinessInput): EmailFormatActivationReadiness {
	const missingRequirements: EmailFormatActivationMissingRequirement[] = [];

	for (const requirement of requirements) {
		if (requirement.kind === 'recipients' && recipientCount <= 0) {
			missingRequirements.push('recipients');
		}

		if (requirement.kind === 'rules' && !hasSavedRule(rules)) {
			missingRequirements.push('rules');
		}

		if (requirement.kind === 'dataSources' && linkedDataSourceCount <= 0) {
			missingRequirements.push('dataSources');
		}
	}

	const uniqueMissingRequirements = [...new Set(missingRequirements)];

	return {
		canActivate: uniqueMissingRequirements.length === 0,
		missingRequirements: uniqueMissingRequirements,
		message: getEmailFormatActivationMissingMessage(uniqueMissingRequirements)
	};
}

export function getEmailFormatActivationMissingMessage(
	missingRequirements: readonly EmailFormatActivationMissingRequirement[]
) {
	const missing = new Set(missingRequirements);

	if (missing.size === 0) {
		return null;
	}

	if (missing.size === 1 && missing.has('recipients')) {
		return 'Add at least one recipient before activating this format';
	}

	if (missing.size === 1 && missing.has('rules')) {
		return 'Add and save at least one rule before activating this format';
	}

	if (missing.size === 1 && missing.has('dataSources')) {
		return 'Link data sources before activating this format';
	}

	const labels = [
		missing.has('recipients') ? 'at least one recipient' : null,
		missing.has('rules') ? 'at least one saved rule' : null,
		missing.has('dataSources') ? 'one linked data source' : null
	].filter((label): label is string => label !== null);

	return `Add ${formatList(labels)} before activating this format`;
}

export function getEmailFormatActivationMissingMessageFromError(error: unknown) {
	const errorMessage = error instanceof Error ? error.message : String(error);
	const requirementKinds: EmailFormatActivationMissingRequirement[] = [
		'recipients',
		'rules',
		'dataSources'
	];
	const activationMessages = getRequirementCombinations(requirementKinds)
		.map(getEmailFormatActivationMissingMessage)
		.filter((message): message is string => message !== null);

	return (
		activationMessages.find((message) => errorMessage.includes(message)) ??
		errorMessage
	);
}

function getRequirementCombinations(
	requirements: readonly EmailFormatActivationMissingRequirement[]
) {
	const combinations: EmailFormatActivationMissingRequirement[][] = [];

	for (let mask = 1; mask < 1 << requirements.length; mask += 1) {
		combinations.push(requirements.filter((_, index) => Boolean(mask & (1 << index))));
	}

	return combinations;
}

function formatList(labels: readonly string[]) {
	if (labels.length <= 1) {
		return labels[0] ?? '';
	}

	if (labels.length === 2) {
		return `${labels[0]} and ${labels[1]}`;
	}

	return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
}
