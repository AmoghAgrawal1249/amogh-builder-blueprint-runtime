import type { FormatVariableDefinition } from '$lib/features/format-starters/domain';
import type { FormatVariableDragCoordinator } from '$lib/features/format-starters/creator/variables/format-variable-drag-coordinator.svelte';
import type {
	EmailFormatContentEditPolicy,
	EmailFormatInlineTextContent,
	EmailFormatRulesEditPolicy
} from '$domain/email-formats';
import type { EmailFormatConfigureState } from './email-format-configure-state.svelte';
import type { EmailFormatConfigureLoadState } from './email-format-configure-types';

export type EmailFormatConfigureSharedProps = {
	actionError: string | null;
	activationBlockerMessage: string | null;
	activationReadyMessage: string | null;
	activationSuccessMessage: string | null;
	isUpdatingStatus: boolean;
	contentError: string | null;
	contentEditPolicy: EmailFormatContentEditPolicy | null;
	contentVariables: readonly FormatVariableDefinition[];
	configureState: EmailFormatConfigureState;
	dragCoordinator: FormatVariableDragCoordinator;
	loadState: EmailFormatConfigureLoadState;
	ruleInfoCard: {
		label: string;
		content: EmailFormatInlineTextContent;
	} | null;
	rulesEditPolicy: EmailFormatRulesEditPolicy | null;
	onKeepMineContent: () => void | Promise<void>;
	onKeepMineRules: () => void | Promise<void>;
	onKeepMineTitle: () => void | Promise<void>;
	onSaveContent: () => Promise<void>;
	onSaveRules: () => void | Promise<void>;
	onActivateFormat: () => void | Promise<void>;
	onUseLatestContent: () => void;
	onUseLatestRules: () => void;
	onUseLatestTitle: () => void;
};
