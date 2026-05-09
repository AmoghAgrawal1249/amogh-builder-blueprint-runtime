import type {
	BuilderAppContinueTurnInput,
	BuilderAppOutputEvent,
	BuilderAppStartTurnInput
} from '@overbase/builder-sdk/app-protocol';
import {
	applyBuilderHostEvents,
	createInitialBuilderHostState,
	type BuilderAppRuntime,
	type BuilderHostState
} from '@overbase/builder-sdk/host';

type EmitEvent = (event: BuilderAppOutputEvent) => Promise<void> | void;

async function emitEvents(events: BuilderAppOutputEvent[], emit?: EmitEvent) {
	for (const event of events) {
		await emit?.(event);
	}
}

export type LocalBuilderHostStartInput = Omit<BuilderAppStartTurnInput, 'handlers'>;
export type LocalBuilderHostContinueInput = Omit<BuilderAppContinueTurnInput, 'handlers'>;

export function createLocalBuilderHost(runtime: BuilderAppRuntime) {
	async function start(input: LocalBuilderHostStartInput, emit?: EmitEvent) {
		let hostState: BuilderHostState = createInitialBuilderHostState(input.appState);
		const startEvents = await runtime.startTurn(
			{
				...input,
				handlers: {}
			},
			emit
		);
		const startReduction = applyBuilderHostEvents(hostState, startEvents);
		hostState = startReduction.state;
		await emitEvents(startEvents, emit);

		if (!startReduction.effects.enqueueBackgroundJob) {
			return [];
		}

		if (!runtime.backgroundJob) {
			throw new Error('This app does not support background jobs.');
		}

		const backgroundEvents = await runtime.backgroundJob({
			initialMessage: input.initialMessage,
			appState: hostState.appState
		});

		return backgroundEvents;
	}

	async function continueTurn(input: LocalBuilderHostContinueInput, emit?: EmitEvent) {
		return await runtime.continueTurn(
			{
				...input,
				handlers: {}
			},
			emit
		);
	}

	return {
		start,
		continueTurn
	};
}
