export const TEAMMATE_EMAIL_SEPARATOR_REGEX = /[,\s]+/;
export const TEAMMATE_EMAIL_REGEX = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;

export function normalizeTeammateEmail(email: string) {
	return email.trim().toLowerCase();
}

export function normalizeTeammateName(name: string) {
	return name.trim();
}

export function getTeammateDisplayName(teammate: { email: string; name: string }) {
	return teammate.name || teammate.email;
}
