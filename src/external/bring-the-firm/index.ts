import {
	applyBringTheFirmInitialAnswer,
	createBringTheFirmInitialDraft,
	createBringTheFirmInitialQuestion,
	streamBringTheFirmRefinementTurn
} from './engine';
import { bringTheFirmCatalog } from './catalog';
import type { EmailAppDefinition } from './types';

export { bringTheFirmCatalog } from './catalog';
export type * from './types';

export const bringTheFirmApp = {
	...bringTheFirmCatalog,
	createInitialQuestion: createBringTheFirmInitialQuestion,
	createInitialDraft: createBringTheFirmInitialDraft,
	applyInitialAnswer: applyBringTheFirmInitialAnswer,
	streamRefinementTurn: streamBringTheFirmRefinementTurn
} satisfies EmailAppDefinition;
