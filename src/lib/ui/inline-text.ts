export type InlineTextTextPart = {
	kind: 'text';
	text: string;
};

export type InlineTextLinkPart = {
	kind: 'link';
	label: string;
	href: `/${string}`;
};

export type InlineTextTooltipPart = {
	kind: 'tooltip';
	label: string;
	tooltipText: string;
};

export type InlineTextPart = InlineTextTextPart | InlineTextLinkPart | InlineTextTooltipPart;

export type InlineTextContent = string | readonly InlineTextPart[];

export type NonLinkInlineTextPart = InlineTextTextPart | InlineTextTooltipPart;

export type NonLinkInlineTextContent = string | readonly NonLinkInlineTextPart[];

export function hasInlineTextContent(content: InlineTextContent) {
	if (typeof content === 'string') {
		return Boolean(content.trim());
	}

	return content.some((part) => {
		if (part.kind === 'text') {
			return Boolean(part.text.trim());
		}

		return Boolean(part.label.trim());
	});
}
