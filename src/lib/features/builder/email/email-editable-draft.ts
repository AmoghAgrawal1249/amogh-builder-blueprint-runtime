import {
	normalizePdfAttachmentName,
	type EmailBodyBlock,
	type EmailDraft
} from '@overbase/builder-sdk/email';

export type EditableEmailDraft = {
	toText: string;
	ccText: string;
	attachmentInputText: string;
	attachments: string[];
	bodyText: string;
	fireReasonText: string;
};

export function formatRecipients(recipients: string[]) {
	return recipients.join('; ');
}

export function toEditableEmailDraft(draft: EmailDraft): EditableEmailDraft {
	return {
		toText: formatRecipients(draft.to),
		ccText: formatRecipients(draft.cc),
		attachmentInputText: '',
		attachments: [...draft.attachments],
		bodyText: serializeEmailBodyText(draft.body),
		fireReasonText: draft.fireReason
	};
}

export function fromEditableEmailDraft(editableDraft: EditableEmailDraft): EmailDraft {
	return {
		to: parseRecipients(editableDraft.toText),
		cc: parseRecipients(editableDraft.ccText),
		attachments: editableDraft.attachments,
		body: parseEmailBodyText(editableDraft.bodyText),
		fireReason: editableDraft.fireReasonText
	};
}

export function addEditableAttachment(
	editableDraft: EditableEmailDraft,
	attachmentName: string
): EditableEmailDraft {
	const normalizedAttachmentName = normalizePdfAttachmentName(attachmentName);

	if (!normalizedAttachmentName) {
		return editableDraft;
	}

	return {
		...editableDraft,
		attachmentInputText: '',
		attachments: [...editableDraft.attachments, normalizedAttachmentName]
	};
}

export function removeEditableAttachment(
	editableDraft: EditableEmailDraft,
	attachmentIndex: number
): EditableEmailDraft {
	return {
		...editableDraft,
		attachments: editableDraft.attachments.filter((_, index) => index !== attachmentIndex)
	};
}

function parseRecipients(value: string) {
	return value
		.split(/[;,\n]/)
		.map((recipient) => recipient.trim())
		.filter(Boolean);
}

function serializeEmailBodyText(body: EmailBodyBlock[]) {
	return body
		.map((block) => {
			if (block.type === 'paragraph') {
				return block.text;
			}

			if (block.type === 'bullets') {
				return block.items.map((item) => `- ${item}`).join('\n');
			}

			return `${block.label}: ${block.href}`;
		})
		.join('\n\n');
}

function parseLinkLine(line: string): EmailBodyBlock | null {
	const labeledLinkMatch = /^(.+?):\s*((?:https?:\/\/|mailto:)\S+)$/i.exec(line);

	if (labeledLinkMatch) {
		return {
			type: 'link',
			label: labeledLinkMatch[1].trim(),
			href: labeledLinkMatch[2].trim()
		};
	}

	if (/^(https?:\/\/|mailto:)\S+$/i.test(line)) {
		return {
			type: 'link',
			label: line,
			href: line
		};
	}

	return null;
}

function parseEmailBodyText(value: string): EmailBodyBlock[] {
	const blocks: EmailBodyBlock[] = [];
	const lines = value.replace(/\r\n/g, '\n').split('\n');
	let paragraphLines: string[] = [];
	let bulletItems: string[] = [];

	function flushParagraph() {
		const text = paragraphLines.join('\n').trim();

		if (text) {
			blocks.push({ type: 'paragraph', text });
		}

		paragraphLines = [];
	}

	function flushBullets() {
		if (bulletItems.length > 0) {
			blocks.push({ type: 'bullets', items: bulletItems });
		}

		bulletItems = [];
	}

	for (const rawLine of lines) {
		const line = rawLine.trim();

		if (!line) {
			flushParagraph();
			flushBullets();
			continue;
		}

		const bulletMatch = /^[-*]\s+(.+)$/.exec(line);

		if (bulletMatch) {
			flushParagraph();
			bulletItems.push(bulletMatch[1].trim());
			continue;
		}

		flushBullets();

		const linkBlock = parseLinkLine(line);

		if (linkBlock) {
			flushParagraph();
			blocks.push(linkBlock);
			continue;
		}

		paragraphLines.push(rawLine);
	}

	flushParagraph();
	flushBullets();

	return blocks;
}
