import type { EmailDraft } from '@overbase/builder-sdk/email';

export type {
	BuilderAppManifest,
	GuideChoiceQuestion,
	GuideDefinition,
	GuideQuestion,
	GuideTextQuestion
} from '@overbase/builder-sdk/catalog';
export type {
	ChatReplyDeltaHandler,
	ChatReplyStreamHandlers,
	EmailBuilderEventContext,
	EmailBuilderTurnStreamHandlers,
	EmailBuilderTurnStreamResult,
	TranscriptMessage
} from '@overbase/builder-sdk/streams';

export type BringTheFirmExamplesCandidate = {
	slug: string;
	description: string;
	questionGuidance: string;
};

export type BringTheFirmExampleCandidate = {
	slug: string;
	description: string;
	matchSignals: string[];
	emailDraft: EmailDraft;
};

export type BringTheFirmRouteResult = {
	examplesSlug: string;
	question: string;
};

export type BringTheFirmAdaptedExampleResult = {
	exampleSlug: string;
	emailDraft: EmailDraft;
};
