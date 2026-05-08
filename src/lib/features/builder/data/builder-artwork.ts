import {
	ArrowRight,
	BellRing,
	Club,
	Flag,
	Handshake,
	MessageSquareQuote,
	Network,
	ScanSearch,
	Sparkles,
	Target,
	UsersRound,
	Zap
} from 'lucide-svelte';
import type { Artwork } from '@overbase/builder-sdk/catalog';

type ArtworkIcon = typeof Flag;

export type BuilderArtworkCardTone = 'coral' | 'violet' | 'aqua' | 'zinc';
export type BuilderArtworkCardSymbolSize = 'sm' | 'md';

export type BuilderArtworkPreset = {
	id: string;
	card: {
		tone: BuilderArtworkCardTone;
		iconId: string;
		icon: ArtworkIcon;
		symbolSize: BuilderArtworkCardSymbolSize;
	};
	panel: {
		backColor: string;
		frontColor: string;
		iconId: string;
		icon: ArtworkIcon;
		iconCenterX: string;
		iconCenterY: string;
	};
};

const ARTWORK_ICONS: Record<string, ArtworkIcon> = {
	'arrow-right': ArrowRight,
	'bell-ring': BellRing,
	club: Club,
	flag: Flag,
	handshake: Handshake,
	'message-square-quote': MessageSquareQuote,
	network: Network,
	'scan-search': ScanSearch,
	sparkles: Sparkles,
	target: Target,
	'users-round': UsersRound,
	zap: Zap
};

function getArtworkIcon(iconId: string) {
	return ARTWORK_ICONS[iconId] ?? Flag;
}

export function toBuilderArtworkPreset(artwork: Artwork): BuilderArtworkPreset {
	return {
		id: artwork.id,
		card: {
			tone: artwork.card.tone,
			iconId: artwork.card.iconId,
			icon: getArtworkIcon(artwork.card.iconId),
			symbolSize: artwork.card.symbolSize
		},
		panel: {
			backColor: artwork.panel.backColor,
			frontColor: artwork.panel.frontColor,
			iconId: artwork.panel.iconId,
			icon: getArtworkIcon(artwork.panel.iconId),
			iconCenterX: artwork.panel.iconCenterX,
			iconCenterY: artwork.panel.iconCenterY
		}
	};
}
