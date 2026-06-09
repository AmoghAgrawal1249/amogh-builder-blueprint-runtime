import type { PhosphorIcon } from '$lib/ui/icons';
import type { NonLinkInlineTextContent } from '$lib/ui/inline-text';
import type { AppHref } from '$lib/app/app-links';

export type ListIcon = PhosphorIcon;

export type ListToolbarConfig = {
	searchPlaceholder?: string;
	searchAriaLabel?: string;
	searchValue?: string;
	onSearchValueChange?: (value: string) => void;
	filters?: readonly ListFilterConfig[];
	actionLabel?: string;
	onAction?: () => void;
};

export type ListFilterConfig = {
	id: string;
	label: string;
	selectedId: string;
	width?: 'default' | 'wide';
	options: readonly ListFilterOption[];
	onSelect: (optionId: string) => void;
};

export type ListFilterOption = {
	id: string;
	label: string;
};

export type EmptyListNextStepsPart =
	| {
			kind: 'text';
			text: string;
	  }
	| {
			kind: 'link';
			text: string;
			href: AppHref;
	  };

export type EmptyListNextStepsContent = string | readonly EmptyListNextStepsPart[];

export type EmptyListStateConfig = {
	title: string;
	description: NonLinkInlineTextContent;
	nextSteps?: EmptyListNextStepsContent;
	actionLabel?: string;
	actionHelpText?: string;
	actionHelpTooltipText?: string;
	onAction?: () => void;
	icon?: ListIcon;
};

export type NoResultsListStateConfig = {
	title: string;
	description: NonLinkInlineTextContent;
};

export type ListRouteStatus = 'loading' | 'error' | 'ready';

export type ListRowItem = {
	id: string;
	href?: AppHref;
	onPreload?: () => void;
	actionsAriaLabel?: string;
	actions?: ListRowItemAction[];
};

export type ListRowItemAction = {
	label: string;
	ariaLabel?: string;
	intent?: 'default' | 'destructive';
	disabled?: boolean;
	onSelect: () => void | Promise<void>;
};

export type SelectableListItem = ListRowItem & {
	selectAriaLabel?: string;
};

export type SelectableListSelectedAction = {
	label: string;
	ariaLabel?: string;
	intent?: 'default' | 'destructive';
	disabled?: boolean | ((selectedItemIds: string[]) => boolean);
	onSelect: (selectedItemIds: string[]) => void | Promise<void>;
};
