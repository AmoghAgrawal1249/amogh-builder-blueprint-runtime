import {
	cloneFormatAttachment,
	cloneFormatBody,
	type FormatEmailContent
} from '$lib/features/format-starters/domain';
import { FormatContentEditorState } from '$lib/features/format-starters/creator/state/format-content-editor-state.svelte';
import type {
	EmailFormatContent,
	EmailFormatRecipientRef,
	EmailFeedback,
	EmailFormatRule
} from './email-format-configure-types';
import { getFormatRecipientKey } from './email-format-configure-types';

type VersionedSnapshot<Value> = {
	value: Value;
	version: number;
};

type EmailFormatConfigureSnapshot = {
	emailFormat: {
		id: string;
		title: VersionedSnapshot<string>;
		emailContent: VersionedSnapshot<EmailFormatContent>;
		rules: VersionedSnapshot<EmailFormatRule[]>;
		recipientRefs: EmailFormatRecipientRef[];
		activation: {
			canActivate: boolean;
			missingRequirements: readonly string[];
			message: string | null;
		};
		updatedAt: number;
	};
	feedback: Array<{
		sentEmailId: string;
		likedText: string;
		improvementText: string;
	}>;
	feedbackUpdatedAt: number;
	sentEmails: unknown[];
};

const EMPTY_FEEDBACK: EmailFeedback = {
	likedText: '',
	improvementText: ''
};

function cloneEmailContent(content: EmailFormatContent): EmailFormatContent {
	return {
		to: [...content.to],
		cc: [...content.cc],
		attachment: cloneFormatAttachment(content.attachment),
		body: cloneFormatBody(content.body)
	};
}

function toEmailContent(content: FormatEmailContent): EmailFormatContent {
	return cloneEmailContent({
		to: content.to,
		cc: content.cc,
		attachment: content.attachment,
		body: content.body
	});
}

function toEditorContent(title: string, content: EmailFormatContent): FormatEmailContent {
	return {
		title,
		to: [...content.to],
		cc: [...content.cc],
		attachment: cloneFormatAttachment(content.attachment),
		body: cloneFormatBody(content.body)
	};
}

function cloneRules(rules: EmailFormatRule[]) {
	return rules.map((rule) => ({ ...rule }));
}

function cloneFeedback(feedback: EmailFeedback) {
	return { ...feedback };
}

function areEmailContentsEqual(firstContent: EmailFormatContent, secondContent: EmailFormatContent) {
	return JSON.stringify(firstContent) === JSON.stringify(secondContent);
}

function areRulesEqual(firstRules: EmailFormatRule[], secondRules: EmailFormatRule[]) {
	return JSON.stringify(firstRules) === JSON.stringify(secondRules);
}

function cloneRecipientRefs(refs: EmailFormatRecipientRef[]) {
	return refs.map((ref) => ({ ...ref }));
}

function areRecipientRefsEqual(
	firstRefs: EmailFormatRecipientRef[],
	secondRefs: EmailFormatRecipientRef[]
) {
	const firstKeys = firstRefs.map(getFormatRecipientKey);
	const secondKeys = secondRefs.map(getFormatRecipientKey);

	return JSON.stringify(firstKeys) === JSON.stringify(secondKeys);
}

export function areEmailFormatRulesFilled(rules: EmailFormatRule[]) {
	return rules.every((rule) => rule.text.trim().length > 0);
}

function areFeedbackEqual(
	firstFeedback: EmailFeedback,
	secondFeedback: EmailFeedback
) {
	return (
		firstFeedback.likedText === secondFeedback.likedText &&
		firstFeedback.improvementText === secondFeedback.improvementText
	);
}

class VersionedDraftSection<Value> {
	baseValue = $state<Value | null>(null);
	baseVersion = $state(0);
	draftValue = $state<Value | null>(null);
	dirty = $state(false);
	saving = $state(false);
	pendingRemoteValue = $state<Value | null>(null);
	pendingRemoteVersion = $state<number | null>(null);
	conflict = $state(false);

	constructor(
		private readonly clone: (value: Value) => Value,
		private readonly equals: (first: Value, second: Value) => boolean
	) {}

	reset() {
		this.baseValue = null;
		this.baseVersion = 0;
		this.draftValue = null;
		this.dirty = false;
		this.saving = false;
		this.pendingRemoteValue = null;
		this.pendingRemoteVersion = null;
		this.conflict = false;
	}

