import { cloneFormatInline, type FormatInlineNode } from './inline';

export type FormatParagraphBlock = {
	id: string;
	type: 'paragraph';
	content: readonly FormatInlineNode[];
};

export type FormatBodyBlock = FormatParagraphBlock;

export function formatParagraph(
	id: string,
	content: readonly FormatInlineNode[]
): FormatParagraphBlock {
	return {
		id,
		type: 'paragraph',
		content
	};
}

export function cloneFormatBody(body: readonly FormatBodyBlock[]): FormatBodyBlock[] {
	return body.map((block) => ({
		id: block.id,
		type: 'paragraph',
		content: cloneFormatInline(block.content)
	}));
}
