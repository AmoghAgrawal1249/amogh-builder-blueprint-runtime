import type { BuilderGuideQuestion } from '$lib/features/builder/guide/guide-types';

export type BuilderGuideChoiceAnswer = {
	type: 'choice';
	selectedOption: string;
	customAnswer: string;
};

export type BuilderGuideTextAnswer = {
	type: 'text';
	value: string;
};

export type BuilderGuideAnswer = BuilderGuideChoiceAnswer | BuilderGuideTextAnswer;
export type BuilderGuideAnswersByQuestionId = Record<string, BuilderGuideAnswer>;

export function createEmptyGuideAnswer(question: BuilderGuideQuestion): BuilderGuideAnswer {
	if (question.type === 'choice') {
		return {
			type: 'choice',
			selectedOption: '',
			customAnswer: ''
		};
	}

	return {
		type: 'text',
		value: ''
	};
}

export function getGuideAnswer(
	answersByQuestionId: BuilderGuideAnswersByQuestionId,
	question: BuilderGuideQuestion
) {
	const answer = answersByQuestionId[question.id];

	if (answer?.type === question.type) {
		return answer;
	}

	return createEmptyGuideAnswer(question);
}
