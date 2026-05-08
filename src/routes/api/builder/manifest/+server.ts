import { json } from '@sveltejs/kit';
import { bringTheFirmManifest } from '$runtime/builder-runtime';

export const GET = () => {
	return json({
		manifest: bringTheFirmManifest
	});
};
