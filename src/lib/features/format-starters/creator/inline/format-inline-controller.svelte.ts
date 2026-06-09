import {
	formatFormatVariableLabel,
	type FormatInlineNode,
	type FormatVariableDefinition
} from '$lib/features/format-starters/domain';
import {
	areInlineNodesEqual,
	closestVariablePill,
	createSurfaceRangeAfterChild,
	createVariablePill,
	focusEnd,
	insertPlainText,
	insertVariable,
	joinSegments,
	removeChild,
	renderSurface,
	selectRange,
	serializeSurface,
	type FormatInlineSurfaceOptions
} from './format-inline-surface';
import type { FormatVariableDragCoordinator } from '../variables/format-variable-drag-coordinator.svelte';

export type FormatInlineVariableIdentity<Context extends object> = Context & {
	nodeIndex: number;
};

export type FormatVariableDropTarget = {
	surface: HTMLElement;
	range: Range | null;
};

export type FormatInlineDragItem<Context extends object> =
	FormatInlineVariableIdentity<Context> & {
		variableId: string;
		sourcePill: HTMLElement;
		sourceSurface: HTMLElement;
	};

export type FormatInlineControllerAdapter<Context extends object> = {
	scope: string;
	dragCoordinator: () => FormatVariableDragCoordinator;
	root: () => HTMLElement | null;
	variables: () => readonly FormatVariableDefinition[];
	disabled: () => boolean;
	options: FormatInlineSurfaceOptions;

	contextKey(context: Context): string;
	sameContext(left: Context, right: Context): boolean;
	contextFromSurface(surface: HTMLElement): Context | null;
	surfaceForContext(context: Context): HTMLElement | null;

	updateOne(context: Context, nodes: FormatInlineNode[]): void;
	updateMany(updates: Array<Context & { content: FormatInlineNode[] }>): void;

	fallbackInsertionSurface(): HTMLElement | null;
	insertIntoEmptyDocument?(variableId: string): void;
};

type FormatInlineSurfaceActionParams<Context extends object> = {
	context: Context;
	nodes: readonly FormatInlineNode[];
};

type FormatInlineSurfaceActionMapper<Context extends object, Params> = (
	element: HTMLElement,
	params: Params
) => FormatInlineSurfaceActionParams<Context>;

type FormatInlineCaretBookmark = {
	surface: HTMLElement;
	range: Range;
};

function rangeBelongsToSurface(surface: HTMLElement, range: Range | null) {
	return Boolean(range && surface.contains(range.commonAncestorContainer));
}

export class FormatInlineController<Context extends object> {
	selectedVariable = $state<FormatInlineVariableIdentity<Context> | null>(null);

	private readonly adapter: FormatInlineControllerAdapter<Context>;
	private caretBookmark: FormatInlineCaretBookmark | null = null;
	private handledInsertionRequestId = 0;

	constructor(adapter: FormatInlineControllerAdapter<Context>) {
		this.adapter = adapter;
	}

	createSurfaceAction = <Params>(mapParams: FormatInlineSurfaceActionMapper<Context, Params>) => {
		return (element: HTMLElement, params: Params) => {
			const action = this.surfaceAction(element, mapParams(element, params));

			return {
				update: (nextParams: Params) => {
					action.update(mapParams(element, nextParams));
				},
				destroy: action.destroy
			};
		};
	};

	private surfaceAction = (
		element: HTMLElement,
		params: FormatInlineSurfaceActionParams<Context>
	) => {
		this.configureSurface(element, params.context);
		this.attachSurfaceListeners(element);
		this.renderInlineNodes(element, params.context, params.nodes);

		return {
			update: (nextParams: FormatInlineSurfaceActionParams<Context>) => {
				this.configureSurface(element, nextParams.context);
				const currentNodes = this.serializeInlineNodes(element);

				if (
					document.activeElement !== element &&
					!areInlineNodesEqual(currentNodes, nextParams.nodes)
				) {
					this.renderInlineNodes(element, nextParams.context, nextParams.nodes);
				}
			},
			destroy: () => {
				this.detachSurfaceListeners(element);
			}
		};
	};

