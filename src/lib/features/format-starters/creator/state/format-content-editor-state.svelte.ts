import {
	cloneFormatAttachment,
	cloneFormatBody,
	formatRecipientList,
	normalizeFormatEmailContent,
	parseFormatRecipients,
	updateFormatEmailContentField,
	type FormatEmailContent
} from '$lib/features/format-starters/domain';

type EmailContentFieldUpdateOptions = {
	notify?: boolean;
};

type FormatContentEditorStateOptions = {
	onEmailContentChange?: () => void;
};

export class FormatContentEditorState {
	private emailContentState: { activeEmailContent: FormatEmailContent };
	private onEmailContentChange: (() => void) | null;
	private recipientsUi = $state({
		toInputText: '',
		ccInputText: '',
		isEditingTo: false,
		isEditingCc: false
	});
	private attachmentUi = $state({
		inputText: '',
		isOpen: false
	});

	constructor(content: FormatEmailContent, options: FormatContentEditorStateOptions = {}) {
		this.onEmailContentChange = options.onEmailContentChange ?? null;
		this.emailContentState = $state({
			activeEmailContent: normalizeFormatEmailContent(content)
		});
		this.syncRecipientInputs();
	}

	get activeEmailContent() {
		return this.emailContentState.activeEmailContent;
	}

	get toInputText() {
		return this.recipientsUi.toInputText;
	}

	set toInputText(value: string) {
		this.recipientsUi.toInputText = value;
	}

	get ccInputText() {
		return this.recipientsUi.ccInputText;
	}

	set ccInputText(value: string) {
		this.recipientsUi.ccInputText = value;
	}

	get isEditingTo() {
		return this.recipientsUi.isEditingTo;
	}

	set isEditingTo(value: boolean) {
		this.recipientsUi.isEditingTo = value;
	}

	get isEditingCc() {
		return this.recipientsUi.isEditingCc;
	}

	set isEditingCc(value: boolean) {
		this.recipientsUi.isEditingCc = value;
	}

	get attachmentInputText() {
		return this.attachmentUi.inputText;
	}

	get isAttachmentOpen() {
		return this.attachmentUi.isOpen;
	}

	setEmailContentChangeHandler = (onEmailContentChange: (() => void) | null) => {
		this.onEmailContentChange = onEmailContentChange;
	};

	replaceEmailContent = (nextContent: FormatEmailContent) => {
		this.emailContentState.activeEmailContent = normalizeFormatEmailContent(nextContent);
		this.syncRecipientInputs();
	};

	setEmailContentField = <Key extends keyof FormatEmailContent>(
		field: Key,
		value: FormatEmailContent[Key],
		{ notify = true }: EmailContentFieldUpdateOptions = {}
	) => {
		this.replaceEmailContent(updateFormatEmailContentField(this.activeEmailContent, field, value));
		if (notify && field !== 'title') {
			this.onEmailContentChange?.();
		}
	};

	updateTitle = (nextTitle: string, options: EmailContentFieldUpdateOptions = {}) => {
		this.setEmailContentField('title', nextTitle, options);
	};

	setRecipientInput = (field: 'to' | 'cc', value: string) => {
		if (field === 'to') {
			this.recipientsUi.toInputText = value;
		} else {
			this.recipientsUi.ccInputText = value;
		}

		this.setEmailContentField(field, parseFormatRecipients(value));
	};

	commitRecipientInput = (field: 'to' | 'cc', value: string) => {
		const recipients = parseFormatRecipients(value);

		this.setEmailContentField(field, recipients);

		if (field === 'to') {
			this.recipientsUi.isEditingTo = false;
			this.recipientsUi.toInputText = formatRecipientList(recipients);
		} else {
			this.recipientsUi.isEditingCc = false;
			this.recipientsUi.ccInputText = formatRecipientList(recipients);
		}
	};

	setAttachmentOpen = (isOpen: boolean) => {
		this.attachmentUi.isOpen = isOpen;
	};

	openAttachment = () => {
		this.setAttachmentOpen(true);
	};

	closeAttachment = () => {
		this.setAttachmentOpen(false);
	};

	updateAttachmentInput = (value: string) => {
		this.attachmentUi.inputText = value;
	};

	addAttachment = (attachment: NonNullable<FormatEmailContent['attachment']>) => {
		this.attachmentUi.inputText = '';
		this.setEmailContentField('attachment', cloneFormatAttachment(attachment));
	};

	removeAttachment = (confirmDelete: (filename: string) => boolean) => {
		if (
			!this.activeEmailContent.attachment ||
			!confirmDelete(this.activeEmailContent.attachment.filename)
		) {
			return false;
		}

		this.setEmailContentField('attachment', null);
		this.attachmentUi.isOpen = false;
		return true;
	};

	setOpenAttachment = (attachment: NonNullable<FormatEmailContent['attachment']>) => {
		this.setEmailContentField('attachment', cloneFormatAttachment(attachment));
	};

	updateBody = (body: FormatEmailContent['body']) => {
		this.setEmailContentField('body', cloneFormatBody(body));
	};

	private syncRecipientInputs() {
		if (!this.recipientsUi.isEditingTo) {
			this.recipientsUi.toInputText = formatRecipientList(this.activeEmailContent.to);
		}

		if (!this.recipientsUi.isEditingCc) {
			this.recipientsUi.ccInputText = formatRecipientList(this.activeEmailContent.cc);
		}
	}
}
