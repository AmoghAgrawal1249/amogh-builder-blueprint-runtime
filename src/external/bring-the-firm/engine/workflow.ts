import {
	applyGuidedEmailInitialAnswer,
	createGuidedEmailInitialDraft,
	streamGuidedEmailInitialQuestion,
	streamGuidedEmailRefinementTurn
} from '../../shared/guided-email-workflow';
import type {
	BringTheFirmInitialAnswerParams,
	BringTheFirmInitialDraftParams,
	BringTheFirmInitialQuestionParams,
	BringTheFirmRefinementParams
} from './types';
import {
	buildBringTheFirmInitialAnswerPrompt,
	buildBringTheFirmInitialDraftPrompt,
	buildBringTheFirmInitialQuestionPrompt,
	buildBringTheFirmRefinementSystemPrompt
} from './prompts';

export async function createBringTheFirmInitialQuestion(params: BringTheFirmInitialQuestionParams) {
	return await streamGuidedEmailInitialQuestion({
		prompt: buildBringTheFirmInitialQuestionPrompt(params),
		handlers: {
			onDelta: async (delta) => {
				await params.handlers.onAssistantDelta?.(delta);
			}
		}
	});
}

export async function createBringTheFirmInitialDraft(params: BringTheFirmInitialDraftParams) {
	return await createGuidedEmailInitialDraft({
		prompt: buildBringTheFirmInitialDraftPrompt(params),
		toolName: 'bring_the_firm_create_email_draft',
		toolDescription: 'Create the Bring the firm email notification draft.'
	});
}

export async function applyBringTheFirmInitialAnswer(params: BringTheFirmInitialAnswerParams) {
	return await applyGuidedEmailInitialAnswer({
		prompt: buildBringTheFirmInitialAnswerPrompt(params),
		toolDescription: 'Return the Bring the firm email notification draft after applying the first answer.'
	});
}

export async function streamBringTheFirmRefinementTurn(params: BringTheFirmRefinementParams) {
	return await streamGuidedEmailRefinementTurn({
		systemPrompt: buildBringTheFirmRefinementSystemPrompt(),
		draft: params.draft,
		recentEvents: params.recentEvents,
		transcript: params.transcript,
		handlers: params.handlers
	});
}
