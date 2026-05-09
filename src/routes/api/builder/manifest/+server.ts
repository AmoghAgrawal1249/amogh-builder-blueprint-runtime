import { json } from '@sveltejs/kit';
import { createRuntimeContext } from '$runtime/app.server';

const { runtime } = createRuntimeContext();

export const GET = () => {
	return json({
		manifest: runtime.manifest
	});
};
