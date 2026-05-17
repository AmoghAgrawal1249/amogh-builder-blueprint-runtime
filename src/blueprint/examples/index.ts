import { availabilityFirstExamples } from './availability-first';
import { establishedProgramExamples } from './established-program';
import { newProgramExamples } from './new-program';

export type { BringTheFirmExample, BringTheFirmExamples } from './types';
export * from './availability-first';
export * from './established-program';
export * from './new-program';

export const bringTheFirmExamples = [
	newProgramExamples,
	establishedProgramExamples,
	availabilityFirstExamples
];

export function listBringTheFirmExamples() {
	return [...bringTheFirmExamples];
}

export function getBringTheFirmExamples(slug: string) {
	return bringTheFirmExamples.find((examples) => examples.slug === slug) ?? null;
}

export function listBringTheFirmDraftExamples(examplesSlug: string) {
	return getBringTheFirmExamples(examplesSlug)?.examples ?? [];
}
