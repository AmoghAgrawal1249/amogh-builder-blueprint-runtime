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
	getEmailDraftChangedFields,
	normalizeEmailDraft,
	type EmailDraft
} from './email.js';
import type { EmailBuilderEventContext } from './streams.js';

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
	emailDraft: EmailDraft | null;
	preparedEmailDraft: EmailDraft | null;
	recentEvents: EmailBuilderEventContext[];
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

export type ApplyBuilderHostEventOptions = {
	now?: number;
};

export const BUILDER_HOST_APP_STATE_VERSION = 1;

export function createInitialBuilderHostState(
	appState: BuilderAppState = { version: BUILDER_HOST_APP_STATE_VERSION, value: {} }
): BuilderHostState {
	return {
		appState,
		emailDraft: null,
		preparedEmailDraft: null,
		recentEvents: []
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

function appendRecentEvent(
	recentEvents: EmailBuilderEventContext[],
	event: EmailBuilderEventContext
) {
	return [...recentEvents, event].slice(-5);
}

export function applyBuilderHostEvent(
	state: BuilderHostState,
	event: BuilderAppOutputEvent,
	options: ApplyBuilderHostEventOptions = {}
): BuilderHostReduction {
	let nextState = state;
	const effects = createEmptyBuilderHostEffects();
	const now = options.now ?? Date.now();

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

	if (event.type === 'emailDraftReplace') {
		const emailDraft = normalizeEmailDraft(event.emailDraft);
		const visible = event.visible !== false;

		nextState = {
			...nextState,
			preparedEmailDraft: emailDraft,
			...(visible ? { emailDraft } : {})
		};
		return { state: nextState, effects };
	}

	if (event.type === 'emailDraftPatch') {
		if (!nextState.emailDraft || !event.patch || event.patchIntent !== 'meaningful') {
			return { state: nextState, effects };
		}

		const emailDraft = applyEmailDraftPatch(nextState.emailDraft, event.patch);
		const changedFields = getEmailDraftChangedFields(nextState.emailDraft, emailDraft);

		if (changedFields.length === 0) {
			return { state: nextState, effects };
		}

		nextState = {
			...nextState,
			emailDraft,
			preparedEmailDraft: emailDraft,
			recentEvents: appendRecentEvent(nextState.recentEvents, {
				summary: 'Runtime applied email draft patch.',
				changedFields,
				createdAt: now
			})
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
	events: BuilderAppOutputEvent[],
	options: ApplyBuilderHostEventOptions = {}
): BuilderHostReduction {
	let nextState = state;
	const effects = createEmptyBuilderHostEffects();

	for (const event of events) {
		const reduction = applyBuilderHostEvent(nextState, event, options);
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
