import type { FormatInlineNode } from '$lib/features/format-starters/domain';

export type FormatInlineSurfaceOptions = {
	variableDatasetKey: string;
	normalize?: (nodes: readonly FormatInlineNode[]) => FormatInlineNode[];
	joinMode: 'body' | 'cell';
};

export type FormatVariablePillOptions<Source> = {
	variableId: string;
	label: string;
	source: Source;
	selected: boolean;
	disabled: boolean;
	variableDatasetKey: string;
	onSelect: (source: Source) => void;
	onRemove: (source: Source) => void;
	onDragStart: (event: DragEvent, variableId: string, source: Source, pill: HTMLElement) => void;
	onDragEnd: () => void;
};

export type FormatInlineInsertionResult = {
	nodes: FormatInlineNode[];
	insertedNodeIndex: number | null;
};

export function getDocumentRangeFromPoint(
	document: Document | null | undefined,
	clientX: number,
	clientY: number
) {
	if (!document) {
		return null;
	}

	const rangeDocument = document as Document & {
		caretRangeFromPoint?: (x: number, y: number) => Range | null;
	};

	if ('caretPositionFromPoint' in document) {
		const position = document.caretPositionFromPoint(clientX, clientY);

		if (!position) {
			return null;
		}

		const range = document.createRange();
		range.setStart(position.offsetNode, position.offset);
		range.collapse(true);

		return range;
	}

	return rangeDocument.caretRangeFromPoint?.(clientX, clientY) ?? null;
}

const TIGHT_FOLLOWING_PUNCTUATION = new Set(['.', ',', ':']);
const SENTENCE_ENDING_PUNCTUATION = new Set(['.', '!', '?']);

function normalizeInlineNodes(
	nodes: readonly FormatInlineNode[],
	options: FormatInlineSurfaceOptions
) {
	return (options.normalize ?? normalizeSurfaceNodes)(nodes);
}

export function cloneFormatInlineNodes(nodes: readonly FormatInlineNode[]) {
	return nodes.map((node) => ({ ...node }));
}

export function normalizeSurfaceNodes(nodes: readonly FormatInlineNode[]) {
	const normalized: FormatInlineNode[] = [];

	for (const node of nodes) {
		const previous = normalized.at(-1);

		if (node.type === 'text' && previous?.type === 'text') {
			previous.text += node.text;
		} else if (node.type !== 'text' || node.text.length > 0) {
			normalized.push({ ...node });
		}
	}

	return normalized;
}

export function areInlineNodesEqual(
	left: readonly FormatInlineNode[],
	right: readonly FormatInlineNode[]
) {
	if (left.length !== right.length) {
		return false;
	}

	return left.every((leftNode, index) => {
		const rightNode = right[index];

		if (leftNode.type !== rightNode.type) {
			return false;
		}

		if (leftNode.type === 'text') {
			return rightNode.type === 'text' && leftNode.text === rightNode.text;
		}

		return rightNode.type === 'variable' && leftNode.variableId === rightNode.variableId;
	});
}

export function createVariablePill<Source>({
	variableId,
	label,
	source,
	selected,
	disabled,
	variableDatasetKey,
	onSelect,
	onRemove,
	onDragStart,
	onDragEnd
}: FormatVariablePillOptions<Source>) {
	const pill = document.createElement('span');

	pill.dataset[variableDatasetKey] = variableId;
	pill.contentEditable = 'false';
	pill.draggable = !disabled;
	pill.className =
		'format-variable-pill inline-flex items-center rounded-full border border-transparent bg-positive-50 px-1.5 py-[0.125rem] align-baseline text-[0.73rem] font-normal leading-none text-positive-900' +
		(selected ? ' format-variable-pill--selected' : '');
	renderVariablePillContents(pill, label, selected, () => onRemove(source));

	if (!disabled) {
		pill.addEventListener('click', (event) => {
			event.preventDefault();
			event.stopPropagation();
			onSelect(source);
		});
		pill.addEventListener('dragstart', (event) => onDragStart(event, variableId, source, pill));
		pill.addEventListener('dragend', onDragEnd);
	}

	return pill;
}

