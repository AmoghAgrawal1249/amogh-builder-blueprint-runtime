import {
	resolveFormatStarterContent,
	type FormatStarter
} from '$lib/features/format-starters/catalog';
import type {
	FormatInlineNode,
	FormatSpreadsheetAttachment,
	FormatStarterSelectionAnswers,
	FormatVariableDefinition
} from '$lib/features/format-starters/domain';
import { FormatContentEditorState } from './format-content-editor-state.svelte';

export type FormatCreatorStep = 'starting-point-selection' | 'editor';

export type FormatVariableInsertionTarget = 'body' | 'spreadsheet';

export type FormatVariableInsertionRequest = {
	id: number;
	variableId: string;
	target: FormatVariableInsertionTarget;
};

export type FormatCreatorSnapshot = {
	activeFormatStarterSlug: string;
	step: FormatCreatorStep;
	selectedAnswers: FormatStarterSelectionAnswers;
	selectedStartingPointId: string | null;
	editor: FormatContentEditorState | null;
	pickerOpen: boolean;
	insertionSequence: number;
	insertionRequest: FormatVariableInsertionRequest | null;
};

export type CreateEmailFormatFromStarterInput = {
	formatStarterSlug: string;
	startingPointId: string;
	variables: FormatVariableDefinition[];
	selectedAnswers: FormatStarterSelectionAnswers;
	title: string;
	to: string[];
	cc: string[];
	attachment: {
		filename: string;
		cellsByKey: Record<string, FormatInlineNode[]>;
	} | null;
	body: Array<{
		id: string;
		type: 'paragraph';
		content: FormatInlineNode[];
	}>;
};

export class FormatCreatorState {
	private creator = $state<FormatCreatorSnapshot>({
		activeFormatStarterSlug: '',
		step: 'starting-point-selection',
		selectedAnswers: {},
		selectedStartingPointId: null,
		editor: null,
		pickerOpen: false,
		insertionSequence: 0,
		insertionRequest: null
	});

	constructor(private formatStarter: FormatStarter) {
		this.syncFormatStarter(formatStarter);
	}

	get step() {
		return this.creator.step;
	}

	get selectedAnswers() {
		return this.creator.selectedAnswers;
	}

	get selectedStartingPointId() {
		return this.creator.selectedStartingPointId;
	}

	get editor() {
		return this.creator.editor;
	}

	get variablePickerOpen() {
		return this.creator.pickerOpen;
	}

	get variableInsertionRequest() {
		return this.creator.insertionRequest;
	}

	get title() {
		return this.creator.editor?.activeEmailContent.title ?? this.formatStarter.defaultPresentation.title;
	}

	get canCreateFormat() {
		return (
			this.creator.step === 'editor' &&
			this.creator.editor !== null &&
			this.creator.selectedStartingPointId !== null
		);
	}

	syncFormatStarter(formatStarter: FormatStarter) {
		if (this.creator.activeFormatStarterSlug === formatStarter.slug) {
			this.formatStarter = formatStarter;
			return;
		}

		this.formatStarter = formatStarter;
		this.creator.activeFormatStarterSlug = formatStarter.slug;
		this.resetForFormatStarter();
	}

	updateAnswers = (answers: FormatStarterSelectionAnswers) => {
		this.creator.selectedAnswers = answers;
	};

	continueToEditor = (answers = this.creator.selectedAnswers) => {
		this.creator.selectedAnswers = answers;
		const editorState = this.createEditorState(answers);

		if (!editorState) {
			return;
		}

		this.creator.editor = editorState.editor;
		this.creator.selectedStartingPointId = editorState.startingPointId;
		this.creator.step = 'editor';
	};

	restart = () => {
		this.resetForFormatStarter();
	};

	updateTitle = (nextTitle: string) => {
		if (this.creator.step === 'editor' && this.creator.editor) {
			this.creator.editor.updateTitle(nextTitle);
		}
	};

	createFormatInput = (): CreateEmailFormatFromStarterInput | null => {
		const editor = this.creator.editor;
		const startingPointId = this.creator.selectedStartingPointId;

		if (!editor || !startingPointId) {
			return null;
		}

		const content = editor.activeEmailContent;

		return {
			formatStarterSlug: this.formatStarter.slug,
			startingPointId,
			variables: this.formatStarter.variables.map((variable) => ({ ...variable })),
			selectedAnswers: { ...this.creator.selectedAnswers },
			title: content.title,
			to: [...content.to],
			cc: [...content.cc],
			attachment: clonePublishAttachment(content.attachment),
			body: content.body.map((block) => ({
				id: block.id,
				type: block.type,
				content: cloneInlineNodes(block.content)
			}))
		};
	};

	openVariablePicker = () => {
		this.creator.pickerOpen = true;
	};

	closeVariablePicker = () => {
		this.creator.pickerOpen = false;
	};

	requestVariableInsertion = (variableId: string) => {
		this.creator.insertionSequence += 1;
		this.creator.insertionRequest = {
			id: this.creator.insertionSequence,
			variableId,
			target: this.getVariableInsertionTarget()
		};
	};

	clearVariableInsertionRequest = (requestId: number) => {
		if (this.creator.insertionRequest?.id === requestId) {
			this.creator.insertionRequest = null;
		}
	};

	private resetForFormatStarter() {
		const editorState =
			this.formatStarter.startingPointSelection.kind === 'fixed-starting-point'
				? this.createEditorState({})
				: null;
		const editor = editorState?.editor ?? null;
		const selectedStartingPointId = editorState?.startingPointId ?? null;

		this.creator = {
			activeFormatStarterSlug: this.formatStarter.slug,
			step: editor ? 'editor' : 'starting-point-selection',
			selectedAnswers: {},
			selectedStartingPointId,
			editor,
			pickerOpen: false,
			insertionSequence: 0,
			insertionRequest: null
		};
	}

	private createEditorState(answers: FormatStarterSelectionAnswers) {
		const startingPoint = resolveFormatStarterContent(this.formatStarter, answers);

		if (!startingPoint) {
			return null;
		}

		return {
			editor: new FormatContentEditorState(startingPoint.emailContent),
			startingPointId: startingPoint.id
		};
	}

	private getVariableInsertionTarget(): FormatVariableInsertionTarget {
		const editor = this.creator.editor;

		return editor?.isAttachmentOpen && editor.activeEmailContent.attachment
			? 'spreadsheet'
			: 'body';
	}
}

function cloneInlineNodes(nodes: readonly FormatInlineNode[]): FormatInlineNode[] {
	return nodes.map((node) =>
		node.type === 'text'
			? {
					type: 'text',
					text: node.text
				}
			: {
					type: 'variable',
					variableId: node.variableId
				}
	);
}

function clonePublishAttachment(attachment: FormatSpreadsheetAttachment | null) {
	return attachment
		? {
				filename: attachment.filename,
				cellsByKey: Object.fromEntries(
					Object.entries(attachment.cellsByKey).map(([key, cell]) => [
						key,
						cloneInlineNodes(cell)
					])
				) as Record<string, FormatInlineNode[]>
			}
		: null;
}
