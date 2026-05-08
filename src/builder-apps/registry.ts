import type { GuideDefinition } from '@overbase/builder-sdk/catalog';

export type BuilderAppGuideEntry = GuideDefinition & {
	appSlug: string;
};