export function renderVariablePillContents(
	pill: HTMLElement,
	label: string,
	selected: boolean,
	onRemove: () => void
) {
	if (!selected) {
		pill.textContent = label;
		return;
	}

	const labelElement = document.createElement('span');
	labelElement.className = 'format-variable-pill__label';
	labelElement.textContent = label;

	const removeButton = document.createElement('button');
	removeButton.type = 'button';
	removeButton.className = 'format-variable-pill__remove';
	removeButton.setAttribute('aria-label', 'Remove variable');
	removeButton.textContent = '×';
	removeButton.addEventListener('mousedown', (event) => {
		event.preventDefault();
	});
	removeButton.addEventListener('click', (event) => {
		event.preventDefault();
		event.stopPropagation();
		onRemove();
	});

	pill.replaceChildren(labelElement, removeButton);
}

export function renderSurface<Source>(
	element: HTMLElement,
	nodes: readonly FormatInlineNode[],
	createSource: (nodeIndex: number) => Source,
	createPill: (variableId: string, source: Source) => HTMLElement
) {
	element.replaceChildren();

	nodes.forEach((node, nodeIndex) => {
		if (node.type === 'text') {
			element.append(document.createTextNode(node.text));
			return;
		}

		element.append(createPill(node.variableId, createSource(nodeIndex)));
	});

	if (element.childNodes.length === 0) {
		element.append(document.createElement('br'));
	}
}

export function serializeSurface(
	parent: Node,
	options: FormatInlineSurfaceOptions
): FormatInlineNode[] {
	const nodes: FormatInlineNode[] = [];

	parent.childNodes.forEach((child) => {
		nodes.push(...serializeChild(child, options));
	});

	return normalizeInlineNodes(nodes, options);
}

export function serializeChild(
	child: ChildNode,
	options: FormatInlineSurfaceOptions
): FormatInlineNode[] {
	if (child.nodeType === Node.TEXT_NODE) {
		return [{ type: 'text', text: child.textContent ?? '' }];
	}

	if (!(child instanceof HTMLElement) || child.tagName === 'BR') {
		return [];
	}

	const variableId = child.dataset[options.variableDatasetKey];

	if (variableId) {
		return [{ type: 'variable', variableId }];
	}

	return serializeSurface(child, options);
}

export function joinSegments(
	beforeNodes: readonly FormatInlineNode[],
	middleNodes: readonly FormatInlineNode[],
	afterNodes: readonly FormatInlineNode[],
	options: FormatInlineSurfaceOptions
) {
	const before = normalizeInlineNodes(cloneFormatInlineNodes(beforeNodes), options);
	const middle = normalizeInlineNodes(cloneFormatInlineNodes(middleNodes), options);
	const after = normalizeInlineNodes(cloneFormatInlineNodes(afterNodes), options);
	const joined: FormatInlineNode[] = [];

	function appendPart(part: FormatInlineNode[]) {
		if (part.length === 0) {
			return;
		}

		trimTrailingHorizontalSpace(joined);
		trimLeadingHorizontalSpace(part);

		if (shouldInsertBoundarySpace(joined, part, options)) {
			joined.push({ type: 'text', text: ' ' });
		}

		joined.push(...part);
	}

	joined.push(...before);
	appendPart(middle);
	appendPart(after);

	return normalizeInlineNodes(joined, options);
}

function joinSegmentsWithInsertedVariable(
	beforeNodes: readonly FormatInlineNode[],
	variableNode: FormatInlineNode,
	afterNodes: readonly FormatInlineNode[],
	options: FormatInlineSurfaceOptions
): FormatInlineInsertionResult {
	const before = normalizeInlineNodes(cloneFormatInlineNodes(beforeNodes), options);
	const variable = normalizeInlineNodes([variableNode], options);
	const after = normalizeInlineNodes(cloneFormatInlineNodes(afterNodes), options);
	const joined: FormatInlineNode[] = [];
	let insertedNodeIndex: number | null = null;

	function appendPart(part: FormatInlineNode[], isInsertedVariable = false) {
		if (part.length === 0) {
			return;
		}

		trimTrailingHorizontalSpace(joined);
		trimLeadingHorizontalSpace(part);

		if (shouldInsertBoundarySpace(joined, part, options)) {
			joined.push({ type: 'text', text: ' ' });
		}

		if (isInsertedVariable) {
			insertedNodeIndex = joined.length;
		}

		joined.push(...part);
	}

	joined.push(...before);
	appendPart(variable, true);
	appendPart(after);

	return {
		nodes: normalizeInlineNodes(joined, options),
		insertedNodeIndex
	};
}

