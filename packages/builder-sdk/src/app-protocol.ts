import type { AppCatalogDefinition, GuidedEmailAppCatalogDefinition } from './catalog.js';
import type { EmailDraft, EmailDraftPatch } from './email.js';
import type {
	EmailBuilderEventContext,
	EmailBuilderTurnStreamHandlers,
	EmailBuilderTurnStreamResult,
	TranscriptMessage
} from './streams.js';

export type BuilderAppManifest = AppCatalogDefinition;

export type BuilderAppState = {
	version: number;
	value: unknown;
};

export type BuilderAppTurnHandlers = {
	onAssistantDelta?: (delta: string) => Promise<void> | void;
};

export type BuilderAppStartTurnInput = {
	initialMessage: string;
	appState?: BuilderAppState;
	handlers: BuilderAppTurnHandlers;
};

export type BuilderAppInitialDraftInput = {
	initialMessage: string;
};

export type BuilderAppInitialQuestionInput = {
	initialMessage: string;
	handlers: BuilderAppTurnHandlers;
};

export type BuilderAppInitialAnswerInput = {
	initialMessage: string;
	initialQuestion: string;
	initialAnswer: string;
	draft: EmailDraft;
};

export type InitialDraftParams = BuilderAppInitialDraftInput;
export type InitialQuestionParams = BuilderAppInitialQuestionInput;
export type InitialAnswerParams = BuilderAppInitialAnswerInput;

export type BuilderAppContinueTurnInput = {
	initialMessage: string;
	transcript: TranscriptMessage[];
	userMessage: string;
	emailDraft?: EmailDraft;
	preparedEmailDraft?: EmailDraft;
	recentEvents: EmailBuilderEventContext[];
	appState?: BuilderAppState;
	handlers: BuilderAppTurnHandlers;
};

export type BuilderAppBackgroundJobInput = {
	initialMessage: string;
	appState?: BuilderAppState;
};

export type BuilderAppRefinementInput = {
	transcript: TranscriptMessage[];
	draft: EmailDraft;
	recentEvents: EmailBuilderEventContext[];
	handlers: EmailBuilderTurnStreamHandlers;
};

export type RefinementParams = BuilderAppRefinementInput;

export type BuilderAppRuntime = {
	manifest: BuilderAppManifest;
	startTurn: (input: BuilderAppStartTurnInput) => Promise<BuilderAppOutputEvent[]>;
	continueTurn: (input: BuilderAppContinueTurnInput) => Promise<BuilderAppOutputEvent[]>;
	backgroundJob?: (input: BuilderAppBackgroundJobInput) => Promise<BuilderAppOutputEvent[]>;
};

export type EmailAppDefinition = GuidedEmailAppCatalogDefinition & {
	createInitialQuestion: (input: InitialQuestionParams) => Promise<string>;
	createInitialDraft: (input: InitialDraftParams) => Promise<EmailDraft>;
	applyInitialAnswer: (input: InitialAnswerParams) => Promise<EmailDraft>;
	streamRefinementTurn: (input: RefinementParams) => Promise<EmailBuilderTurnStreamResult>;
};

export type BuilderAppPatchResult = {
	text: string;
	patch: EmailDraftPatch | null;
	patchIntent: 'none' | 'noop' | 'meaningful';
};

export type BuilderAppOutputEvent =
	| {
			type: 'assistantDelta';
			text: string;
	  }
	| {
			type: 'assistantComplete';
			text: string;
	  }
	| {
			type: 'emailDraftReplace';
			emailDraft: EmailDraft;
			visible?: boolean;
	  }
	| {
			type: 'emailDraftPatch';
			patch: EmailDraftPatch | null;
			patchIntent: 'none' | 'noop' | 'meaningful';
	  }
	| {
			type: 'appStateReplace';
			appState: BuilderAppState;
	  }
	| {
			type: 'appStatePatch';
			patch: Record<string, unknown>;
	  }
	| {
			type: 'enqueueBackgroundJob';
	  }
	| {
			type: 'waitForUser';
	  }
	| {
			type: 'complete';
	  }
	| {
			type: 'fail';
			errorText: string;
	  };
