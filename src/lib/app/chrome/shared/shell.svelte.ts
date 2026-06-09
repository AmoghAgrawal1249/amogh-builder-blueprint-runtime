import { getContext, setContext } from 'svelte';

const SHELL_STATE_KEY = Symbol('chrome-shell-state');

export type ChromeShellState = {
	isSidebarExpanded: boolean;
	isMobileDrawerOpen: boolean;
	toggleSidebar: () => void;
};

export function provideChromeShellState(shellState: ChromeShellState) {
	return setContext(SHELL_STATE_KEY, shellState);
}

export function useChromeShellState() {
	const shellState = getContext<ChromeShellState | undefined>(SHELL_STATE_KEY);

	if (!shellState) {
		throw new Error('Chrome shell state was used outside the dashboard shell provider.');
	}

	return shellState;
}