	handleInput = (event: Event) => {
		const surface = event.currentTarget;

		if (!(surface instanceof HTMLElement)) {
			return;
		}

		const context = this.adapter.contextFromSurface(surface);

		if (!context) {
			return;
		}

		this.adapter.updateOne(context, this.serializeInlineNodes(surface));
		this.bookmarkSurfaceSelection(surface);
	};

	handlePaste = (event: ClipboardEvent) => {
		if (this.adapter.disabled()) {
			return;
		}

		event.preventDefault();

		const surface = event.currentTarget;

		if (!(surface instanceof HTMLElement)) {
			return;
		}

		insertPlainText(surface, event.clipboardData?.getData('text/plain') ?? '', focusEnd, () => {
			const context = this.adapter.contextFromSurface(surface);

			if (context) {
				this.adapter.updateOne(context, this.serializeInlineNodes(surface));
			}
		});
	};

	handleDocumentPointerDown = (event: PointerEvent) => {
		if (!this.selectedVariable) {
			return;
		}

		const target = event.target;

		if (
			target instanceof Element &&
			target.closest('[data-format-inline-controller-variable]')
		) {
			return;
		}

		this.clearSelection();
	};

	handleDocumentSelectionChange = () => {
		if (this.adapter.disabled()) {
			return;
		}

		const root = this.adapter.root();
		const selection = root?.ownerDocument.getSelection();
		const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
		const surface = range ? this.closestSurface(range.commonAncestorContainer) : null;

		if (surface) {
			this.bookmarkSurfaceRange(surface, range);
		}
	};

	handleEscape = () => {
		this.clearSelection();
		this.adapter.dragCoordinator().endDrag();
	};

	handleVariableInsertionRequest = (
		request: { id: number; variableId: string } | null | undefined
	) => {
		if (!request || request.id === this.handledInsertionRequestId) {
			return false;
		}

		this.handledInsertionRequestId = request.id;
		return this.insertSelectedVariable(request.variableId);
	};

	clearSelection = (options: { rerender?: boolean } = {}) => {
		const selected = this.selectedVariable;

		if (!selected) {
			return;
		}

		const surface = options.rerender === false ? null : this.adapter.surfaceForContext(selected);
		this.selectedVariable = null;

		if (surface) {
			this.renderSurfaceFromCurrentContent(surface);
		}
	};

	clearDrag = () => {
		this.adapter.dragCoordinator().endDrag();
	};

	private configureSurface(element: HTMLElement, context: Context) {
		element.dataset.formatInlineSurfaceKey = this.adapter.contextKey(context);
	}

	private attachSurfaceListeners(element: HTMLElement) {
		element.addEventListener('focus', this.handleSurfaceFocus);
		element.addEventListener('click', this.handleSurfaceClick);
		element.addEventListener('keyup', this.handleSurfaceKeyup);
		element.addEventListener('pointerup', this.handleSurfacePointerup);
	}

	private detachSurfaceListeners(element: HTMLElement) {
		element.removeEventListener('focus', this.handleSurfaceFocus);
		element.removeEventListener('click', this.handleSurfaceClick);
		element.removeEventListener('keyup', this.handleSurfaceKeyup);
		element.removeEventListener('pointerup', this.handleSurfacePointerup);
	}

	private renderInlineNodes(
		element: HTMLElement,
		context: Context,
		nodes: readonly FormatInlineNode[]
	) {
		renderSurface(
			element,
			nodes,
			(nodeIndex) => ({
				...context,
				nodeIndex
			}),
			(variableId, source) => this.createVariablePill(variableId, source)
		);
	}

	private serializeInlineNodes(parent: Node): FormatInlineNode[] {
		return serializeSurface(parent, this.adapter.options);
	}

	private renderSurfaceFromCurrentContent(surface: HTMLElement) {
		const context = this.adapter.contextFromSurface(surface);

		if (!context) {
			return;
		}

		this.renderInlineNodes(surface, context, this.serializeInlineNodes(surface));
	}

