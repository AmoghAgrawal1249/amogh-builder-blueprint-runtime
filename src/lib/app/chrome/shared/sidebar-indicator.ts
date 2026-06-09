import type { Action } from 'svelte/action';

export type SidebarIndicatorOptions = {
	targetKey: string | null;
	enabled: boolean;
};

function findIndicatorTarget(node: HTMLElement, targetKey: string | null) {
	if (!targetKey) {
		return null;
	}

	for (const element of node.querySelectorAll<HTMLElement>('[data-sidebar-indicator-key]')) {
		if (element.dataset.sidebarIndicatorKey === targetKey) {
			return element;
		}
	}

	return null;
}

export const sidebarIndicator: Action<HTMLElement, SidebarIndicatorOptions> = (
	node,
	initialOptions
) => {
	let options = initialOptions;
	let targetElement: HTMLElement | null = null;
	let observedTargetElement: HTMLElement | null = null;
	let frame = 0;

	const resizeObserver = new ResizeObserver(() => {
		scheduleMeasure();
	});

	function hide() {
		node.style.setProperty('--sidebar-nav-indicator-opacity', '0');
	}

	function setObservedTargetElement(nextTargetElement: HTMLElement | null) {
		if (observedTargetElement === nextTargetElement) {
			return;
		}

		if (observedTargetElement) {
			resizeObserver.unobserve(observedTargetElement);
		}

		observedTargetElement = nextTargetElement;

		if (observedTargetElement) {
			resizeObserver.observe(observedTargetElement);
		}
	}

	function refreshTargetElement() {
		targetElement = options.enabled ? findIndicatorTarget(node, options.targetKey) : null;
		setObservedTargetElement(targetElement);
	}

	function measure() {
		if (
			targetElement &&
			(!node.contains(targetElement) || targetElement.dataset.sidebarIndicatorKey !== options.targetKey)
		) {
			refreshTargetElement();
		}

		if (!targetElement) {
			hide();
			return;
		}

		const navRect = node.getBoundingClientRect();
		const targetRect = targetElement.getBoundingClientRect();

		node.style.setProperty('--sidebar-nav-indicator-x', `${targetRect.left - navRect.left}px`);
		node.style.setProperty('--sidebar-nav-indicator-y', `${targetRect.top - navRect.top}px`);
		node.style.setProperty('--sidebar-nav-indicator-width', `${targetRect.width}px`);
		node.style.setProperty('--sidebar-nav-indicator-height', `${targetRect.height}px`);
		node.style.setProperty('--sidebar-nav-indicator-opacity', '1');
	}

	function scheduleMeasure() {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => {
			measure();
		});
	}

	resizeObserver.observe(node);
	refreshTargetElement();
	scheduleMeasure();

	return {
		update(nextOptions) {
			options = nextOptions;
			refreshTargetElement();
			scheduleMeasure();
		},
		destroy() {
			cancelAnimationFrame(frame);
			setObservedTargetElement(null);
			resizeObserver.disconnect();
			hide();
		}
	};
};
