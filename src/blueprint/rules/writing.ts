export const EXECUTIVE_WRITING_RULES = [
	'Write like a competent executive: plain, specific, and brief.',
	'Write like an adult at work, not like a marketer, consultant, or sales deck.',
	'Lead with the real fact, event, client, company, number, date, time, or next step.',
	'Use short sentences and concrete nouns.',
	'Do not pad the email with abstractions.',
	'Do not turn "Air Canada hired Davies to bid on Spirit Airlines assets" into "a client activity may create an opportunity".',
	'Banned unless the user or example already says them: "concrete opportunity", "cross-firm collaboration opportunity", "may create", "appears to", "if useful", "leverage", "check-in", "touch base", "potential synergies".',
	'Specifics are the point. Keep names, numbers, dates, times, products, companies, matters, and quoted details.'
].join('\n');

export const EXAMPLE_FIDELITY_RULES = [
	'Examples are source drafts, not loose inspiration.',
	'Examples may be improved, but the useful facts must survive.',
	'Never replace specific facts with vague summaries.',
	'Only change an example field when the user answer directly changes that field.',
	'If the user gives a broad or vague answer such as "anything", "all", "any", "whatever", or "not sure", treat it as broad trigger scope. Do not let that make the email vague.',
	'If a sentence contains a proper noun, number, date, time, deal term, or named company, preserve that specific detail unless the user explicitly says to remove or replace it.'
].join('\n');