	private createVariablePill(
		variableId: string,
		source: FormatInlineVariableIdentity<Context>
	) {
		const pill = createVariablePill({
			variableId,
			label: formatFormatVariableLabel(this.adapter.variables(), variableId),
			source,
			selected: !this.adapter.disabled() && this.isSameSelectedVariable(this.selectedVariable, source),
			disabled: this.adapter.disabled(),
			variableDatasetKey: this.adapter.options.variableDatasetKey,
			onSelect: this.selectVariable,
			onRemove: this.deleteSelectedVariable,
			onDragStart: this.startVariableDrag,
			onDragEnd: () => {
				this.clearDrag();
				this.clearSelection();
			}
		});

		pill.dataset.formatInlineControllerVariable = 'true';
		return pill;
	}

	private isSameSelectedVariable(
		left: FormatInlineVariableIdentity<Context> | null,
		right: FormatInlineVariableIdentity<Context>
	) {
		return left !== null && left.nodeIndex === right.nodeIndex && this.adapter.sameContext(left, right);
	}

	private selectVariable = (source: FormatInlineVariableIdentity<Context>) => {
		if (this.adapter.disabled()) {
			return;
		}

		const previousSelected = this.selectedVariable;

		if (this.isSameSelectedVariable(previousSelected, source)) {
			return;
		}

		const previousSurface = previousSelected
			? this.adapter.surfaceForContext(previousSelected)
			: null;
		const nextSurface = this.adapter.surfaceForContext(source);

		this.selectedVariable = source;

		if (previousSurface && previousSurface !== nextSurface) {
			this.renderSurfaceFromCurrentContent(previousSurface);
		}

		if (nextSurface) {
			this.renderSurfaceFromCurrentContent(nextSurface);
		}
	};

	private deleteSelectedVariable = (source: FormatInlineVariableIdentity<Context>) => {
		if (this.adapter.disabled() || !this.isSameSelectedVariable(this.selectedVariable, source)) {
			return;
		}

		const surface = this.adapter.surfaceForContext(source);

		if (!surface) {
			this.clearSelection({ rerender: false });
			return;
		}

		const nodes = this.serializeInlineNodes(surface);

		if (nodes[source.nodeIndex]?.type !== 'variable') {
			this.clearSelection({ rerender: false });
			this.renderInlineNodes(surface, source, nodes);
			return;
		}

		const nextNodes = joinSegments(
			nodes.slice(0, source.nodeIndex),
			[],
			nodes.slice(source.nodeIndex + 1),
			this.adapter.options
		);
		this.clearSelection({ rerender: false });
		this.adapter.updateOne(source, nextNodes);
		this.renderInlineNodes(surface, source, nextNodes);
	};

	private startVariableDrag = (
		event: DragEvent,
		variableId: string,
		source: FormatInlineVariableIdentity<Context>,
		sourcePill: HTMLElement
	) => {
		const sourceSurface = this.closestSurface(sourcePill);

		if (!event.dataTransfer || !sourceSurface || this.adapter.disabled()) {
			return;
		}

		const label = formatFormatVariableLabel(this.adapter.variables(), variableId);
		const item: FormatInlineDragItem<Context> = {
			...source,
			variableId,
			sourcePill,
			sourceSurface
		};

		this.clearSelection({ rerender: false });
		sourcePill.classList.remove('format-variable-pill--selected');
		sourcePill.textContent = label;

		this.adapter.dragCoordinator().startInlineDrag({
			event,
			regionId: this.adapter.scope,
			item,
			variableId,
			label
		});
	};

