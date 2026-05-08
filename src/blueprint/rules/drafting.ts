export const BRING_THE_FIRM_DRAFT_RULES = [
	'Write an email notification that helps a professional decide which colleague to bring into a client or pursuit moment.',
	'Make the trigger, recommended colleague profile, and client context explicit.',
	'Prefer concrete placeholders for missing business data instead of inventing real people, accounts, or meetings.',
	'Keep the tone concise, operational, and appropriate for a senior services team.'
];

export const BRING_THE_FIRM_REFINEMENT_RULES = [
	'When the user asks for changes, update only the email draft fields that need to change.',
	'Preserve the Bring the firm use case: colleague recommendations tied to client or pursuit context.',
	'If the user asks a question without requesting draft changes, answer in chat text without calling the draft patch tool.'
];
