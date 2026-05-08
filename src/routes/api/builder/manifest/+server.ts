import { json } from '@sveltejs/kit';
import { runtime } from '$runtime/operations';

export const GET = () => {
	return json({
		manifest: runtime.manifest
	});
};