	sync(snapshot: VersionedSnapshot<Value>) {
		const remoteValue = this.clone(snapshot.value);

		if (
			this.baseValue === null ||
			!this.dirty ||
			(this.draftValue !== null && this.equals(remoteValue, this.draftValue))
		) {
			this.acceptRemote(snapshot);
			return;
		}

		if (snapshot.version > this.baseVersion) {
			this.pendingRemoteValue = remoteValue;
			this.pendingRemoteVersion = snapshot.version;
			this.conflict = true;
		}
	}

	updateDraft(value: Value, { forceDirty = false } = {}) {
		const draftValue = this.clone(value);
		this.draftValue = draftValue;
		this.dirty =
			forceDirty || this.baseValue === null || !this.equals(draftValue, this.baseValue);

		if (this.dirty && this.pendingRemoteVersion !== null && this.pendingRemoteVersion > this.baseVersion) {
			this.conflict = true;
		}
	}

	markSaved(snapshot: VersionedSnapshot<Value>) {
		this.acceptRemote(snapshot);
	}

	useLatest() {
		if (this.pendingRemoteValue === null || this.pendingRemoteVersion === null) {
			return;
		}

		this.acceptRemote({
			value: this.pendingRemoteValue,
			version: this.pendingRemoteVersion
		});
	}

	getSaveVersion({ overwriteConflict = false } = {}) {
		if (overwriteConflict && this.conflict && this.pendingRemoteVersion !== null) {
			return this.pendingRemoteVersion;
		}

		return this.baseVersion;
	}

	private acceptRemote(snapshot: VersionedSnapshot<Value>) {
		const nextValue = this.clone(snapshot.value);

		if (
			this.baseValue !== null &&
			this.draftValue !== null &&
			this.baseVersion === snapshot.version &&
			this.equals(this.baseValue, nextValue) &&
			this.equals(this.draftValue, nextValue) &&
			!this.dirty &&
			this.pendingRemoteValue === null &&
			this.pendingRemoteVersion === null &&
			!this.conflict
		) {
			return;
		}

		this.baseValue = nextValue;
		this.baseVersion = snapshot.version;
		this.draftValue = this.clone(nextValue);
		this.dirty = false;
		this.pendingRemoteValue = null;
		this.pendingRemoteVersion = null;
		this.conflict = false;
	}
}

