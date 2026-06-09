export type FormatTextNode = {
	type: 'text';
	text: string;
};

export type FormatVariableNode = {
	type: 'variable';
	variableId: string;
};

export type FormatInlineNode = FormatTextNode | FormatVariableNode;

export function formatText(textValue: string): FormatTextNode {
	return {
		type: 'text',
		text: textValue
	};
}

export function formatVariable(variableId: string): FormatVariableNode {
	return {
		type: 'variable',
		variableId
	};
}

export function formatVariableToken(variableId: string) {
	return `{${variableId}}`;
}

export function cloneFormatInline(nodes: readonly FormatInlineNode[]): FormatInlineNode[] {
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

export function normalizeFormatInline(nodes: readonly FormatInlineNode[]) {
	const normalized: FormatInlineNode[] = [];

	for (const node of nodes) {
		const previous = normalized.at(-1);

		if (node.type === 'text') {
			if (node.text.length === 0) {
				continue;
			}

			if (previous?.type === 'text') {
				previous.text += node.text;
			} else {
				normalized.push({
					type: 'text',
					text: node.text
				});
			}
		} else if (node.variableId.trim()) {
			normalized.push({
				type: 'variable',
				variableId: node.variableId.trim()
			});
		}
	}

	return normalized;
}
