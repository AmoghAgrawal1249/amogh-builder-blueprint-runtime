<script lang="ts">
	import {
		formatParagraph,
		createFormatId,
		type FormatBodyBlock,
		type FormatInlineNode,
		type FormatVariableDefinition
	} from '$lib/features/format-starters/domain';
	import {
		getDocumentRangeFromPoint,
		normalizeDropRange,
		type FormatInlineSurfaceOptions
	} from '../inline/format-inline-surface';
	import {
		FormatInlineController,
		type FormatInlineVariableIdentity,
		type FormatVariableDropTarget as FormatInlineVariableDropTarget
	} from '../inline/format-inline-controller.svelte';
	import type { FormatVariableInsertionRequest } from '../state/format-creator-state.svelte';
	import type { FormatVariableDragCoordinator } from '../variables/format-variable-drag-coordinator.svelte';

	type InlineSurfaceParams = {
		blockId: string;
		nodes: readonly FormatInlineNode[];
	};

	type InlineVariableContext = {
		blockId: string;
	};

	type SelectedVariable = FormatInlineVariableIdentity<InlineVariableContext>;

	type Props = {
		body: readonly FormatBodyBlock[];
		variables: readonly FormatVariableDefinition[];
		disabled?: boolean;
		dragCoordinator: FormatVariableDragCoordinator;
		variableInsertionRequest?: FormatVariableInsertionRequest | null;
		onVariableInsertionRequestHandled?: (requestId: number) => void;
		onBodyChange: (body: FormatBodyBlock[]) => void;
	};

	const INLINE_SURFACE_OPTIONS = {
		variableDatasetKey: 'formatVariableId',
		joinMode: 'body'
	} satisfies FormatInlineSurfaceOptions;

	let {
		body,
		variables,
		disabled = false,
		dragCoordinator,
		variableInsertionRequest = null,
		onVariableInsertionRequestHandled,
		onBodyChange
	}: Props = $props();
	let editorRoot = $state<HTMLDivElement | null>(null);

	const emptyParagraphId = createFormatId('paragraph');
	const displayedBody = $derived(
		body.length > 0 ? body : [formatParagraph(emptyParagraphId, [])]
	);

	const controller = new FormatInlineController<InlineVariableContext>({
		scope: 'body',
		dragCoordinator: () => dragCoordinator,
		root: () => editorRoot,
		variables: () => variables,
		disabled: () => disabled,
		options: INLINE_SURFACE_OPTIONS,
		contextKey: (context) => context.blockId,
		sameContext: (left, right) => left.blockId === right.blockId,
		contextFromSurface: getInlineContext,
		surfaceForContext: findInlineSurface,
		updateOne: (context, nodes) => updateInlineContent(context.blockId, nodes),
		updateMany: updateInlineContents,
		fallbackInsertionSurface: getLastInlineSurface,
		insertIntoEmptyDocument: insertVariableIntoEmptyBody
	});

	const inlineSurface = controller.createSurfaceAction<InlineSurfaceParams>((_element, params) => ({
		context: { blockId: params.blockId },
		nodes: params.nodes
	}));

	$effect(() => {
		return dragCoordinator.registerRegion({
			id: 'body',
			resolveDrop: (drag, point) => {
				if (drag.type === 'inline' && drag.regionId !== 'body') {
					return null;
				}

				const target = resolveVariableDropTarget(point.x, point.y);

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

		if (disabled || !bodyContainsSelectedVariable(displayedBody, selected)) {
			controller.clearSelection();
		}
	});

	$effect(() => {
		const request = variableInsertionRequest;

		if (request && controller.handleVariableInsertionRequest(request)) {
			onVariableInsertionRequestHandled?.(request.id);
		}
	});

	function bodyContainsSelectedVariable(
		blocks: readonly FormatBodyBlock[],
		selected: SelectedVariable
	) {
		return blocks.some(
			(block) =>
				block.id === selected.blockId &&
				block.content[selected.nodeIndex]?.type === 'variable'
		);
	}

	function updateInlineContent(blockId: string, content: FormatInlineNode[]) {
		let didUpdate = false;
		const nextBody = body.map((block) => {
			if (block.id !== blockId) {
				return block;
			}

			didUpdate = true;

			return {
				...block,
				content
			};
		});

		if (!didUpdate && body.length === 0 && blockId === emptyParagraphId) {
			onBodyChange([formatParagraph(emptyParagraphId, content)]);
			return;
		}

		if (!didUpdate) {
			return;
		}

		onBodyChange(nextBody);
	}

	function updateInlineContents(
		updates: Array<{ blockId: string; content: FormatInlineNode[] }>
	) {
		const updateByBlockId = new Map(updates.map((update) => [update.blockId, update]));

		onBodyChange(
			body.map((block) => {
				const update = updateByBlockId.get(block.id);

				return update
					? {
							...block,
							content: update.content
						}
					: block;
			})
		);
	}

	function getInlineContext(element: HTMLElement) {
		const blockId = element.dataset.formatInlineSurfaceKey;

		if (!blockId) {
			return null;
		}

		return { blockId };
	}

	function getInlineSurfaces() {
		return Array.from(
			editorRoot?.querySelectorAll<HTMLElement>('[data-format-inline-surface-key]') ?? []
		);
	}

	function findInlineSurface(identity: InlineVariableContext) {
		return (
			getInlineSurfaces().find((surface) => {
				const context = getInlineContext(surface);

				return context?.blockId === identity.blockId;
			}) ?? null
		);
	}

	function closestInlineSurface(node: Node | null) {
		const element = node instanceof Element ? node : node?.parentElement;
		const inline = element?.closest('[data-format-inline-surface-key]');

		return inline instanceof HTMLElement && editorRoot?.contains(inline) ? inline : null;
	}

	function getInlineSurfaceUnderPointer(clientX: number, clientY: number) {
		return closestInlineSurface(
			editorRoot?.ownerDocument.elementFromPoint(clientX, clientY) ?? null
		);
	}

	function getNearestInlineSurface(clientX: number, clientY: number) {
		const surfaces = getInlineSurfaces();

		if (surfaces.length === 0) {
			return null;
		}

		return surfaces.reduce((nearest, surface) => {
			const rect = surface.getBoundingClientRect();
			const x = Math.max(rect.left, Math.min(clientX, rect.right));
			const y = Math.max(rect.top, Math.min(clientY, rect.bottom));
			const distance = Math.hypot(clientX - x, clientY - y);

			return distance < nearest.distance ? { surface, distance } : nearest;
		}, { surface: surfaces[0], distance: Number.POSITIVE_INFINITY }).surface;
	}

	function getLastInlineSurface() {
		const surfaces = getInlineSurfaces();

		return surfaces.at(-1) ?? null;
	}

	function resolveVariableDropTarget(
		clientX: number,
		clientY: number
	): FormatInlineVariableDropTarget | null {
		if (disabled || !isPointInsideRoot(clientX, clientY)) {
			return null;
		}

		const pointerSurface = getInlineSurfaceUnderPointer(clientX, clientY);
		const pointRange = getDocumentRangeFromPoint(editorRoot?.ownerDocument, clientX, clientY);
		const rangeSurface = pointRange ? closestInlineSurface(pointRange.commonAncestorContainer) : null;
		const targetSurface =
			pointerSurface ?? rangeSurface ?? getNearestInlineSurface(clientX, clientY);

		if (!targetSurface) {
			return null;
		}

		return {
			surface: targetSurface,
			range:
				rangeSurface === targetSurface
					? normalizeDropRange(targetSurface, pointRange, clientX, INLINE_SURFACE_OPTIONS)
					: null
		};
	}

	function insertVariableIntoEmptyBody(variableId: string) {
		onBodyChange([
			formatParagraph(createFormatId('paragraph'), [
				{
					type: 'variable',
					variableId
				}
			])
		]);
	}

	function isPointInsideRoot(clientX: number, clientY: number) {
		const rect = editorRoot?.getBoundingClientRect();

		return Boolean(
			rect &&
				clientX >= rect.left &&
				clientX <= rect.right &&
				clientY >= rect.top &&
				clientY <= rect.bottom
		);
	}
</script>

<svelte:document
	onpointerdown={controller.handleDocumentPointerDown}
	onselectionchange={controller.handleDocumentSelectionChange}
/>
<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape') {
			controller.handleEscape();
		}
	}}
