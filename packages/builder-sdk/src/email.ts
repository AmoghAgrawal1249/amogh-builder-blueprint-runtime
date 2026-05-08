export const EMAIL_DRAFT_CHANGED_FIELDS = ['to', 'cc', 'attachments', 'body', 'fireReason'] as const;

export const EMAIL_DRAFT_LIMITS = {
	recipient: 140,
	recipients: 12,
	attachment: 160,
	attachments: 12,
	bodyBlocks: 12,
	bodyText: 1_000,
	bulletItems: 8,
	linkLabel: 120,
	linkHref: 500,
	fireReason: 600
} as const;

export type EmailDraftChangedField = (typeof EMAIL_DRAFT_CHANGED_FIELDS)[number];

export type EmailParagraphBlock = {
	type: 'paragraph';
	text: string;
};

export type EmailBulletsBlock = {
	type: 'bullets';
	items: string[];
};

export type EmailLinkBlock = {
	type: 'link';
	label: string;
	href: string;
};

export type EmailBodyBlock = EmailParagraphBlock | EmailBulletsBlock | EmailLinkBlock;

export type EmailDraft = {
	to: string[];
	cc: string[];
	attachments: string[];
	body: EmailBodyBlock[];
	fireReason: string;
};

export type EmailDraftPatchOperation =
	| {
			type: 'setTo';
			to: string[];
	  }
	| {
			type: 'setCc';
			cc: string[];
	  }
	| {
			type: 'setAttachments';
			attachments: string[];
	  }
	| {
			type: 'setBody';
			body: EmailBodyBlock[];
	  }
	| {
			type: 'setFireReason';
			fireReason: string;
	  };

export type EmailDraftPatch = {
	operations: EmailDraftPatchOperation[];
};

export function createDefaultEmailDraft(): EmailDraft {
	return {
		to: [],
		cc: [],
		attachments: [],
		body: [],
		fireReason: ''
	};
}

function clampText(value: string, maxLength: number) {
	const normalized = value.trim().replace(/\s+/g, ' ');

	return normalized.length > maxLength ? normalized.slice(0, maxLength).trim() : normalized;
}

function clampMultilineText(value: string, maxLength: number) {
	const normalized = value.trim();

	return normalized.length > maxLength ? normalized.slice(0, maxLength).trim() : normalized;
}

function normalizeRecipients(recipients: string[]) {
	const normalizedRecipients = recipients
		.slice(0, EMAIL_DRAFT_LIMITS.recipients)
		.map((recipient) => clampText(recipient, EMAIL_DRAFT_LIMITS.recipient))
		.filter(Boolean);

	return Array.from(new Set(normalizedRecipients));
}

