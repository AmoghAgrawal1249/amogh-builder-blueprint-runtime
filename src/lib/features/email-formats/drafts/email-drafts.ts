import {
	SPREADSHEET_CELL_MAX_LENGTH,
	SPREADSHEET_COLUMN_COUNT,
	SPREADSHEET_COLUMN_LABELS,
	SPREADSHEET_ROW_COUNT,
	cellKey,
	parseCellKey,
	type SpreadsheetCellKey
} from '$domain/spreadsheets';

export const EMAIL_DRAFT_LIMITS = {
	recipient: 140,
	recipients: 12,
	attachmentFilename: 160,
	spreadsheetColumns: SPREADSHEET_COLUMN_COUNT,
	spreadsheetRows: SPREADSHEET_ROW_COUNT,
	spreadsheetCell: SPREADSHEET_CELL_MAX_LENGTH,
	bodyBlocks: 12,
	bodyText: 1_000,
	linkLabel: 120,
	linkHref: 500
} as const;

export const EMAIL_ATTACHMENT_FORMAT = {
	extension: 'xlsx',
	shortLabel: 'XLSX',
	label: 'Excel workbook'
} as const;

export { SPREADSHEET_COLUMN_LABELS };

export type EmailParagraphBlock = {
	type: 'paragraph';
	text: string;
};

export type EmailLinkBlock = {
	type: 'link';
	label: string;
	href: string;
};

export type EmailBodyBlock = EmailParagraphBlock | EmailLinkBlock;

export type EmailSpreadsheetAttachment = {
	filename: string;
	cellsByKey: Record<SpreadsheetCellKey, string>;
};

export type EmailDraft = {
	to: string[];
	cc: string[];
	attachment: EmailSpreadsheetAttachment | null;
	body: EmailBodyBlock[];
};

export function createDefaultEmailDraft(): EmailDraft {
	return {
		to: [],
		cc: [],
		attachment: null,
		body: []
	};
}

function clampText(value: string, maxLength: number) {
	const normalized = value.trim().replace(/\s+/g, ' ');

	return normalized.length > maxLength ? normalized.slice(0, maxLength).trim() : normalized;
}

function clampMultilineText(value: string, maxLength: number) {
	const normalized = value.trim();

	return normalized.length > maxLength ? normalized.slice(0, maxLength).trim() : normalized;
}

function normalizeRecipients(recipients: string[]) {
	const normalizedRecipients = recipients
		.slice(0, EMAIL_DRAFT_LIMITS.recipients)
		.map((recipient) => clampText(recipient, EMAIL_DRAFT_LIMITS.recipient))
		.filter(Boolean);

	return Array.from(new Set(normalizedRecipients));
}

export function normalizeEmailAttachmentName(value: string) {
	const withoutQueryOrHash = value.trim().split(/[?#]/)[0] ?? '';
	const filename = withoutQueryOrHash.split(/[\\/]/).pop() ?? '';
	const baseName = filename.replace(/\.[^.]+$/i, '');
	const sanitizedBaseName = baseName
		.replace(/[^a-zA-Z0-9 ._()-]+/g, '_')
		.replace(/\s+/g, ' ')
		.replace(/\.+$/g, '')
		.trim();
	const normalized = clampText(sanitizedBaseName, EMAIL_DRAFT_LIMITS.attachmentFilename);

	return normalized ? `${normalized}.${EMAIL_ATTACHMENT_FORMAT.extension}` : '';
}

export function createDefaultEmailSpreadsheetAttachment(
	filename = `Spreadsheet.${EMAIL_ATTACHMENT_FORMAT.extension}`
): EmailSpreadsheetAttachment {
	return {
		filename,
		cellsByKey: {}
	};
}

export function normalizeEmailSpreadsheetCell(value: string) {
	return clampText(value, EMAIL_DRAFT_LIMITS.spreadsheetCell);
}

export function normalizeEmailSpreadsheetAttachment(
	attachment: EmailSpreadsheetAttachment | null
): EmailSpreadsheetAttachment | null {
	if (!attachment) {
		return null;
	}

	const filename = normalizeEmailAttachmentName(attachment.filename);

	if (!filename) {
		return null;
	}

	return {
		filename,
		cellsByKey: Object.fromEntries(
			Object.entries(attachment.cellsByKey)
				.map(([key, value]) => {
					const address = parseCellKey(key);
					const normalizedValue = normalizeEmailSpreadsheetCell(value);

					return address && normalizedValue
						? [cellKey(address.rowIndex, address.columnIndex), normalizedValue]
						: null;
				})
				.filter((entry): entry is [SpreadsheetCellKey, string] => entry !== null)
		) as Record<SpreadsheetCellKey, string>
	};
}

function normalizeEmailBodyBlock(block: EmailBodyBlock): EmailBodyBlock | null {
	if (block.type === 'paragraph') {
		const text = clampMultilineText(block.text, EMAIL_DRAFT_LIMITS.bodyText);

		return text ? { type: 'paragraph', text } : null;
	}

	const label = clampText(block.label, EMAIL_DRAFT_LIMITS.linkLabel);
	const href = clampText(block.href, EMAIL_DRAFT_LIMITS.linkHref);

	return label && href ? { type: 'link', label, href } : null;
}

export function normalizeEmailDraft(draft: EmailDraft): EmailDraft {
	return {
		to: normalizeRecipients(draft.to),
		cc: normalizeRecipients(draft.cc),
		attachment: normalizeEmailSpreadsheetAttachment(draft.attachment),
		body: draft.body
			.slice(0, EMAIL_DRAFT_LIMITS.bodyBlocks)
			.map(normalizeEmailBodyBlock)
			.filter((block): block is EmailBodyBlock => block !== null)
	};
}
