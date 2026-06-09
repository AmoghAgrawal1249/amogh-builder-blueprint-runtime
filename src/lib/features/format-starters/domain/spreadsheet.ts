import {
	cloneFormatInline,
	formatVariableToken,
	normalizeFormatInline,
	type FormatInlineNode
} from './inline';
import {
	SPREADSHEET_CELL_MAX_LENGTH,
	SPREADSHEET_COLUMN_COUNT,
	SPREADSHEET_COLUMN_LABELS,
	SPREADSHEET_ROW_COUNT,
	cellKey,
	parseCellKey,
	type SpreadsheetCellKey
} from '$domain/spreadsheets';

const FORMAT_ATTACHMENT_FILENAME_MAX_LENGTH = 160;
const FORMAT_SPREADSHEET_ATTACHMENT_EXTENSION = 'xlsx';

export const FORMAT_SPREADSHEET_ROW_COUNT = SPREADSHEET_ROW_COUNT;
export const FORMAT_SPREADSHEET_COLUMN_COUNT = SPREADSHEET_COLUMN_COUNT;
export const FORMAT_SPREADSHEET_CELL_MAX_LENGTH = SPREADSHEET_CELL_MAX_LENGTH;
export const FORMAT_SPREADSHEET_COLUMN_LABELS = SPREADSHEET_COLUMN_LABELS;

export type FormatSpreadsheetCell = readonly FormatInlineNode[];

export type FormatSpreadsheetAttachment = {
	filename: string;
	cellsByKey: Record<SpreadsheetCellKey, FormatSpreadsheetCell>;
};

export function normalizeFormatAttachmentName(value: string) {
	const withoutQueryOrHash = value.trim().split(/[?#]/)[0] ?? '';
	const filename = withoutQueryOrHash.split(/[\\/]/).pop() ?? '';
	const baseName = filename.replace(/\.[^.]+$/i, '');
	const sanitizedBaseName = baseName
		.replace(/[^a-zA-Z0-9 ._()-]+/g, '_')
		.replace(/\s+/g, ' ')
		.replace(/\.+$/g, '')
		.trim();
	const normalized = clampSingleLineText(sanitizedBaseName, FORMAT_ATTACHMENT_FILENAME_MAX_LENGTH);

	return normalized ? `${normalized}.${FORMAT_SPREADSHEET_ATTACHMENT_EXTENSION}` : '';
}

export function createDefaultFormatSpreadsheetAttachment(
	filename?: string
): FormatSpreadsheetAttachment {
	return normalizeFormatSpreadsheetAttachment({
		filename: filename ?? `Spreadsheet.${FORMAT_SPREADSHEET_ATTACHMENT_EXTENSION}`,
		cellsByKey: {}
	})!;
}

export function cloneFormatAttachment(attachment: FormatSpreadsheetAttachment | null) {
	return attachment
		? {
				filename: attachment.filename,
				cellsByKey: Object.fromEntries(
					Object.entries(attachment.cellsByKey).map(([key, cell]) => [
						key,
						cloneFormatInline(cell)
					])
				) as Record<SpreadsheetCellKey, FormatSpreadsheetCell>
			}
		: null;
}

export function normalizeFormatSpreadsheetAttachment(
	attachment: FormatSpreadsheetAttachment | null
): FormatSpreadsheetAttachment | null {
	if (!attachment) {
		return null;
	}

	const filename = normalizeFormatAttachmentName(attachment.filename);

	if (!filename) {
		return null;
	}

	const cellsByKey: Record<SpreadsheetCellKey, FormatSpreadsheetCell> = {};

	for (const [key, cell] of Object.entries(attachment.cellsByKey)) {
		const address = parseCellKey(key);

		if (!address) {
			continue;
		}

		const normalizedCell = normalizeFormatSpreadsheetCell(cell);

		if (normalizedCell.length > 0) {
			cellsByKey[cellKey(address.rowIndex, address.columnIndex)] = normalizedCell;
		}
	}

	return {
		filename,
		cellsByKey
	};
}

export function normalizeFormatSpreadsheetCell(
	cell: readonly FormatInlineNode[]
): FormatInlineNode[] {
	const normalized = normalizeFormatInline(cell);
	let remainingLength = FORMAT_SPREADSHEET_CELL_MAX_LENGTH;
	const clamped: FormatInlineNode[] = [];

	for (const node of normalized) {
		if (remainingLength <= 0) {
			break;
		}

		if (node.type === 'variable') {
			const tokenLength = formatVariableToken(node.variableId).length;

			if (tokenLength <= remainingLength) {
				clamped.push(node);
				remainingLength -= tokenLength;
			}

			continue;
		}

		const text = node.text.slice(0, remainingLength);

		if (text) {
			clamped.push({
				type: 'text',
				text
			});
			remainingLength -= text.length;
		}
	}

	return normalizeFormatInline(clamped);
}

function clampSingleLineText(value: string, maxLength: number) {
	const normalized = value.trim().replace(/\s+/g, ' ');

	return normalized.length > maxLength ? normalized.slice(0, maxLength).trim() : normalized;
}