/>

<div
	bind:this={editorRoot}
	class="format-email-body-editor"
	role="group"
	aria-label="Email body"
>
	{#each displayedBody as block (block.id)}
		<p class="format-body-paragraph">
			<span
				use:inlineSurface={{ blockId: block.id, nodes: block.content }}
				class="format-inline-surface"
				contenteditable={!disabled}
				role="textbox"
				tabindex={disabled ? -1 : 0}
				aria-label="Email paragraph"
				oninput={controller.handleInput}
				onpaste={controller.handlePaste}
			></span>
		</p>
	{/each}

</div>

<style>
	.format-email-body-editor {
		position: relative;
		min-height: calc(1.72em * 4);
		border: 0;
		outline: none;
		color: rgb(28 25 23);
		font-size: 0.79rem;
		line-height: 1.9;
		white-space: pre-wrap;
	}

	.format-body-paragraph {
		margin: 0 0 0.875rem;
		white-space: pre-wrap;
	}

	.format-body-paragraph:last-child {
		margin-bottom: 0;
	}

	.format-inline-surface {
		display: inline;
		min-width: 1ch;
		outline: none;
		white-space: pre-wrap;
	}

	.format-inline-surface[contenteditable='false'] {
		cursor: default;
		opacity: 0.6;
	}

	.format-email-body-editor :global(.format-variable-pill) {
		user-select: none;
		gap: 0.25rem;
		transition:
			background-color 150ms ease,
			border-color 150ms ease;
		vertical-align: baseline;
	}

	.format-inline-surface:not([contenteditable='false']) :global(.format-variable-pill) {
		cursor: grab;
	}

	.format-inline-surface:not([contenteditable='false']) :global(.format-variable-pill:hover) {
		background: var(--positive-100);
	}

	.format-inline-surface:not([contenteditable='false']) :global(.format-variable-pill:active) {
		cursor: grabbing;
	}

	.format-email-body-editor :global(.format-variable-pill--selected) {
		border-color: transparent;
		background: var(--positive-100);
	}

	.format-email-body-editor :global(.format-variable-pill__label) {
		line-height: 1;
	}

	.format-email-body-editor :global(.format-variable-pill__remove) {
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

	.format-email-body-editor :global(.format-variable-pill__remove:hover) {
		background: var(--positive-100);
	}

	.format-inline-surface:focus :global(.format-variable-pill) {
		border-color: transparent;
	}

</style>
