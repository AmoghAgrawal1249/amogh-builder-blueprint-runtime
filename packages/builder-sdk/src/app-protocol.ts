import type { EmailDraft, EmailDraftPatch, EmailDraftState } from './email.js';
import type { TranscriptMessage } from './streams.js';
import type { GuideDefinition } from './catalog.js';

export type { BuilderAppManifest } from './catalog.js';

export type BuilderAppState = {
	version: number;
	value: unknown;
};

export type BuilderGuideSetupAction = 'submitted' | 'skippedRemaining';

export type BuilderGuideSetupAnswer = {
	questionId: string;
	questionTitle: string;
	answer: string;
};

export type BuilderGuideSetup = {
	action: BuilderGuideSetupAction;
	answers: BuilderGuideSetupAnswer[];
};

export type BuilderFreeformRunSetup = {
	kind: 'freeform';
	initialMessage: string;
};

export type BuilderGuidedRunSetup = {
	kind: 'guided';
	initialMessage: string;
	guideSetup: BuilderGuideSetup;
};

export type BuilderRunSetup = BuilderFreeformRunSetup | BuilderGuidedRunSetup;

export type BuilderAppTurnHandlers = {
	onAssistantDelta?: (delta: string) => Promise<void> | void;
};

export type BuilderAppStartTurnInput = {
	setup: BuilderRunSetup;
	appState?: BuilderAppState;
	handlers: BuilderAppTurnHandlers;
};

export type BuilderAppContinueTurnInput = {
	setup: BuilderRunSetup;
	transcript: TranscriptMessage[];
	userMessage: string;
	emailDraftState?: EmailDraftState;
	appState?: BuilderAppState;
	handlers: BuilderAppTurnHandlers;
};

export type BuilderAppBackgroundJobInput = {
	setup: BuilderRunSetup;
	appState?: BuilderAppState;
};

export type CreateGuidedRunSetupInput = {
	title: string;
	description: string;
	guide: GuideDefinition;
	action: BuilderGuideSetupAction;
	answers: BuilderGuideSetupAnswer[];
};

function getGuideAnswerByQuestionId(guideSetup: BuilderGuideSetup) {
	return new Map(
		guideSetup.answers.map((answer) => [answer.questionId, answer.answer.trim()] as const)
	);
}

function getMissingGuideAnswerText(action: BuilderGuideSetupAction) {
	return action === 'skippedRemaining' ? 'Skipped' : 'Not specified';
}

function normalizeText(value: string) {
	return value.trim();
}

function normalizeGuideSetup(guideSetup: BuilderGuideSetup): BuilderGuideSetup {
	return {
		action: guideSetup.action,
		answers: guideSetup.answers
			.map((answer) => ({
				questionId: normalizeText(answer.questionId),
				questionTitle: normalizeText(answer.questionTitle),
				answer: normalizeText(answer.answer)
			}))
			.filter(
				(answer) =>
					answer.questionId.length > 0 &&
					answer.questionTitle.length > 0 &&
					answer.answer.length > 0
			)
	};
}

function buildGuidedInitialMessage({
	title,
	description,
	guide,
	guideSetup
}: {
	title: string;
	description: string;
	guide: GuideDefinition;
	guideSetup: BuilderGuideSetup;
}) {
	const answersByQuestionId = getGuideAnswerByQuestionId(guideSetup);
	const answers = guide.questions.map((question) => {
		const answer = answersByQuestionId.get(question.id);

		return `${question.title}\n${answer || getMissingGuideAnswerText(guideSetup.action)}`;
	});

	return [
		`I want to build this opportunity format: ${title}`,
		'',
		'Description:',
		description,
		'',
		'Answers:',
		...answers.flatMap((answer) => ['', answer])
	]
		.join('\n')
		.trim();
}

export function createFreeformRunSetup(message: string): BuilderFreeformRunSetup {
	return {
		kind: 'freeform',
		initialMessage: normalizeText(message)
	};
}

export function createGuidedRunSetup({
	title,
	description,
	guide,
	action,
	answers
}: CreateGuidedRunSetupInput): BuilderGuidedRunSetup {
	const guideSetup = normalizeGuideSetup({
		action,
		answers
	});

	return {
		kind: 'guided',
		initialMessage: buildGuidedInitialMessage({
			title,
			description,
			guide,
			guideSetup
		}),
		guideSetup
	};
}

export function normalizeBuilderRunSetup(setup: BuilderRunSetup): BuilderRunSetup {
	if (setup.kind === 'guided') {
		return {
			kind: 'guided',
			initialMessage: normalizeText(setup.initialMessage),
			guideSetup: normalizeGuideSetup(setup.guideSetup)
		};
	}

	return createFreeformRunSetup(setup.initialMessage);
}

export function builderRunSetupsEqual(left: BuilderRunSetup, right: BuilderRunSetup) {
	return (
		JSON.stringify(normalizeBuilderRunSetup(left)) ===
		JSON.stringify(normalizeBuilderRunSetup(right))
	);
}

export function buildBuilderRunSetupPromptText(setup: BuilderRunSetup) {
	const normalizedSetup = normalizeBuilderRunSetup(setup);

	if (normalizedSetup.kind === 'freeform') {
		return normalizedSetup.initialMessage;
	}

	const completionText =
		normalizedSetup.guideSetup.action === 'skippedRemaining'
			? 'The user skipped the remaining guided setup questions.'
			: 'The user submitted the guided setup.';

	return [
		'Structured guided setup:',
		`Action: ${normalizedSetup.guideSetup.action}`,
		completionText,
		'Answers JSON:',
		JSON.stringify(normalizedSetup.guideSetup.answers, null, 2)
	].join('\n').trim();
}

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
