import { env } from '$env/dynamic/private';
import { getOpenAIConfig } from '@overbase/builder-sdk/openai';
import type { ServerDependencies } from './dependencies';

export function createServerDependencies(): ServerDependencies {
	return {
		getOpenAIConfig(profile = 'default') {
			return getOpenAIConfig({
				profile,
				apiKey: env.OPENAI_API_KEY,
				chatModel: env.OPENAI_CHAT_MODEL,
				fastChatModel: env.OPENAI_FAST_CHAT_MODEL,
				reasoningEffort: env.OPENAI_REASONING_EFFORT,
				fastReasoningEffort: env.OPENAI_FAST_REASONING_EFFORT
			});
		},
		overbaseSecret: env.BRING_THE_FIRM_OVERBASE_SECRET
	};
}
