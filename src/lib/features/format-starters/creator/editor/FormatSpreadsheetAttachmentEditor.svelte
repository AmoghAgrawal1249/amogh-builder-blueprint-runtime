<script lang="ts">
	import ArrowLeftIcon from 'phosphor-svelte/lib/ArrowLeftIcon';
	import { IconButton } from '$lib/ui';
	import {
		FORMAT_SPREADSHEET_COLUMN_COUNT,
		FORMAT_SPREADSHEET_COLUMN_LABELS,
		FORMAT_SPREADSHEET_ROW_COUNT,
		normalizeFormatSpreadsheetAttachment,
		normalizeFormatSpreadsheetCell,
		type FormatInlineNode,
		type FormatSpreadsheetAttachment,
		type FormatVariableDefinition
	} from '$lib/features/format-starters/domain';
	import {
		cloneFormatInlineNodes,
		getDocumentRangeFromPoint,
		normalizeDropRange,
		type FormatInlineSurfaceOptions
	} from '../inline/format-inline-surface';
	import {
		FormatInlineController,
		type FormatVariableDropTarget as FormatInlineVariableDropTarget
	} from '../inline/format-inline-controller.svelte';
	import type { FormatVariableInsertionRequest } from '../state/format-creator-state.svelte';
	import type { FormatVariableDragCoordinator } from '../variables/format-variable-drag-coordinator.svelte';
	import { cellKey, getSpreadsheetCell, updateSparseSpreadsheetCell } from '$domain/spreadsheets';

	type CellSurfaceParams = {
		rowIndex: number;
		columnIndex: number;
		nodes: readonly FormatInlineNode[];
	};

	type CellContext = {
		rowIndex: number;
		columnIndex: number;
	};

	type Props = {
		attachment: FormatSpreadsheetAttachment;
		variables: readonly FormatVariableDefinition[];
		disabled?: boolean;
		dragCoordinator: FormatVariableDragCoordinator;
		variableInsertionRequest?: FormatVariableInsertionRequest | null;
		onVariableInsertionRequestHandled?: (requestId: number) => void;
		onClose: () => void;
		onAttachmentChange: (attachment: FormatSpreadsheetAttachment) => void;
	};

	const CELL_SURFACE_OPTIONS = {
		variableDatasetKey: 'formatSpreadsheetVariableId',
		joinMode: 'cell',
		normalize: normalizeFormatSpreadsheetCell
	} satisfies FormatInlineSurfaceOptions;

	let {
		attachment,
		variables,
		disabled = false,
		dragCoordinator,
		variableInsertionRequest = null,
		onVariableInsertionRequestHandled,
		onClose,
		onAttachmentChange
	}: Props = $props();
	let spreadsheetRoot = $state<HTMLDivElement | null>(null);

	const rowIndexes = Array.from({ length: FORMAT_SPREADSHEET_ROW_COUNT }, (_, index) => index);
	const rowHeaderColumnWidth = 40;
	const spreadsheetDataColumnWidth = 216;
	const spreadsheetTableWidth =
		rowHeaderColumnWidth + FORMAT_SPREADSHEET_COLUMN_LABELS.length * spreadsheetDataColumnWidth;

	const controller = new FormatInlineController<CellContext>({
		scope: 'spreadsheet',
		dragCoordinator: () => dragCoordinator,
		root: () => spreadsheetRoot,
		variables: () => variables,
		disabled: () => disabled,
		options: CELL_SURFACE_OPTIONS,
		contextKey: (context) => cellKey(context.rowIndex, context.columnIndex),
		sameContext: isSameCell,
		contextFromSurface: getCellContext,
		surfaceForContext: findCellSurface,
		updateOne: (context, nodes) => updateCell(context.rowIndex, context.columnIndex, nodes),
		updateMany: updateCells,
		fallbackInsertionSurface: getFirstCellSurface
	});

	const cellSurface = controller.createSurfaceAction<CellSurfaceParams>((element, params) => {
		element.dataset.formatSpreadsheetCellKey = cellKey(params.rowIndex, params.columnIndex);
		element.dataset.formatSpreadsheetRowIndex = String(params.rowIndex);
		element.dataset.formatSpreadsheetColumnIndex = String(params.columnIndex);

		return {
			context: {
				rowIndex: params.rowIndex,
				columnIndex: params.columnIndex
			},
			nodes: params.nodes
		};
	});

	$effect(() => {
		return dragCoordinator.registerRegion({
			id: 'spreadsheet',
			resolveDrop: (drag, point) => {
				if (drag.type === 'inline' && drag.regionId !== 'spreadsheet') {
					return null;
				}

				const target = resolveDropTarget(point.x, point.y);

				if (!target) {
					return null;
				}

				if (drag.type === 'palette') {
					return {
						effect: 'copy',
						commit: () => {
							controller.insertVariableAtTarget(target, drag.variableId);
						}
					};
				}

				return {
					effect: 'move',
					commit: () => {
						controller.moveVariableToTarget(drag.item, target);
					}
				};
			}
		});
	});

	$effect(() => {
		const selected = controller.selectedVariable;

		if (!selected) {
			return;
		}

		if (
			disabled ||
			getSpreadsheetCell(attachment.cellsByKey, selected.rowIndex, selected.columnIndex)?.[
				selected.nodeIndex
			]?.type !== 'variable'
		) {
			controller.clearSelection();
		}
	});

	$effect(() => {
		const request = variableInsertionRequest;

		if (request && controller.handleVariableInsertionRequest(request)) {
			onVariableInsertionRequestHandled?.(request.id);
		}
	});

	function isSameCell(left: CellContext, right: CellContext) {
		return left.rowIndex === right.rowIndex && left.columnIndex === right.columnIndex;
	}

	function normalizeInlineNodes(nodes: readonly FormatInlineNode[]) {
		return normalizeFormatSpreadsheetCell(nodes);
	}

	function normalizedAttachmentWithCells(
		updates: Array<CellContext & { content: readonly FormatInlineNode[] }>
	) {
		let cellsByKey = Object.fromEntries(
			Object.entries(attachment.cellsByKey).map(([key, cell]) => [
				key,
				cloneFormatInlineNodes(cell)
			])
		) as FormatSpreadsheetAttachment['cellsByKey'];

		for (const update of updates) {
			const normalizedContent = normalizeInlineNodes(update.content);

			cellsByKey = updateSparseSpreadsheetCell<readonly FormatInlineNode[]>(
				cellsByKey,
				update.rowIndex,
				update.columnIndex,
				normalizedContent,
				(cell) => cell.length === 0
			);
		}

		const nextAttachment = {
			...attachment,
			cellsByKey
		};

		return normalizeFormatSpreadsheetAttachment(nextAttachment) ?? nextAttachment;
	}

	function updateCell(rowIndex: number, columnIndex: number, content: readonly FormatInlineNode[]) {
		if (disabled) {
			return;
		}

		onAttachmentChange(
			normalizedAttachmentWithCells([
				{
					rowIndex,
					columnIndex,
					content
				}
			])
		);
	}

	function updateCells(updates: Array<CellContext & { content: FormatInlineNode[] }>) {
		if (disabled) {
			return;
		}

		onAttachmentChange(normalizedAttachmentWithCells(updates));
	}

	function getCellContext(element: HTMLElement): CellContext | null {
		const rowIndex = Number.parseInt(element.dataset.formatSpreadsheetRowIndex ?? '', 10);
		const columnIndex = Number.parseInt(element.dataset.formatSpreadsheetColumnIndex ?? '', 10);

		if (!Number.isInteger(rowIndex) || !Number.isInteger(columnIndex)) {
			return null;
		}

		return { rowIndex, columnIndex };
	}

	function getCellSurfaces() {
		return Array.from(
			spreadsheetRoot?.querySelectorAll<HTMLElement>('[data-format-spreadsheet-cell-key]') ?? []
		);
	}

	function findCellSurface(context: CellContext) {
		return (
			getCellSurfaces().find(
				(surface) =>
					surface.dataset.formatSpreadsheetCellKey ===
					cellKey(context.rowIndex, context.columnIndex)
			) ?? null
		);
	}

	function closestCellSurface(node: Node | null) {
		const element = node instanceof Element ? node : node?.parentElement;
		const surface = element?.closest('[data-format-spreadsheet-cell-key]');

		return surface instanceof HTMLElement && spreadsheetRoot?.contains(surface) ? surface : null;
	}

	function getFirstCellSurface() {
		return getCellSurfaces()[0] ?? null;
	}

	function getCellSurfaceUnderPointer(clientX: number, clientY: number) {
		return closestCellSurface(
			spreadsheetRoot?.ownerDocument.elementFromPoint(clientX, clientY) ?? null
		);
	}

	function resolveDropTarget(
		clientX: number,
		clientY: number
	): FormatInlineVariableDropTarget | null {
		if (disabled) {
			return null;
		}

		const surface = getCellSurfaceUnderPointer(clientX, clientY);

		if (!surface || !surface.isContentEditable) {
			return null;
		}

		const range = getDocumentRangeFromPoint(spreadsheetRoot?.ownerDocument, clientX, clientY);
		const rangeSurface = range ? closestCellSurface(range.commonAncestorContainer) : null;

		return {
			surface,
			range:
				rangeSurface === surface
					? normalizeDropRange(surface, range, clientX, CELL_SURFACE_OPTIONS)
					: null
		};
	}

	function focusCell(rowIndex: number, columnIndex: number) {
		findCellSurface({ rowIndex, columnIndex })?.focus();
	}

	function handleCellKeydown(event: KeyboardEvent, rowIndex: number, columnIndex: number) {
		if (event.key === 'Escape') {
			controller.handleEscape();
			return;
		}

		if (event.key === 'Enter') {
			event.preventDefault();
			focusCell(Math.min(rowIndex + 1, FORMAT_SPREADSHEET_ROW_COUNT - 1), columnIndex);
			return;
		}

		if (event.key === 'Tab') {
			event.preventDefault();
			const direction = event.shiftKey ? -1 : 1;
			const nextFlatIndex =
				rowIndex * FORMAT_SPREADSHEET_COLUMN_COUNT + columnIndex + direction;
			const maxFlatIndex =
				FORMAT_SPREADSHEET_ROW_COUNT * FORMAT_SPREADSHEET_COLUMN_COUNT - 1;
			const clampedFlatIndex = Math.max(0, Math.min(maxFlatIndex, nextFlatIndex));

			focusCell(
				Math.floor(clampedFlatIndex / FORMAT_SPREADSHEET_COLUMN_COUNT),
				clampedFlatIndex % FORMAT_SPREADSHEET_COLUMN_COUNT
			);
		}
	}
