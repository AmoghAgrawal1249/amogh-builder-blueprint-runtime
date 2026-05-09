import type { GuideAnswersByQuestionId } from '$blueprint';

export const DEFAULT_GUIDE_ANSWERS = {
	'existing-program': "Yes and it's only somewhat successful",
	'expertise-signal': 'Someone who knows the account personally',
	'delivery-channel':
		'Include client context, recent meeting notes, and signals that explain why the colleague is relevant.'
} satisfies GuideAnswersByQuestionId;
