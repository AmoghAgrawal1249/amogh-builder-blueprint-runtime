import { SPREADSHEET_CELL_MAX_LENGTH, cellKey, parseCellKey } from '../../domain/spreadsheets';
import type { EmailFormatVariableDefinition } from '../../domain/email-formats';
import type { Doc } from '../../convex/_generated/dataModel';

const MAX_TITLE_LENGTH = 120;
const MAX_RECIPIENT_LENGTH = 140;
const MAX_RECIPIENTS = 12;
const MAX_BODY_BLOCKS = 12;
const MAX_INLINE_NODES = 80;
const MAX_BODY_TEXT_LENGTH = 1_000;
const MAX_VARIABLE_ID_LENGTH = 80;
const MAX_RULES = 20;
const MAX_RULE_ID_LENGTH = 80;
const MAX_RULE_TEXT_LENGTH = 1_500;
const MAX_VARIABLES = 80;
const MAX_SELECTED_ANSWERS = 20;
const MAX_SELECTED_ANSWER_ID_LENGTH = 80;

type EmailFormatInlineNode = Doc<'emailFormats'>['body'][number]['content'][number];
type EmailFormatAttachment = Doc<'emailFormats'>['attachment'];
type EmailFormatBody = Doc<'emailFormats'>['body'];
type EmailFormatRule = Doc<'emailFormats'>['rules'][number];

export type EmailFormatContentInput = {
	to: string[];
	cc: string[];
	attachment: EmailFormatAttachment;
	body: EmailFormatBody;
};

export function clampEmailFormatText(value: string, maxLength: number) {
	const normalized = value.trim();

	return normalized.length > maxLength ? normalized.slice(0, maxLength).trim() : normalized;
}

function clampSingleLineText(value: string, maxLength: number) {
	return clampEmailFormatText(value.replace(/\s+/g, ' '), maxLength);
}

export function normalizeEmailFormatTitle(title: string) {
	return clampEmailFormatText(title, MAX_TITLE_LENGTH);
}

export function normalizeEmailFormatRecipients(recipients: string[]) {
	return [
		...new Set(
			recipients
				.slice(0, MAX_RECIPIENTS)
				.map((recipient) => clampSingleLineText(recipient, MAX_RECIPIENT_LENGTH))
				.filter(Boolean)
		)
	];
}

export function normalizeEmailFormatVariables(
	variables: readonly EmailFormatVariableDefinition[]
): EmailFormatVariableDefinition[] {
	const seen = new Set<string>();
	const normalized: EmailFormatVariableDefinition[] = [];

	for (const variable of variables) {
		if (normalized.length >= MAX_VARIABLES) {
			break;
		}

		const id = clampEmailFormatText(variable.id, MAX_VARIABLE_ID_LENGTH);
		const label = clampSingleLineText(variable.label, 80);

		if (!id || !label || seen.has(id)) {
			continue;
		}

		seen.add(id);
		normalized.push({ id, label });
	}

	return normalized;
}

function normalizeInlineNodes(
	nodes: EmailFormatInlineNode[],
	maxTextLength: number,
	allowedVariableIds: ReadonlySet<string>
) {
	const normalized: EmailFormatInlineNode[] = [];
	let remainingTextLength = maxTextLength;

	for (const node of nodes) {
		if (normalized.length >= MAX_INLINE_NODES || remainingTextLength <= 0) {
			break;
		}

		const previous = normalized.at(-1);

		if (node.type === 'variable') {
			const variableId = clampEmailFormatText(node.variableId, MAX_VARIABLE_ID_LENGTH);
			const tokenLength = `{${variableId}}`.length;

			if (
				variableId &&
				allowedVariableIds.has(variableId) &&
				tokenLength <= remainingTextLength
			) {
				normalized.push({ type: 'variable', variableId });
				remainingTextLength -= tokenLength;
			}
			continue;
		}

		const text = node.text.slice(0, remainingTextLength);

		if (!text) {
			continue;
		}

		if (previous?.type === 'text') {
			previous.text += text;
		} else {
			normalized.push({ type: 'text', text });
		}

		remainingTextLength -= text.length;
	}

	return normalized;
}

export function normalizeEmailFormatBody(
	body: EmailFormatBody,
	allowedVariableIds: ReadonlySet<string>
) {
	return body
		.slice(0, MAX_BODY_BLOCKS)
		.map((block) => ({
			id: block.id.trim(),
			type: 'paragraph' as const,
			content: normalizeInlineNodes([...block.content], MAX_BODY_TEXT_LENGTH, allowedVariableIds)
		}))
		.filter((block) => block.id && block.content.length > 0);
}

export function normalizeEmailFormatAttachment(
	attachment: EmailFormatAttachment,
	allowedVariableIds: ReadonlySet<string>
) {
	if (!attachment) {
		return null;
	}

	const filename = clampSingleLineText(attachment.filename, 160);

	if (!filename) {
		return null;
	}

	const cellsByKey: NonNullable<EmailFormatAttachment>['cellsByKey'] = {};

	for (const [key, cell] of Object.entries(attachment.cellsByKey)) {
		const address = parseCellKey(key);
		const normalizedCell = normalizeInlineNodes(
			[...cell],
			SPREADSHEET_CELL_MAX_LENGTH,
			allowedVariableIds
		);

		if (address && normalizedCell.length > 0) {
			cellsByKey[cellKey(address.rowIndex, address.columnIndex)] = normalizedCell;
		}
	}

	return {
		filename,
		cellsByKey
	};
}

export function normalizeEmailFormatContent(
	content: EmailFormatContentInput,
	variables: readonly EmailFormatVariableDefinition[]
) {
	const allowedVariableIds = new Set(variables.map((variable) => variable.id));

	return {
		to: normalizeEmailFormatRecipients(content.to),
		cc: normalizeEmailFormatRecipients(content.cc),
		attachment: normalizeEmailFormatAttachment(content.attachment, allowedVariableIds),
		body: normalizeEmailFormatBody(content.body, allowedVariableIds)
	};
}

export function toEditableEmailFormatContent(format: Doc<'emailFormats'>) {
	return {
		to: [...format.to],
		cc: [...format.cc],
		attachment: format.attachment
			? {
					filename: format.attachment.filename,
					cellsByKey: Object.fromEntries(
						Object.entries(format.attachment.cellsByKey).map(([key, cell]) => [
							key,
							cell.map((node) => ({ ...node }))
						])
					)
				}
			: null,
		body: format.body.map((block) => ({
			id: block.id,
			type: 'paragraph' as const,
			content: block.content.map((node) => ({ ...node }))
		}))
	};
}

export function normalizeEmailFormatRules(rules: EmailFormatRule[]) {
	return rules
		.slice(0, MAX_RULES)
		.map((rule) => ({
			id: clampEmailFormatText(rule.id, MAX_RULE_ID_LENGTH),
			text: clampEmailFormatText(rule.text, MAX_RULE_TEXT_LENGTH)
		}))
		.filter((rule) => rule.id && rule.text);
}

export function normalizeSelectedAnswers(selectedAnswers: Record<string, string>) {
	return Object.fromEntries(
		Object.entries(selectedAnswers)
			.slice(0, MAX_SELECTED_ANSWERS)
			.map(([questionId, answerId]) => [questionId.trim(), answerId.trim()] as const)
			.map(([questionId, answerId]) => [
				clampEmailFormatText(questionId, MAX_SELECTED_ANSWER_ID_LENGTH),
				clampEmailFormatText(answerId, MAX_SELECTED_ANSWER_ID_LENGTH)
			])
			.filter(([questionId, answerId]) => questionId && answerId)
	);
}