export function createEmailFormatConfigureState() {
	let syncedEmailFormatId = $state<string | null>(null);
	let syncedRecipientsUpdatedAt = $state(0);
	let syncedFeedbackUpdatedAt = $state(-1);
	let contentEditor = $state<FormatContentEditorState | null>(null);
	const titleSection = new VersionedDraftSection<string>((value) => value, (first, second) => first === second);
	const emailContentSection = new VersionedDraftSection<EmailFormatContent>(
		cloneEmailContent,
		areEmailContentsEqual
	);
	const rulesSection = new VersionedDraftSection<EmailFormatRule[]>(cloneRules, areRulesEqual);
	let selectedRecipientRefs = $state<EmailFormatRecipientRef[]>([]);
	let savedRecipientRefs = $state<EmailFormatRecipientRef[]>([]);
	let selectedSentEmailIndex = $state(0);
	let feedbackDraftsBySentEmailId = $state<Record<string, EmailFeedback>>({});
	let savedFeedbackBySentEmailId = $state<Record<string, EmailFeedback>>({});

	function getTitleDraft() {
		return titleSection.draftValue ?? '';
	}

	function getEmailContentDraft() {
		return emailContentSection.draftValue
			? cloneEmailContent(emailContentSection.draftValue)
			: null;
	}

	function getContentDraft() {
		const emailContent = getEmailContentDraft();

		return emailContent ? toEditorContent(getTitleDraft(), emailContent) : null;
	}

	function updateEmailContentDraftFromEditor() {
		if (contentEditor) {
			emailContentSection.updateDraft(toEmailContent(contentEditor.activeEmailContent));
		}
	}

	function canSaveContent() {
		return emailContentSection.dirty && !emailContentSection.conflict;
	}

	function canSaveRules() {
		return (
			rulesSection.dirty &&
			!rulesSection.conflict &&
			areEmailFormatRulesFilled(rulesSection.draftValue ?? [])
		);
	}

	function hasRecipientChanges() {
		return !areRecipientRefsEqual(selectedRecipientRefs, savedRecipientRefs);
	}

	function replaceEditorContent(nextContent: FormatEmailContent) {
		if (contentEditor) {
			contentEditor.setEmailContentChangeHandler(updateEmailContentDraftFromEditor);
			contentEditor.replaceEmailContent(nextContent);
		} else {
			contentEditor = new FormatContentEditorState(nextContent, {
				onEmailContentChange: updateEmailContentDraftFromEditor
			});
		}
	}

	function syncEditorFromSections() {
		const nextContent = getContentDraft();

		if (!nextContent) {
			return;
		}

		if (!contentEditor || !emailContentSection.dirty) {
			replaceEditorContent(nextContent);
			return;
		}

		contentEditor.updateTitle(nextContent.title, { notify: false });
	}

	function sync(
		emailFormatId: string,
		configure: EmailFormatConfigureSnapshot,
		{ syncRecipients = true } = {}
	) {
		if (syncedEmailFormatId !== emailFormatId) {
			syncedEmailFormatId = emailFormatId;
			syncedRecipientsUpdatedAt = 0;
			syncedFeedbackUpdatedAt = -1;
			selectedSentEmailIndex = 0;
			contentEditor = null;
			titleSection.reset();
			emailContentSection.reset();
			rulesSection.reset();
		}

		titleSection.sync(configure.emailFormat.title);
		emailContentSection.sync(configure.emailFormat.emailContent);
		rulesSection.sync(configure.emailFormat.rules);
		syncEditorFromSections();

		if (
			syncRecipients &&
			configure.emailFormat.updatedAt > syncedRecipientsUpdatedAt &&
			!hasRecipientChanges()
		) {
			selectedRecipientRefs = cloneRecipientRefs(configure.emailFormat.recipientRefs);
			savedRecipientRefs = cloneRecipientRefs(configure.emailFormat.recipientRefs);
			syncedRecipientsUpdatedAt = configure.emailFormat.updatedAt;
		}

		if (configure.feedbackUpdatedAt !== syncedFeedbackUpdatedAt) {
			const nextFeedback = Object.fromEntries(
				configure.feedback.map((feedback) => [
					feedback.sentEmailId,
					{
						likedText: feedback.likedText,
						improvementText: feedback.improvementText
					}
				])
			);
			feedbackDraftsBySentEmailId = nextFeedback;
			savedFeedbackBySentEmailId = nextFeedback;
			syncedFeedbackUpdatedAt = configure.feedbackUpdatedAt;
		}

		if (selectedSentEmailIndex >= configure.sentEmails.length) {
			selectedSentEmailIndex = Math.max(0, configure.sentEmails.length - 1);
		}
	}

	function updateTitleDraft(nextTitle: string) {
		titleSection.updateDraft(nextTitle, { forceDirty: true });
		contentEditor?.updateTitle(nextTitle, { notify: false });
	}

	function markTitleSaved(nextTitle: VersionedSnapshot<string>) {
		titleSection.markSaved(nextTitle);
		contentEditor?.updateTitle(nextTitle.value, { notify: false });
	}

	function syncTitleRemote(nextTitle: VersionedSnapshot<string>) {
		titleSection.sync(nextTitle);
		contentEditor?.updateTitle(getTitleDraft(), { notify: false });
	}

	function markContentSaved(nextContent: VersionedSnapshot<EmailFormatContent>) {
		emailContentSection.markSaved(nextContent);
		syncEditorFromSections();
	}

	function syncContentRemote(nextContent: VersionedSnapshot<EmailFormatContent>) {
		emailContentSection.sync(nextContent);
		syncEditorFromSections();
	}

	function updateRules(nextRules: EmailFormatRule[]) {
		rulesSection.updateDraft(nextRules);
	}

	function markRulesSaved(nextRules: VersionedSnapshot<EmailFormatRule[]>) {
		rulesSection.markSaved(nextRules);
	}

	function syncRulesRemote(nextRules: VersionedSnapshot<EmailFormatRule[]>) {
		rulesSection.sync(nextRules);
	}

	function useLatestTitle() {
		titleSection.useLatest();
		contentEditor?.updateTitle(getTitleDraft(), { notify: false });
	}

	function useLatestContent() {
		emailContentSection.useLatest();
		syncEditorFromSections();
	}

	function useLatestRules() {
		rulesSection.useLatest();
	}

	function updateSelectedRecipientRefs(nextRefs: EmailFormatRecipientRef[]) {
		selectedRecipientRefs = cloneRecipientRefs(nextRefs);
	}

	function markRecipientsSaved(nextRefs: EmailFormatRecipientRef[], updatedAt: number) {
		selectedRecipientRefs = cloneRecipientRefs(nextRefs);
		savedRecipientRefs = cloneRecipientRefs(nextRefs);
		syncedRecipientsUpdatedAt = updatedAt;
	}

	function getFeedback(
		feedbackBySentEmailId: Record<string, EmailFeedback>,
		sentEmailId: string
	) {
		return feedbackBySentEmailId[sentEmailId] ?? EMPTY_FEEDBACK;
	}

	function getFeedbackDraft(sentEmailId: string) {
		return getFeedback(feedbackDraftsBySentEmailId, sentEmailId);
	}

	function getSavedFeedback(sentEmailId: string) {
		return getFeedback(savedFeedbackBySentEmailId, sentEmailId);
	}

	function canSaveFeedback(sentEmailId: string) {
		return !areFeedbackEqual(getFeedbackDraft(sentEmailId), getSavedFeedback(sentEmailId));
	}

	function updateFeedback(sentEmailId: string, patch: Partial<EmailFeedback>) {
		feedbackDraftsBySentEmailId = {
			...feedbackDraftsBySentEmailId,
			[sentEmailId]: {
				...getFeedbackDraft(sentEmailId),
				...patch
			}
		};
	}

	function markFeedbackSaved(sentEmailId: string, feedback: EmailFeedback) {
		feedbackDraftsBySentEmailId = {
			...feedbackDraftsBySentEmailId,
			[sentEmailId]: cloneFeedback(feedback)
		};
		savedFeedbackBySentEmailId = {
			...savedFeedbackBySentEmailId,
			[sentEmailId]: cloneFeedback(feedback)
		};
	}

	return {
		get contentEditor() {
			return contentEditor;
		},
		get titleDraft() {
			return getTitleDraft();
		},
		get titleConflict() {
			return titleSection.conflict;
		},
		get isSavingTitle() {
			return titleSection.saving;
		},
		set isSavingTitle(value: boolean) {
			titleSection.saving = value;
		},
		get emailContentDraft() {
			return getEmailContentDraft();
		},
		get contentConflict() {
			return emailContentSection.conflict;
		},
		get isSavingContent() {
			return emailContentSection.saving;
		},
		set isSavingContent(value: boolean) {
			emailContentSection.saving = value;
		},
		get canSaveContent() {
			return canSaveContent();
		},
		get contentDraft() {
			return getContentDraft();
		},
		get rulesDraft() {
			return rulesSection.draftValue ?? [];
		},
		get savedRules() {
			return cloneRules(rulesSection.baseValue ?? []);
		},
		get rulesConflict() {
			return rulesSection.conflict;
		},
		get isSavingRules() {
			return rulesSection.saving;
		},
		set isSavingRules(value: boolean) {
			rulesSection.saving = value;
		},
		get canSaveRules() {
			return canSaveRules();
		},
		get selectedRecipientRefs() {
			return selectedRecipientRefs;
		},
		get savedRecipientRefs() {
			return cloneRecipientRefs(savedRecipientRefs);
		},
		get selectedSentEmailIndex() {
			return selectedSentEmailIndex;
		},
		set selectedSentEmailIndex(index: number) {
			selectedSentEmailIndex = index;
		},
		canSaveFeedback,
		getContentSaveVersion: (options?: { overwriteConflict?: boolean }) =>
			emailContentSection.getSaveVersion(options),
		getFeedbackDraft,
		getRulesSaveVersion: (options?: { overwriteConflict?: boolean }) =>
			rulesSection.getSaveVersion(options),
		getTitleSaveVersion: (options?: { overwriteConflict?: boolean }) =>
			titleSection.getSaveVersion(options),
		markContentSaved,
		markFeedbackSaved,
		markRulesSaved,
		markTitleSaved,
		markRecipientsSaved,
		sync,
		syncContentRemote,
		syncRulesRemote,
		syncTitleRemote,
		updateFeedback,
		updateRules,
		updateSelectedRecipientRefs,
		updateTitleDraft,
		useLatestContent,
		useLatestRules,
		useLatestTitle
	};
}

export type EmailFormatConfigureState = ReturnType<typeof createEmailFormatConfigureState>;
