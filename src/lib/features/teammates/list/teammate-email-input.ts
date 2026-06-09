const EMAIL_SEPARATOR_REGEX = /[,\s]+/;
const EMAIL_REGEX = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;

export type TeammateEmailInputResult = {
	emails: string[];
	error: string | null;
};

export function parseTeammateEmailInput(input: string): TeammateEmailInputResult {
	const emails = input
		.split(EMAIL_SEPARATOR_REGEX)
		.map((email) => email.trim().toLowerCase())
		.filter(Boolean);
	const uniqueEmails = [...new Set(emails)];

	if (uniqueEmails.length === 0) {
		return {
			emails: uniqueEmails,
			error: 'Add at least one email.'
		};
	}

	const invalidEmail = uniqueEmails.find((email) => !EMAIL_REGEX.test(email));

	if (invalidEmail) {
		return {
			emails: uniqueEmails,
			error: `Invalid email: ${invalidEmail}`
		};
	}

	return {
		emails: uniqueEmails,
		error: null
	};
}
