import type { EmailDraft, EmailDraftPatch, EmailDraftState } from './email.js';
import type { TranscriptMessage } from './streams.js';

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
	emailDraftState?: EmailDraftState;
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
			type: 'emailDraftSet';
			emailDraft: EmailDraft;
			visibility: EmailDraftState['visibility'];
	  }
	| {
			type: 'emailDraftPatch';
			patch: EmailDraftPatch | null;
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
