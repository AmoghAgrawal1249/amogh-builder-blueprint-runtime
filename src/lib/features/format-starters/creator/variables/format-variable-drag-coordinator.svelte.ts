import { SvelteMap } from 'svelte/reactivity';
import type { FormatVariableDefinition } from '$lib/features/format-starters/domain';
import {
	FORMAT_INLINE_VARIABLE_DRAG_MIME,
	FORMAT_VARIABLE_DRAG_MIME,
	createFormatVariableDragImage
} from './format-variable-drag';

export type FormatVariableDropPoint = {
	x: number;
	y: number;
};

export type FormatVariableDrag =
	| { type: 'palette'; variableId: string }
	| {
			type: 'inline';
			regionId: string;
			item: unknown;
			variableId: string;
		};

export type FormatVariableDropAction = {
	effect: 'copy' | 'move';
	commit(): void;
};

export type FormatVariableDropRegion = {
	id: string;
	resolveDrop(drag: FormatVariableDrag, point: FormatVariableDropPoint): FormatVariableDropAction | null;
};

type FormatVariableDragSession = {
	document: Document;
	window: Window;
};

type FormatVariableNativeDragStart = {
	event: DragEvent;
	drag: FormatVariableDrag;
	effectAllowed: DataTransfer['effectAllowed'];
	mimeType: string;
	mimeValue: string;
	label: string;
};

export class FormatVariableDragCoordinator {
	private drag: FormatVariableDrag | null = null;
	private readonly regions = new SvelteMap<string, FormatVariableDropRegion>();
	private dragSession: FormatVariableDragSession | null = null;

	registerRegion(region: FormatVariableDropRegion) {
		this.regions.set(region.id, region);

		return () => {
			if (this.regions.get(region.id) !== region) {
				return;
			}

			this.regions.delete(region.id);
			this.endDrag();
		};
	}

	startPaletteDrag(event: DragEvent, variable: FormatVariableDefinition) {
		this.endDrag();

		if (!event.dataTransfer) {
			return;
		}

		this.startNativeDrag({
			event,
			drag: {
				type: 'palette',
				variableId: variable.id
			},
			effectAllowed: 'copy',
			mimeType: FORMAT_VARIABLE_DRAG_MIME,
			mimeValue: variable.id,
			label: variable.label
		});
	}

	startInlineDrag({
		event,
		regionId,
		item,
		variableId,
		label
	}: {
		event: DragEvent;
		regionId: string;
		item: unknown;
		variableId: string;
		label: string;
	}) {
		this.endDrag();

		if (!event.dataTransfer) {
			return;
		}

		this.startNativeDrag({
			event,
			drag: {
				type: 'inline',
				regionId,
				item,
				variableId
			},
			effectAllowed: 'move',
			mimeType: FORMAT_INLINE_VARIABLE_DRAG_MIME,
			mimeValue: variableId,
			label
		});
	}

	endDrag = () => {
		const session = this.dragSession;

		this.dragSession = null;

		if (session) {
			this.removeSessionListeners(session);
		}

		this.drag = null;
	};

	private startNativeDrag({
		event,
		drag,
		effectAllowed,
		mimeType,
		mimeValue,
		label
	}: FormatVariableNativeDragStart) {
		const dataTransfer = event.dataTransfer;

		if (!dataTransfer) {
			return;
		}

		const dragImage = createFormatVariableDragImage(label);

		dataTransfer.effectAllowed = effectAllowed;
		dataTransfer.setData(mimeType, mimeValue);
		dataTransfer.setData('text/plain', label);
		dataTransfer.setDragImage(
			dragImage,
			dragImage.offsetWidth / 2,
			dragImage.offsetHeight / 2
		);

		if (this.installDragSession(event)) {
			this.drag = drag;
		}

		this.removeDragImageAfterStart(dragImage);
	}

	private installDragSession(event: DragEvent) {
		const document = this.getEventDocument(event);
		const window = document?.defaultView;

		if (!document || !window) {
			return false;
		}

		const currentSession = this.dragSession;

		if (currentSession?.document === document && currentSession.window === window) {
			return true;
		}

		if (currentSession) {
			this.removeSessionListeners(currentSession);
			this.dragSession = null;
		}

		try {
			document.addEventListener('dragover', this.handleGlobalDragOver, true);
			document.addEventListener('drop', this.handleGlobalDrop, true);
			document.addEventListener('dragend', this.handleGlobalDragEnd, true);
			document.addEventListener('keydown', this.handleGlobalKeydown, true);
			document.addEventListener('visibilitychange', this.handleGlobalVisibilityChange, true);
			window.addEventListener('blur', this.handleGlobalWindowBlur, true);
			window.addEventListener('drop', this.handleGlobalDrop, true);
			window.addEventListener('dragend', this.handleGlobalDragEnd, true);
		} catch {
			this.removeSessionListeners({ document, window });
			this.dragSession = null;
			return false;
		}

		this.dragSession = { document, window };
		return true;
	}

	private removeSessionListeners(session: FormatVariableDragSession) {
		session.document.removeEventListener('dragover', this.handleGlobalDragOver, true);
		session.document.removeEventListener('drop', this.handleGlobalDrop, true);
		session.document.removeEventListener('dragend', this.handleGlobalDragEnd, true);
		session.document.removeEventListener('keydown', this.handleGlobalKeydown, true);
		session.document.removeEventListener(
			'visibilitychange',
			this.handleGlobalVisibilityChange,
			true
		);
		session.window.removeEventListener('blur', this.handleGlobalWindowBlur, true);
		session.window.removeEventListener('drop', this.handleGlobalDrop, true);
		session.window.removeEventListener('dragend', this.handleGlobalDragEnd, true);
	}

	private getEventDocument(event: DragEvent) {
		const target = event.currentTarget ?? event.target;

		if (target instanceof Node) {
			return target.ownerDocument;
		}

		return globalThis.document ?? null;
	}

	private handleGlobalDragOver = (event: DragEvent) => {
		const drag = this.drag;

		if (!drag) {
			return;
		}

		const action = this.resolveDropAction(drag, {
			x: event.clientX,
			y: event.clientY
		});

		if (!action) {
			return;
		}

		event.preventDefault();

		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = action.effect;
		}
	};

	private handleGlobalDrop = (event: DragEvent) => {
		const drag = this.drag;

		if (!drag) {
			return;
		}

		try {
			event.preventDefault();

			const action = this.resolveDropAction(drag, {
				x: event.clientX,
				y: event.clientY
			});

			if (!action) {
				return;
			}

			action.commit();
		} finally {
			this.endDrag();
		}
	};

	private handleGlobalDragEnd = () => {
		this.endDrag();
	};

	private handleGlobalKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			this.endDrag();
		}
	};

	private handleGlobalVisibilityChange = () => {
		if (this.dragSession?.document.visibilityState === 'hidden') {
			this.endDrag();
		}
	};

	private handleGlobalWindowBlur = () => {
		this.endDrag();
	};

	private resolveDropAction(drag: FormatVariableDrag, point: FormatVariableDropPoint) {
		for (const region of this.regions.values()) {
			const action = region.resolveDrop(drag, point);

			if (action) {
				return action;
			}
		}

		return null;
	}

	private removeDragImageAfterStart(dragImage: HTMLElement) {
		requestAnimationFrame(() => {
			dragImage.remove();
		});
	}
}