</script>

<svelte:document
	onpointerdown={controller.handleDocumentPointerDown}
	onselectionchange={controller.handleDocumentSelectionChange}
/>
<div
	bind:this={spreadsheetRoot}
	class="format-spreadsheet-editor relative flex min-h-full w-full flex-col overflow-hidden bg-white"
	role="group"
	aria-label="Spreadsheet attachment"
>
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
			<p class="truncate text-[0.79rem] font-medium text-stone-900">{attachment.filename}</p>
		</div>
	</div>

	<div class="min-h-0 flex-1 overflow-auto bg-white">
		<table
			class="table-fixed border-separate border-spacing-0 text-left text-[0.79rem]"
			style={`width: ${spreadsheetTableWidth}px; min-width: ${spreadsheetTableWidth}px;`}
		>
			<colgroup>
				<col style={`width: ${rowHeaderColumnWidth}px;`} />
				{#each FORMAT_SPREADSHEET_COLUMN_LABELS as column (column)}
					<col style={`width: ${spreadsheetDataColumnWidth}px;`} />
				{/each}
			</colgroup>
			<thead>
				<tr>
					<th
						class="sticky top-0 left-0 z-20 h-8 border-r border-b border-stone-200 bg-stone-100"
						aria-label="Rows"
					></th>
					{#each FORMAT_SPREADSHEET_COLUMN_LABELS as column (column)}
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
						{#each FORMAT_SPREADSHEET_COLUMN_LABELS as column, cellIndex (column)}
							<td
								class="h-8 overflow-hidden border-r border-b border-stone-200 px-2 align-middle"
								class:bg-stone-50={rowIndex === 0}
							>
								<span
									use:cellSurface={{
										rowIndex,
										columnIndex: cellIndex,
										nodes: getSpreadsheetCell(attachment.cellsByKey, rowIndex, cellIndex) ?? []
									}}
									contenteditable={!disabled}
									role="textbox"
									tabindex={disabled ? -1 : 0}
									aria-label={`Row ${rowIndex + 1}, column ${cellIndex + 1}`}
									class="format-spreadsheet-cell-surface"
									class:font-medium={rowIndex === 0}
									class:text-stone-900={rowIndex === 0}
									class:text-stone-800={rowIndex !== 0}
									oninput={controller.handleInput}
									onpaste={controller.handlePaste}
									onkeydown={(event) => handleCellKeydown(event, rowIndex, cellIndex)}
								></span>
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

</div>

<style>
	.format-spreadsheet-cell-surface {
		box-sizing: border-box;
		caret-color: rgb(28 25 23);
		display: block;
		height: 2rem;
		line-height: 1rem;
		min-width: 1ch;
		outline: none;
		overflow: hidden;
		padding-block: 0.5rem;
		text-overflow: ellipsis;
		white-space: nowrap;
		width: 100%;
	}

	.format-spreadsheet-cell-surface[contenteditable='false'] {
		cursor: default;
		opacity: 0.6;
	}

	.format-spreadsheet-editor :global(.format-variable-pill) {
		user-select: none;
		gap: 0.25rem;
		transition:
			background-color 150ms ease,
			border-color 150ms ease;
		vertical-align: baseline;
	}

	.format-spreadsheet-cell-surface:not([contenteditable='false'])
		:global(.format-variable-pill) {
		cursor: grab;
	}

	.format-spreadsheet-cell-surface:not([contenteditable='false'])
		:global(.format-variable-pill:hover) {
		background: var(--positive-100);
	}

	.format-spreadsheet-cell-surface:not([contenteditable='false'])
		:global(.format-variable-pill:active) {
		cursor: grabbing;
	}

	.format-spreadsheet-editor :global(.format-variable-pill--selected) {
		border-color: transparent;
		background: var(--positive-100);
	}

	.format-spreadsheet-editor :global(.format-variable-pill__label) {
		line-height: 1;
	}

	.format-spreadsheet-editor :global(.format-variable-pill__remove) {
		display: inline-flex;
		width: 0.68rem;
		height: 0.68rem;
		align-items: center;
		justify-content: center;
		border: 0;
		border-radius: 999px;
		background: transparent;
		color: var(--positive-700);
		font: inherit;
		font-size: 0.68rem;
		font-weight: 600;
		line-height: 1;
		padding: 0;
		cursor: pointer;
	}

	.format-spreadsheet-editor :global(.format-variable-pill__remove:hover) {
		background: var(--positive-100);
	}

	.format-spreadsheet-cell-surface:focus :global(.format-variable-pill) {
		border-color: transparent;
	}

</style>
