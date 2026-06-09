import type {
	FormatEmailContent,
	FormatStarterSelection,
	FormatVariableDefinition
} from '$lib/features/format-starters/domain';
import type { DataSourceId } from '$lib/features/format-starters/data-sources';
import type { FormatStarterIndustryTagId } from './industry-tags';

export type FormatStartingPoint = {
	id: string;
	label: string;
	emailContent: FormatEmailContent;
};

export type FormatStarterSampleEmail = {
	subject: string;
	paragraphs: readonly [string, ...string[]];
};

export type FormatStarterPresentation = {
	title: string;
	description: string;
};

export type FormatStarterBase = {
	slug: string;
	defaultPresentation: FormatStarterPresentation;
	dataSourceIds: readonly DataSourceId[];
	industryTags: readonly FormatStarterIndustryTagId[];
	sampleEmail: FormatStarterSampleEmail;
	details: {
		paragraphs: readonly [string, ...string[]];
	};
	variables: readonly FormatVariableDefinition[];
	startingPoints: readonly FormatStartingPoint[];
	startingPointSelection: FormatStarterSelection;
	showInGallery: boolean;
	sortOrder: number;
	status: 'active';
};

export type FormatStarter = FormatStarterBase;

export type FormatStarterCardEntry = Pick<
	FormatStarter,
	'slug' | 'dataSourceIds' | 'industryTags' | 'sampleEmail'
> &
	FormatStarterPresentation;

export type FormatStarterGalleryEntry = FormatStarterCardEntry;
