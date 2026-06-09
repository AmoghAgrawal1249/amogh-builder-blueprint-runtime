<script lang="ts">
	import {
		EMAIL_DRAFT_LIMITS,
		SPREADSHEET_COLUMN_LABELS,
		normalizeEmailSpreadsheetCell,
		type EmailSpreadsheetAttachment
	} from './email-drafts';
	import { getSpreadsheetCell, updateSparseSpreadsheetCell } from '$domain/spreadsheets';
	import ArrowLeftIcon from 'phosphor-svelte/lib/ArrowLeftIcon';
	import { IconButton } from '$lib/ui';

	type Props = {
		attachment: EmailSpreadsheetAttachment;
		editable?: boolean;
		disabled?: boolean;
		onClose: () => void;
		onAttachmentChange?: (attachment: EmailSpreadsheetAttachment) => void;
	};

	let {
		attachment,
		editable = false,
		disabled = false,
		onClose,
		onAttachmentChange
	}: Props = $props();

	const rowIndexes = Array.from({ length: EMAIL_DRAFT_LIMITS.spreadsheetRows }, (_, index) => index);
	const rowHeaderColumnWidth = 40;
	const spreadsheetDataColumnWidth = 144;
	const spreadsheetTableWidth =
		rowHeaderColumnWidth + SPREADSHEET_COLUMN_LABELS.length * spreadsheetDataColumnWidth;
	let spreadsheetRoot: HTMLDivElement;

	function updateCell(rowIndex: number, columnIndex: number, value: string) {
		if (disabled) {
			return;
		}

		const normalizedValue = normalizeEmailSpreadsheetCell(value);

		onAttachmentChange?.({
			...attachment,
			cellsByKey: updateSparseSpreadsheetCell(
				attachment.cellsByKey,
				rowIndex,
				columnIndex,
				normalizedValue,
				(cellValue) => cellValue.length === 0
			)
		});
	}

	function focusCell(rowIndex: number, columnIndex: number) {
		const nextInput = spreadsheetRoot.querySelector<HTMLInputElement>(
			`input[data-row="${rowIndex}"][data-column="${columnIndex}"]`
		);

		nextInput?.focus();
	}

	function handleCellKeydown(event: KeyboardEvent, rowIndex: number, columnIndex: number) {
		if (event.key !== 'Enter') {
			return;
		}

		if (rowIndex + 1 >= EMAIL_DRAFT_LIMITS.spreadsheetRows) {
			return;
		}

		event.preventDefault();
		focusCell(rowIndex + 1, columnIndex);
	}
</script>

<div bind:this={spreadsheetRoot} class="flex min-h-full w-full flex-col overflow-hidden bg-white">
	<div class="flex h-12 shrink-0 items-center gap-3 border-b border-stone-200 bg-white px-2.5">
		<IconButton
			aria-label="Back to email"
			variant="ghost"
			class="size-7 shrink-0 text-stone-500 hover:text-stone-900 focus-visible:ring-2 focus-visible:ring-positive-200 focus-visible:outline-none"
			onclick={onClose}
		>
			<ArrowLeftIcon size={14} weight="regular" />
		</IconButton>
		<div
			class="flex size-7 shrink-0 items-center justify-center rounded-sm border border-positive-200 bg-positive-50 text-[0.54rem] font-normal text-positive-700"
			aria-hidden="true"
		>
			XLS
		</div>
		<div class="min-w-0 flex-1">
			<p class="truncate text-[0.72rem] font-medium text-stone-900">{attachment.filename}</p>
		</div>
	</div>

	<div class="min-h-0 flex-1 overflow-auto bg-white">
		<table
			class="table-fixed border-separate border-spacing-0 text-left text-[0.68rem]"
			style={`width: ${spreadsheetTableWidth}px; min-width: ${spreadsheetTableWidth}px;`}
		>
			<colgroup>
				<col style={`width: ${rowHeaderColumnWidth}px;`} />
				{#each SPREADSHEET_COLUMN_LABELS as column (column)}
					<col style={`width: ${spreadsheetDataColumnWidth}px;`} />
				{/each}
			</colgroup>
			<thead>
				<tr>
					<th
						class="sticky top-0 left-0 z-20 h-8 border-r border-b border-stone-200 bg-stone-100"
						aria-label="Rows"
					></th>
					{#each SPREADSHEET_COLUMN_LABELS as column (column)}
						<th
							class="sticky top-0 z-10 h-8 overflow-hidden border-r border-b border-stone-200 bg-positive-50 px-2 text-center text-[0.62rem] font-normal text-ellipsis whitespace-nowrap text-positive-900"
						>
							{column}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each rowIndexes as rowIndex (rowIndex)}
					<tr>
						<th
							class="sticky left-0 z-10 h-8 border-r border-b border-stone-200 bg-stone-50 px-2 text-right text-[0.62rem] font-normal text-stone-500"
						>
							{rowIndex + 1}
						</th>
						{#each SPREADSHEET_COLUMN_LABELS as column, cellIndex (column)}
							<td
								class="h-8 overflow-hidden border-r border-b border-stone-200 px-2 text-ellipsis whitespace-nowrap"
								class:bg-stone-50={rowIndex === 0}
								class:font-medium={rowIndex === 0}
								class:text-stone-900={rowIndex === 0}
								class:text-stone-800={rowIndex !== 0}
							>
								{#if editable}
									<input
										value={getSpreadsheetCell(attachment.cellsByKey, rowIndex, cellIndex) ?? ''}
										aria-label={`Row ${rowIndex + 1}, column ${cellIndex + 1}`}
										data-row={rowIndex}
										data-column={cellIndex}
										{disabled}
										class="block h-full w-full min-w-0 overflow-hidden border-0 bg-transparent p-0 text-[0.68rem] text-ellipsis whitespace-nowrap outline-none"
										class:font-medium={rowIndex === 0}
										class:text-stone-900={rowIndex === 0}
										class:text-stone-800={rowIndex !== 0}
										onkeydown={(event) => handleCellKeydown(event, rowIndex, cellIndex)}
										oninput={(event) => updateCell(rowIndex, cellIndex, event.currentTarget.value)}
									/>
								{:else}
									{getSpreadsheetCell(attachment.cellsByKey, rowIndex, cellIndex) ?? ''}
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