export function removeChild(
	surface: HTMLElement,
	removedChild: ChildNode,
	options: FormatInlineSurfaceOptions
) {
	const beforeNodes: FormatInlineNode[] = [];
	const afterNodes: FormatInlineNode[] = [];
	let didRemoveChild = false;

	for (const child of surface.childNodes) {
		if (child === removedChild) {
			didRemoveChild = true;
			continue;
		}

		const targetNodes = didRemoveChild ? afterNodes : beforeNodes;
		targetNodes.push(...serializeChild(child, options));
	}

	if (!didRemoveChild) {
		return normalizeInlineNodes(beforeNodes, options);
	}

	return joinSegments(beforeNodes, [], afterNodes, options);
}

export function removeOptionalChild(
	surface: HTMLElement,
	removedChild: ChildNode | null,
	options: FormatInlineSurfaceOptions
) {
	return removedChild
		? removeChild(surface, removedChild, options)
		: serializeSurface(surface, options);
}

export function splitAtRange(
	surface: HTMLElement,
	range: Range,
	omittedChild: ChildNode | null,
	options: FormatInlineSurfaceOptions
) {
	const beforeNodes: FormatInlineNode[] = [];
	const afterNodes: FormatInlineNode[] = [];
	const children = Array.from(surface.childNodes);
	let inserted = false;

	if (range.startContainer === surface) {
		children.forEach((child, index) => {
			if (!inserted && index === range.startOffset) {
				inserted = true;
			}

			if (child === omittedChild) {
				return;
			}

			const targetNodes = inserted ? afterNodes : beforeNodes;
			targetNodes.push(...serializeChild(child, options));
		});

		return { beforeNodes, afterNodes };
	}

	for (const child of children) {
		if (child === omittedChild) {
			continue;
		}

		if (!inserted && child === range.startContainer && child.nodeType === Node.TEXT_NODE) {
			const text = child.textContent ?? '';
			beforeNodes.push({ type: 'text', text: text.slice(0, range.startOffset) });
			afterNodes.push({ type: 'text', text: text.slice(range.startOffset) });
			inserted = true;
			continue;
		}

		const targetNodes = inserted ? afterNodes : beforeNodes;
		targetNodes.push(...serializeChild(child, options));
	}

	return { beforeNodes, afterNodes };
}

export function insertVariable(
	surface: HTMLElement,
	variableId: string,
	range: Range | null,
	options: FormatInlineSurfaceOptions,
	sourcePill: HTMLElement | null = null
): FormatInlineInsertionResult {
	const variableNode: FormatInlineNode = { type: 'variable', variableId };

	if (!range || !surface.contains(range.commonAncestorContainer)) {
		return joinSegmentsWithInsertedVariable(
			removeOptionalChild(surface, sourcePill, options),
			variableNode,
			[],
			options
		);
	}

	const sourceChildIndex =
		sourcePill && sourcePill.parentNode === surface ? childIndex(surface, sourcePill) : -1;

	if (
		range.startContainer === surface &&
		sourceChildIndex >= 0 &&
		(range.startOffset === sourceChildIndex || range.startOffset === sourceChildIndex + 1)
	) {
		return {
			nodes: serializeSurface(surface, options),
			insertedNodeIndex: null
		};
	}

	const { beforeNodes, afterNodes } = splitAtRange(
		surface,
		range,
		sourcePill,
		options
	);

	return joinSegmentsWithInsertedVariable(beforeNodes, variableNode, afterNodes, options);
}

export function insertPlainText(
	surface: HTMLElement,
	text: string,
	focusEnd: (surface: HTMLElement) => void,
	onChange: () => void
) {
	const selection = document.getSelection();
	const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

	if (!range || !surface.contains(range.commonAncestorContainer)) {
		focusEnd(surface);
	}

	if (document.execCommand('insertText', false, text)) {
		onChange();
		return;
	}

	const activeSelection = document.getSelection();
	const activeRange = activeSelection?.rangeCount ? activeSelection.getRangeAt(0) : null;
	const textNode = document.createTextNode(text);

	if (activeRange && surface.contains(activeRange.commonAncestorContainer)) {
		activeRange.deleteContents();
		activeRange.insertNode(textNode);
		activeRange.setStartAfter(textNode);
		activeRange.collapse(true);
		activeSelection?.removeAllRanges();
		activeSelection?.addRange(activeRange);
	} else {
		surface.append(textNode);
	}

	onChange();
}

export function childIndex(parent: Node, child: Node) {
	return Array.prototype.indexOf.call(parent.childNodes, child);
}

export function selectRange(range: Range) {
	const doc =
		range.startContainer.nodeType === Node.DOCUMENT_NODE
			? (range.startContainer as Document)
			: range.startContainer.ownerDocument;

	if (!doc) {
		return;
	}

	const selection = doc.getSelection();

	selection?.removeAllRanges();
	selection?.addRange(range);
}

