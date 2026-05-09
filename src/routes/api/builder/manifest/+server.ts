import { json } from '@sveltejs/kit';
import { bringTheFirmManifest } from '$blueprint/definition';

export const GET = () => {
	return json({
		manifest: bringTheFirmManifest
	});
};