	moveVariableToTarget(item: unknown, target: FormatVariableDropTarget | null) {
		const activeDrag = this.resolveInlineDragItem(item);

		if (!activeDrag || !target) {
			return;
		}

		const root = this.adapter.root();
		const sourceSurface = activeDrag.sourceSurface;
		const sourcePill = activeDrag.sourcePill;
		const sourceContext = this.adapter.contextFromSurface(sourceSurface);
		const targetContext = this.adapter.contextFromSurface(target.surface);

		if (
			!sourceContext ||
			!targetContext ||
			!root?.contains(sourceSurface) ||
			!root.contains(target.surface) ||
			sourcePill.parentElement !== sourceSurface
		) {
			return;
		}

		if (this.adapter.sameContext(sourceContext, targetContext)) {
			const insertResult = insertVariable(
				target.surface,
				activeDrag.variableId,
				target.range,
				this.adapter.options,
				sourcePill
			);

			this.adapter.updateOne(targetContext, insertResult.nodes);
			this.renderInlineNodes(target.surface, targetContext, insertResult.nodes);
			focusEnd(target.surface);
			return;
		}

		const sourceNodes = removeChild(sourceSurface, sourcePill, this.adapter.options);
		const targetInsertResult = insertVariable(
			target.surface,
			activeDrag.variableId,
			target.range,
			this.adapter.options,
			null
		);

		this.adapter.updateMany([
			{
				...sourceContext,
				content: sourceNodes
			},
			{
				...targetContext,
				content: targetInsertResult.nodes
			}
		]);
		this.renderInlineNodes(sourceSurface, sourceContext, sourceNodes);
		this.renderInlineNodes(target.surface, targetContext, targetInsertResult.nodes);
		focusEnd(target.surface);
	}

	insertVariableAtTarget(target: FormatVariableDropTarget | null, variableId: string) {
		if (
			this.adapter.disabled() ||
			!target ||
			!this.adapter.variables().some((variable) => variable.id === variableId)
		) {
			return false;
		}

		return this.insertVariableIntoSurface(target.surface, variableId, target.range);
	}

	private insertSelectedVariable(variableId: string) {
		if (
			this.adapter.disabled() ||
			!this.adapter.variables().some((variable) => variable.id === variableId)
		) {
			return false;
		}

		const target = this.getVariableTapInsertionTarget();

		if (target) {
			return this.insertVariableIntoSurface(
				target.surface,
				variableId,
				target.range,
				'inserted-variable'
			);
		}

		const fallbackSurface = this.adapter.fallbackInsertionSurface();

		if (fallbackSurface) {
			return this.insertVariableIntoSurface(fallbackSurface, variableId, null);
		}

		if (!this.adapter.insertIntoEmptyDocument) {
			return false;
		}

		this.adapter.insertIntoEmptyDocument(variableId);
		return true;
	}

	private insertVariableIntoSurface(
		surface: HTMLElement,
		variableId: string,
		range: Range | null,
		caretPlacement: 'inserted-variable' | 'end' = 'end'
	) {
		const context = this.adapter.contextFromSurface(surface);

		if (!context) {
			return false;
		}

		this.clearSelection();
		const insertResult = insertVariable(surface, variableId, range, this.adapter.options);

		this.adapter.updateOne(context, insertResult.nodes);
		this.renderInlineNodes(surface, context, insertResult.nodes);

		if (caretPlacement === 'inserted-variable') {
			this.focusAfterInsertedVariable(surface, insertResult.insertedNodeIndex);
			return true;
		}

		focusEnd(surface);
		this.bookmarkSurfaceSelection(surface);
		return true;
	}

	private getVariableTapInsertionTarget(): FormatVariableDropTarget | null {
		const activeSurface = this.getActiveSurface();
		const activeRange = activeSurface ? this.getActiveSurfaceRange(activeSurface) : null;

		if (
			activeSurface &&
			activeRange &&
			this.isBookmarkableInlineRange(activeSurface, activeRange)
		) {
			this.bookmarkSurfaceRange(activeSurface, activeRange);

			return {
				surface: activeSurface,
				range: activeRange.cloneRange()
			};
		}

		return this.getBookmarkedInsertionTarget();
	}

	private getBookmarkedInsertionTarget(): FormatVariableDropTarget | null {
		const bookmark = this.caretBookmark;

		if (
			!bookmark ||
			!this.isBookmarkableSurface(bookmark.surface) ||
			!this.isBookmarkableInlineRange(bookmark.surface, bookmark.range)
		) {
			return null;
		}

		return {
			surface: bookmark.surface,
			range: bookmark.range.cloneRange()
		};
	}

