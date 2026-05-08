import type { EmailDraft, EmailDraftPatch } from './email.js';
import type { EmailBuilderEventContext, TranscriptMessage } from './streams.js';

export type { BuilderAppManifest } from './catalog.js';

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
