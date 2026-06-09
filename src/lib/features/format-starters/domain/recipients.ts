export function formatRecipientList(recipients: readonly string[]) {
	return recipients.join('; ');
}

export function parseFormatRecipients(value: string) {
	return value
		.split(/[;,\n]/)
		.map((recipient) => recipient.trim())
		.filter(Boolean);
}
