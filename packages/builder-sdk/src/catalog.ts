export type AppStatus = 'active';
export type AppMode = 'custom' | 'guided';

export type GuideChoiceQuestion = {
	id: string;
	type: 'choice';
	title: string;
	options: readonly string[];
	customAnswerPlaceholder: string;
};

export type GuideTextQuestion = {
	id: string;
	type: 'text';
	title: string;
	placeholder: string;
};

export type GuideQuestion = GuideChoiceQuestion | GuideTextQuestion;

export type GuideDefinition = {
	intro: string;
	questions: readonly GuideQuestion[];
};

export type ArtworkCardTone = 'coral' | 'violet' | 'aqua' | 'zinc';
export type ArtworkCardSymbolSize = 'sm' | 'md';

export type Artwork = {
	id: string;
	card: {
		tone: ArtworkCardTone;
		iconId: string;
		symbolSize: ArtworkCardSymbolSize;
	};
	panel: {
		backColor: string;
		frontColor: string;
		iconId: string;
		iconCenterX: string;
		iconCenterY: string;
	};
};

export type BaseAppCatalogDefinition = {
	slug: string;
	categoryIds: readonly string[];
	title: string;
	description: string;
	artwork: Artwork;
	showInGallery: boolean;
	sortOrder: number;
	status: AppStatus;
};

export type GuidedEmailAppCatalogDefinition = BaseAppCatalogDefinition & {
	mode: 'guided';
	guide: GuideDefinition;
};

export type CustomEmailAppCatalogDefinition = BaseAppCatalogDefinition & {
	mode: 'custom';
	guide: null;
};

export type AppCatalogDefinition =
	| GuidedEmailAppCatalogDefinition
	| CustomEmailAppCatalogDefinition;
