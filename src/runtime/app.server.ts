import { createServerDependencies } from './dependencies.server';
import { createBringTheFirmRuntime } from './operations';

export function createRuntimeContext() {
	const deps = createServerDependencies();

	return {
		deps,
		runtime: createBringTheFirmRuntime(deps)
	};
}
