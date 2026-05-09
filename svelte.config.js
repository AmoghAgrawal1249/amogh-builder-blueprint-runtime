import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			runtime: 'nodejs20.x'
		}),
		alias: {
			$blueprint: 'src/blueprint',
			$devHarness: 'src/dev-harness',
			$runtime: 'src/runtime',
			$runtimeHost: 'src/runtime-host'
		}
	},
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) =>
			filename.includes('node_modules') ? undefined : { runes: true }
	}
};

export default config;
