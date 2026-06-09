import { cloneFormatBody, type FormatBodyBlock } from './body';
import {
	cloneFormatAttachment,
	normalizeFormatSpreadsheetAttachment,
	type FormatSpreadsheetAttachment
} from './spreadsheet';

export type FormatEmailContent = {
	title: string;
	to: readonly string[];
	cc: readonly string[];
	attachment: FormatSpreadsheetAttachment | null;
	body: readonly FormatBodyBlock[];
};

export function cloneFormatEmailContent(content: FormatEmailContent): FormatEmailContent {
	return {
		title: content.title,
		to: [...content.to],
		cc: [...content.cc],
		attachment: cloneFormatAttachment(content.attachment),
		body: cloneFormatBody(content.body)
	};
}

export function normalizeFormatEmailContent(content: FormatEmailContent): FormatEmailContent {
	return {
		title: content.title,
		to: [...content.to],
		cc: [...content.cc],
		attachment: normalizeFormatSpreadsheetAttachment(content.attachment),
		body: cloneFormatBody(content.body)
	};
}

export function updateFormatEmailContentField<Key extends keyof FormatEmailContent>(
	content: FormatEmailContent,
	field: Key,
	value: FormatEmailContent[Key]
): FormatEmailContent {
	return normalizeFormatEmailContent({
		...content,
		[field]: value
	});
}
