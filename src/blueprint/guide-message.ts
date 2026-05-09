import type { GuideDefinition, GuideQuestion } from './types';

export type GuideAnswersByQuestionId = Record<string, string>;

export type BuildGuidedInitialMessageParams = {
	title: string;
	description: string;
	guide: GuideDefinition;
	answersByQuestionId: GuideAnswersByQuestionId;
};

function getAnswerText(question: GuideQuestion, answersByQuestionId: GuideAnswersByQuestionId) {
	const answer = answersByQuestionId[question.id]?.trim();

	return answer || 'Not specified';
}

export function buildGuidedInitialMessage({
	title,
	description,
	guide,
	answersByQuestionId
}: BuildGuidedInitialMessageParams) {
	const answers = guide.questions.map((question) => {
		return `${question.title}\n${getAnswerText(question, answersByQuestionId)}`;
	});

	return [
		`I want to build this notification: ${title}`,
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