	private focusAfterInsertedVariable(surface: HTMLElement, insertedNodeIndex: number | null) {
		if (insertedNodeIndex === null) {
			focusEnd(surface);
			this.bookmarkSurfaceSelection(surface);
			return;
		}

		surface.focus();
		const range = createSurfaceRangeAfterChild(surface, insertedNodeIndex);
		selectRange(range);
		this.bookmarkSurfaceRange(surface, range);
	}

	private isBookmarkableSurface(surface: HTMLElement | null) {
		const root = this.adapter.root();

		return (
			!this.adapter.disabled() &&
			surface !== null &&
			root?.contains(surface) === true &&
			surface.isContentEditable &&
			this.adapter.contextFromSurface(surface) !== null
		);
	}

	private isBookmarkableInlineRange(surface: HTMLElement, range: Range | null) {
		return (
			rangeBelongsToSurface(surface, range) &&
			!closestVariablePill(
				surface,
				range!.startContainer,
				this.adapter.options.variableDatasetKey
			)
		);
	}

	private bookmarkSurfaceRange(surface: HTMLElement, range: Range | null) {
		if (!this.isBookmarkableSurface(surface) || !this.isBookmarkableInlineRange(surface, range)) {
			return;
		}

		this.caretBookmark = {
			surface,
			range: range!.cloneRange()
		};
	}

	private bookmarkSurfaceSelection(surface: HTMLElement) {
		const selection = surface.ownerDocument.getSelection();
		const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

		this.bookmarkSurfaceRange(surface, range);
	}

	private handleSurfaceFocus = (event: FocusEvent) => {
		this.bookmarkEventSurfaceSelection(event);
	};

	private handleSurfaceKeyup = (event: KeyboardEvent) => {
		this.bookmarkEventSurfaceSelection(event);
	};

	private handleSurfacePointerup = (event: PointerEvent) => {
		this.bookmarkEventSurfaceSelection(event);
	};

	private handleSurfaceClick = (event: MouseEvent) => {
		const surface = event.currentTarget;
		const target = event.target;

		if (
			surface instanceof HTMLElement &&
			target instanceof Node &&
			closestVariablePill(surface, target, this.adapter.options.variableDatasetKey)
		) {
			return;
		}

		this.clearSelection();
		this.bookmarkEventSurfaceSelection(event);
	};

	private bookmarkEventSurfaceSelection(event: Event) {
		const target = event.currentTarget;

		if (target instanceof HTMLElement) {
			this.bookmarkSurfaceSelection(target);
		}
	}

	private getActiveSurface() {
		return this.closestSurface(this.adapter.root()?.ownerDocument.activeElement ?? null);
	}

	private getActiveSurfaceRange(surface: HTMLElement) {
		const selection = surface.ownerDocument.getSelection();
		const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

		return rangeBelongsToSurface(surface, range) ? range : null;
	}

	private closestSurface(node: Node | null) {
		const element = node instanceof Element ? node : node?.parentElement;
		const surface = element?.closest('[data-format-inline-surface-key]');
		const root = this.adapter.root();

		return surface instanceof HTMLElement && root?.contains(surface) ? surface : null;
	}

	private resolveInlineDragItem(item: unknown): FormatInlineDragItem<Context> | null {
		if (
			typeof item !== 'object' ||
			item === null ||
			!('variableId' in item) ||
			!('nodeIndex' in item) ||
			!('sourcePill' in item) ||
			!('sourceSurface' in item)
		) {
			return null;
		}

		const candidate = item as Partial<FormatInlineDragItem<Context>>;

		if (
			typeof candidate.variableId !== 'string' ||
			typeof candidate.nodeIndex !== 'number' ||
			!Number.isInteger(candidate.nodeIndex) ||
			candidate.nodeIndex < 0 ||
			!(candidate.sourcePill instanceof HTMLElement) ||
			!(candidate.sourceSurface instanceof HTMLElement)
		) {
			return null;
		}

		return candidate as FormatInlineDragItem<Context>;
	}
}
