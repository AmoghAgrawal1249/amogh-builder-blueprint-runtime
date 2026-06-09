import { formatStarter as warmUp } from './warm-up';
import { formatStarter as renewalUpsell } from './renewal-upsell';
import { formatStarter as pitchContext } from './pitch-context';
import { formatStarter as callIntelligence } from './call-intelligence';
import { formatStarter as financeWhitespaceAnalysis } from './finance-whitespace-analysis';
import { formatStarter as techConsultingCallIntelligence } from './tech-consulting-call-intelligence';
import { formatStarter as topOfMind } from './top-of-mind';

export const formatStarterEntries = [
	warmUp,
	renewalUpsell,
	pitchContext,
	callIntelligence,
	financeWhitespaceAnalysis,
	techConsultingCallIntelligence,
	topOfMind
] as const;
