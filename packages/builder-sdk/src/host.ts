import type {
	BuilderAppBackgroundJobInput,
	BuilderAppContinueTurnInput,
	BuilderAppOutputEvent,
	BuilderAppStartTurnInput,
	BuilderAppState
} from './app-protocol.js';
import type { BuilderAppManifest } from './catalog.js';
import {
	applyEmailDraftPatch,
	hasEmailDraftChanged,
	hasEmailDraftPatchFields,
	normalizeEmailDraft,
	type EmailDraftState
} from './email.js';

export type BuilderAppRuntime = {
	manifest: BuilderAppManifest;
	startTurn: (
		input: BuilderAppStartTurnInput,
		emit?: (event: BuilderAppOutputEvent) => Promise<void> | void
	) => Promise<BuilderAppOutputEvent[]>;
	continueTurn: (
		input: BuilderAppContinueTurnInput,
		emit?: (event: BuilderAppOutputEvent) => Promise<void> | void
	) => Promise<BuilderAppOutputEvent[]>;
	backgroundJob?: (input: BuilderAppBackgroundJobInput) => Promise<BuilderAppOutputEvent[]>;
};

export type BuilderHostState = {
	appState: BuilderAppState;
	emailDraftState: EmailDraftState | null;
};

export type BuilderHostEffects = {
	assistantCompleteText: string | null;
	enqueueBackgroundJob: boolean;
	waitForUser: boolean;
	complete: boolean;
	errorText: string | null;
};

export type BuilderHostReduction = {
	state: BuilderHostState;
	effects: BuilderHostEffects;
};

export const BUILDER_HOST_APP_STATE_VERSION = 1;

export function createInitialBuilderHostState(
	appState: BuilderAppState = { version: BUILDER_HOST_APP_STATE_VERSION, value: {} }
): BuilderHostState {
	return {
		appState,
		emailDraftState: null
	};
}

export function createEmptyBuilderHostEffects(): BuilderHostEffects {
	return {
		assistantCompleteText: null,
		enqueueBackgroundJob: false,
		waitForUser: false,
		complete: false,
		errorText: null
	};
}

function getAppStateRecord(appState: BuilderAppState): Record<string, unknown> {
	return appState.value && typeof appState.value === 'object' && !Array.isArray(appState.value)
		? (appState.value as Record<string, unknown>)
		: {};
}

export function patchBuilderHostAppState(
	appState: BuilderAppState,
	patch: Record<string, unknown>
): BuilderAppState {
	return {
		version: appState.version + 1,
		value: {
			...getAppStateRecord(appState),
			...patch
		}
	};
}

export function applyBuilderHostEvent(
	state: BuilderHostState,
	event: BuilderAppOutputEvent
): BuilderHostReduction {
	let nextState = state;
	const effects = createEmptyBuilderHostEffects();

	if (event.type === 'assistantComplete') {
		effects.assistantCompleteText = event.text;
		return { state: nextState, effects };
	}

	if (event.type === 'appStateReplace') {
		nextState = {
			...nextState,
			appState: event.appState
		};
		return { state: nextState, effects };
	}

	if (event.type === 'appStatePatch') {
		nextState = {
			...nextState,
			appState: patchBuilderHostAppState(nextState.appState, event.patch)
		};
		return { state: nextState, effects };
	}

	if (event.type === 'emailDraftSet') {
		const emailDraft = normalizeEmailDraft(event.emailDraft);

		nextState = {
			...nextState,
			emailDraftState: {
				version: (nextState.emailDraftState?.version ?? 0) + 1,
				visibility: event.visibility,
				draft: emailDraft
			}
		};
		return { state: nextState, effects };
	}

	if (event.type === 'emailDraftPatch') {
		if (
			!nextState.emailDraftState ||
			nextState.emailDraftState.visibility !== 'visible' ||
			!hasEmailDraftPatchFields(event.patch)
		) {
			return { state: nextState, effects };
		}

		const emailDraft = applyEmailDraftPatch(nextState.emailDraftState.draft, event.patch);

		if (!hasEmailDraftChanged(nextState.emailDraftState.draft, emailDraft)) {
			return { state: nextState, effects };
		}

		nextState = {
			...nextState,
			emailDraftState: {
				version: nextState.emailDraftState.version + 1,
				visibility: 'visible',
				draft: emailDraft
			}
		};
		return { state: nextState, effects };
	}

	if (event.type === 'enqueueBackgroundJob') {
		effects.enqueueBackgroundJob = true;
		return { state: nextState, effects };
	}

	if (event.type === 'waitForUser') {
		effects.waitForUser = true;
		return { state: nextState, effects };
	}

	if (event.type === 'complete') {
		effects.complete = true;
		return { state: nextState, effects };
	}

	if (event.type === 'fail') {
		effects.errorText = event.errorText;
		return { state: nextState, effects };
	}

	return { state: nextState, effects };
}

export function applyBuilderHostEvents(
	state: BuilderHostState,
	events: BuilderAppOutputEvent[]
): BuilderHostReduction {
	let nextState = state;
	const effects = createEmptyBuilderHostEffects();

	for (const event of events) {
		const reduction = applyBuilderHostEvent(nextState, event);
		nextState = reduction.state;
		effects.assistantCompleteText =
			reduction.effects.assistantCompleteText ?? effects.assistantCompleteText;
		effects.enqueueBackgroundJob =
			effects.enqueueBackgroundJob || reduction.effects.enqueueBackgroundJob;
		effects.waitForUser = effects.waitForUser || reduction.effects.waitForUser;
		effects.complete = effects.complete || reduction.effects.complete;
		effects.errorText = reduction.effects.errorText ?? effects.errorText;
	}

	return {
		state: nextState,
		effects
	};
}
