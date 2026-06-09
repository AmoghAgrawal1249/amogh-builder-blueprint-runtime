export const SPREADSHEET_ROW_COUNT = 100;
export const SPREADSHEET_COLUMN_COUNT = 26;
export const SPREADSHEET_CELL_MAX_LENGTH = 200;

export const SPREADSHEET_COLUMN_LABELS = Array.from(
	{ length: SPREADSHEET_COLUMN_COUNT },
	(_, index) => String.fromCharCode('A'.charCodeAt(0) + index)
) as string[];

export const SPREADSHEET_ROW_INDEXES = Array.from(
	{ length: SPREADSHEET_ROW_COUNT },
	(_, index) => index
) as number[];

export type SpreadsheetCellKey = `${number}:${number}`;
export type SpreadsheetCellAddress = {
	rowIndex: number;
	columnIndex: number;
};

export function cellKey(rowIndex: number, columnIndex: number): SpreadsheetCellKey {
	return `${rowIndex}:${columnIndex}`;
}

export function parseCellKey(key: string): SpreadsheetCellAddress | null {
	const match = /^(\d+):(\d+)$/.exec(key);

	if (!match) {
		return null;
	}

	const rowIndex = Number.parseInt(match[1], 10);
	const columnIndex = Number.parseInt(match[2], 10);

	return isSpreadsheetCellInBounds(rowIndex, columnIndex) ? { rowIndex, columnIndex } : null;
}

export function isSpreadsheetCellInBounds(rowIndex: number, columnIndex: number) {
	return (
		Number.isInteger(rowIndex) &&
		Number.isInteger(columnIndex) &&
		rowIndex >= 0 &&
		rowIndex < SPREADSHEET_ROW_COUNT &&
		columnIndex >= 0 &&
		columnIndex < SPREADSHEET_COLUMN_COUNT
	);
}

export function getSpreadsheetCell<T>(
	cellsByKey: Partial<Record<SpreadsheetCellKey, T>>,
	rowIndex: number,
	columnIndex: number
): T | undefined {
	return cellsByKey[cellKey(rowIndex, columnIndex)];
}

export function updateSparseSpreadsheetCell<T>(
	cellsByKey: Partial<Record<SpreadsheetCellKey, T>>,
	rowIndex: number,
	columnIndex: number,
	value: T,
	isEmpty: (value: T) => boolean
): Record<SpreadsheetCellKey, T> {
	const nextCellsByKey = { ...cellsByKey } as Record<SpreadsheetCellKey, T>;
	const key = cellKey(rowIndex, columnIndex);

	if (!isSpreadsheetCellInBounds(rowIndex, columnIndex) || isEmpty(value)) {
		delete nextCellsByKey[key];
		return nextCellsByKey;
	}

	nextCellsByKey[key] = value;

	return nextCellsByKey;
}