export function normalizePdfAttachmentName(value: string) {
	const filename = value.trim().split(/[\\/]/).pop() ?? '';
	const withoutQueryOrHash = filename.split(/[?#]/)[0] ?? '';
	const sanitizedBaseName = withoutQueryOrHash
		.replace(/\.[a-z0-9]+$/i, '')
		.replace(/[^a-zA-Z0-9 ._()-]+/g, '_')
		.replace(/\s+/g, ' ')
		.replace(/\.+$/g, '')
		.trim();
	const normalized = clampText(sanitizedBaseName, EMAIL_DRAFT_LIMITS.attachment);

	return normalized ? `${normalized}.pdf` : '';
}

function normalizeAttachments(attachments: string[]) {
	const normalizedAttachments = attachments
		.slice(0, EMAIL_DRAFT_LIMITS.attachments)
		.map(normalizePdfAttachmentName)
		.filter(Boolean);

	return Array.from(new Set(normalizedAttachments));
}

export function normalizeEmailBodyBlock(block: EmailBodyBlock): EmailBodyBlock | null {
	switch (block.type) {
		case 'paragraph': {
			const text = clampMultilineText(block.text, EMAIL_DRAFT_LIMITS.bodyText);

			return text ? { type: 'paragraph', text } : null;
		}
		case 'bullets': {
			const items = block.items
				.slice(0, EMAIL_DRAFT_LIMITS.bulletItems)
				.map((item) => clampMultilineText(item, EMAIL_DRAFT_LIMITS.bodyText))
				.filter(Boolean);

			return items.length > 0 ? { type: 'bullets', items } : null;
		}
		case 'link': {
			const label = clampText(block.label, EMAIL_DRAFT_LIMITS.linkLabel);
			const href = clampText(block.href, EMAIL_DRAFT_LIMITS.linkHref);

			return label && href ? { type: 'link', label, href } : null;
		}
	}
}

function normalizeEmailBody(body: EmailBodyBlock[]) {
	return body
		.slice(0, EMAIL_DRAFT_LIMITS.bodyBlocks)
		.map(normalizeEmailBodyBlock)
		.filter((block): block is EmailBodyBlock => block !== null);
}

export function normalizeEmailDraft(draft: EmailDraft): EmailDraft {
	return {
		to: normalizeRecipients(draft.to),
		cc: normalizeRecipients(draft.cc),
		attachments: normalizeAttachments(draft.attachments),
		body: normalizeEmailBody(draft.body),
		fireReason: clampMultilineText(draft.fireReason, EMAIL_DRAFT_LIMITS.fireReason)
	};
}

export function getEmailDraftChangedFields(
	before: EmailDraft,
	after: EmailDraft
): EmailDraftChangedField[] {
	const normalizedBefore = normalizeEmailDraft(before);
	const normalizedAfter = normalizeEmailDraft(after);
	const changedFields: EmailDraftChangedField[] = [];

	for (const field of EMAIL_DRAFT_CHANGED_FIELDS) {
		if (JSON.stringify(normalizedBefore[field]) !== JSON.stringify(normalizedAfter[field])) {
			changedFields.push(field);
		}
	}

	return changedFields;
}

export function hasEmailDraftChanged(before: EmailDraft, after: EmailDraft) {
	return getEmailDraftChangedFields(before, after).length > 0;
}

export function applyEmailDraftPatch(draft: EmailDraft, patch: EmailDraftPatch): EmailDraft {
	const nextDraft: EmailDraft = {
		to: [...draft.to],
		cc: [...draft.cc],
		attachments: [...draft.attachments],
		body: [...draft.body],
		fireReason: draft.fireReason
	};

	for (const operation of patch.operations) {
		switch (operation.type) {
			case 'setTo':
				nextDraft.to = operation.to;
				break;
			case 'setCc':
				nextDraft.cc = operation.cc;
				break;
			case 'setAttachments':
				nextDraft.attachments = operation.attachments;
				break;
			case 'setBody':
				nextDraft.body = operation.body;
				break;
			case 'setFireReason':
				nextDraft.fireReason = operation.fireReason;
				break;
		}
	}

	return normalizeEmailDraft(nextDraft);
}

export function summarizeEmailDraftEdit(changedFields: EmailDraftChangedField[]) {
	if (changedFields.length === 0) {
		return 'No draft fields changed.';
	}

	return `User edited ${changedFields.join(', ')}.`;
}

export const emailBodyBlockJsonSchema = {
	anyOf: [
		{
			type: 'object',
			additionalProperties: false,
			properties: {
				type: { type: 'string', enum: ['paragraph'] },
				text: {
					type: 'string',
					description: 'A concise email paragraph. Prefer one or two sentences.'
				}
			},
			required: ['type', 'text']
		},
		{
			type: 'object',
			additionalProperties: false,
			properties: {
				type: { type: 'string', enum: ['bullets'] },
				items: {
					type: 'array',
					items: {
						type: 'string',
						description: 'A concise email bullet.'
					},
					maxItems: EMAIL_DRAFT_LIMITS.bulletItems
				}
			},
			required: ['type', 'items']
		},
		{
			type: 'object',
			additionalProperties: false,
			properties: {
				type: { type: 'string', enum: ['link'] },
				label: { type: 'string' },
				href: { type: 'string' }
			},
			required: ['type', 'label', 'href']
		}
	]
} as const;

export const emailDraftJsonSchema = {
	type: 'object',
	additionalProperties: false,
	properties: {
		to: { type: 'array', items: { type: 'string' }, maxItems: EMAIL_DRAFT_LIMITS.recipients },
		cc: { type: 'array', items: { type: 'string' }, maxItems: EMAIL_DRAFT_LIMITS.recipients },
		attachments: {
			type: 'array',
			items: { type: 'string' },
			maxItems: EMAIL_DRAFT_LIMITS.attachments
		},
		body: {
			type: 'array',
			items: emailBodyBlockJsonSchema,
			maxItems: EMAIL_DRAFT_LIMITS.bodyBlocks
		},
		fireReason: {
			type: 'string',
			description: 'A short explanation of exactly why this email notification fires.'
		}
	},
	required: ['to', 'cc', 'attachments', 'body', 'fireReason']
} as const;

export const emailDraftPatchJsonSchema = {
	type: 'object',
	additionalProperties: false,
	properties: {
		operations: {
			type: 'array',
			items: {
				anyOf: [
					{
						type: 'object',
						additionalProperties: false,
						properties: {
							type: { type: 'string', enum: ['setTo'] },
							to: {
								type: 'array',
								items: { type: 'string' },
								maxItems: EMAIL_DRAFT_LIMITS.recipients
							}
						},
						required: ['type', 'to']
					},
					{
						type: 'object',
						additionalProperties: false,
						properties: {
							type: { type: 'string', enum: ['setCc'] },
							cc: {
								type: 'array',
								items: { type: 'string' },
								maxItems: EMAIL_DRAFT_LIMITS.recipients
							}
						},
						required: ['type', 'cc']
					},
					{
						type: 'object',
						additionalProperties: false,
						properties: {
							type: { type: 'string', enum: ['setAttachments'] },
							attachments: {
								type: 'array',
								items: { type: 'string' },
								maxItems: EMAIL_DRAFT_LIMITS.attachments
							}
						},
						required: ['type', 'attachments']
					},
					{
						type: 'object',
						additionalProperties: false,
						properties: {
							type: { type: 'string', enum: ['setBody'] },
							body: {
								type: 'array',
								items: emailBodyBlockJsonSchema,
								maxItems: EMAIL_DRAFT_LIMITS.bodyBlocks
							}
						},
						required: ['type', 'body']
					},
					{
						type: 'object',
						additionalProperties: false,
						properties: {
							type: { type: 'string', enum: ['setFireReason'] },
							fireReason: { type: 'string' }
						},
						required: ['type', 'fireReason']
					}
				]
			},
			minItems: 1,
			maxItems: 5
		}
	},
	required: ['operations']
} as const;
