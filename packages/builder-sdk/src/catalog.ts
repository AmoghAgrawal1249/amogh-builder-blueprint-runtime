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

export type BuilderAppDetails = {
	paragraphs: readonly string[];
};

export type GuidedBuilderAppManifest = {
	slug: string;
	title: string;
	description: string;
	details: BuilderAppDetails;
	mode: 'guided';
	guide: GuideDefinition;
};

export type CustomBuilderAppManifest = {
	slug: string;
	title: string;
	description: string;
	details: BuilderAppDetails;
	mode: 'custom';
	guide: null;
};

export type BuilderAppManifest = GuidedBuilderAppManifest | CustomBuilderAppManifest;