export function focusEnd(surface: HTMLElement) {
	surface.focus();

	const range = surface.ownerDocument.createRange();
	range.selectNodeContents(surface);
	range.collapse(false);
	selectRange(range);
}

export function createSurfaceRange(surface: HTMLElement, offset: number) {
	const range = surface.ownerDocument.createRange();
	const childCount = surface.childNodes.length;

	range.setStart(surface, Math.max(0, Math.min(offset, childCount)));
	range.collapse(true);

	return range;
}

export function createSurfaceRangeAfterChild(surface: HTMLElement, childOffset: number) {
	return createSurfaceRange(surface, childOffset + 1);
}

export function closestVariablePill(
	surface: HTMLElement,
	node: Node,
	variableDatasetKey: string
) {
	let element: Node | null = node instanceof Element ? node : node.parentNode;

	while (element && surface.contains(element)) {
		if (element instanceof HTMLElement && element.dataset[variableDatasetKey]) {
			return element;
		}

		element = element.parentNode;
	}

	return null;
}

export function normalizeDropRange(
	surface: HTMLElement,
	range: Range | null,
	clientX: number,
	options: FormatInlineSurfaceOptions
) {
	if (!range || !surface.contains(range.commonAncestorContainer)) {
		return null;
	}

	const pill = closestVariablePill(surface, range.startContainer, options.variableDatasetKey);

	if (!pill || pill.parentNode !== surface) {
		const normalizedRange = range.cloneRange();
		normalizedRange.collapse(true);
		return normalizedRange;
	}

	const pillRect = pill.getBoundingClientRect();
	const pillOffset = childIndex(surface, pill);
	const offset = clientX > pillRect.left + pillRect.width / 2 ? pillOffset + 1 : pillOffset;

	return createSurfaceRange(surface, offset);
}

function hasMeaningfulInlineContent(
	nodes: readonly FormatInlineNode[],
	options: FormatInlineSurfaceOptions
) {
	return nodes.some((node) => {
		if (node.type === 'variable') {
			return true;
		}

		return options.joinMode === 'body'
			? node.text.replace(/[ \t]/g, '').length > 0
			: node.text.trim().length > 0;
	});
}

function trimTrailingHorizontalSpace(nodes: FormatInlineNode[]) {
	const last = nodes.at(-1);

	if (last?.type === 'text') {
		last.text = last.text.replace(/[ \t]+$/, '');
	}
}

function trimLeadingHorizontalSpace(nodes: FormatInlineNode[]) {
	const first = nodes[0];

	if (first?.type === 'text') {
		first.text = first.text.replace(/^[ \t]+/, '');
	}
}

function shouldInsertBoundarySpace(
	left: readonly FormatInlineNode[],
	right: readonly FormatInlineNode[],
	options: FormatInlineSurfaceOptions
) {
	return (
		hasMeaningfulInlineContent(left, options) &&
		hasMeaningfulInlineContent(right, options) &&
		!startsWithTightFollowingPunctuation(right) &&
		!startsWithVariableAfterSentenceEnd(left, right) &&
		(options.joinMode === 'cell' || !boundaryTouchesLineBreak(left, right))
	);
}

function startsWithVariableAfterSentenceEnd(
	left: readonly FormatInlineNode[],
	right: readonly FormatInlineNode[]
) {
	return startsWithVariable(right) && endsWithSentenceEndingPunctuation(left);
}

function startsWithVariable(nodes: readonly FormatInlineNode[]) {
	return nodes[0]?.type === 'variable';
}

function endsWithSentenceEndingPunctuation(nodes: readonly FormatInlineNode[]) {
	const last = nodes.at(-1);

	return last?.type === 'text' && SENTENCE_ENDING_PUNCTUATION.has(last.text.at(-1) ?? '');
}

function startsWithTightFollowingPunctuation(nodes: readonly FormatInlineNode[]) {
	const first = nodes[0];

	return first?.type === 'text' && TIGHT_FOLLOWING_PUNCTUATION.has(first.text[0] ?? '');
}

function boundaryTouchesLineBreak(
	left: readonly FormatInlineNode[],
	right: readonly FormatInlineNode[]
) {
	const lastLeft = left.at(-1);
	const firstRight = right[0];

	return (
		(lastLeft?.type === 'text' && /\n$/.test(lastLeft.text)) ||
		(firstRight?.type === 'text' && /^\n/.test(firstRight.text))
	);
}
