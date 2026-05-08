import { clientMeetingExamples } from './client-meeting';
import { dormantAccountExamples } from './dormant-account';
import { pursuitStageExamples } from './pursuit-stage';
import { stakeholderActivityExamples } from './stakeholder-activity';

export type { BringTheFirmExample, BringTheFirmExamples } from './types';
export * from './client-meeting';
export * from './dormant-account';
export * from './pursuit-stage';
export * from './stakeholder-activity';

export const bringTheFirmExamples = [
	clientMeetingExamples,
	pursuitStageExamples,
	dormantAccountExamples,
	stakeholderActivityExamples
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
