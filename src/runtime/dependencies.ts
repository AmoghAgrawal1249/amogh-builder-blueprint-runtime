import type {
	OpenAIConfig,
	OpenAIModelProfile
} from '@overbase/builder-sdk/openai';

export type RuntimeDependencies = {
	getOpenAIConfig: (profile?: OpenAIModelProfile) => OpenAIConfig;
};

export type ServerDependencies = RuntimeDependencies & {
	overbaseSecret: string | undefined;
};
