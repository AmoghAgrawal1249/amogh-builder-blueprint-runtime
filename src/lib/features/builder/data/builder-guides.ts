import type { BuilderGuideDefinition } from '$lib/features/builder/guide/guide-types';
import type { BuilderAppGuideEntry } from '../../../../builder-apps/registry';

export function toBuilderGuideDefinition(
	guide: BuilderAppGuideEntry | null
): BuilderGuideDefinition | null {
	if (!guide) {
		return null;
	}

	return {
		intro: guide.intro,
		questions: guide.questions
	};
}
