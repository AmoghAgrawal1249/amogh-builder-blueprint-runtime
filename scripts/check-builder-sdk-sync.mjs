#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const bringTheFirmRoot = path.resolve(path.dirname(scriptPath), '..');
const canonicalSdkRoot = path.resolve(
	process.env.OVERBASE_ROOT ?? path.join(bringTheFirmRoot, '..', 'overbase'),
	'packages',
	'builder-sdk'
);
const vendoredSdkRoot = path.join(bringTheFirmRoot, 'packages', 'builder-sdk');

if (!existsSync(canonicalSdkRoot)) {
	console.error(`Overbase builder SDK was not found at ${canonicalSdkRoot}`);
	console.error('Set OVERBASE_ROOT to the Overbase repository path before running this check.');
	process.exit(1);
}

const rootFiles = ['README.md', 'package.json', 'tsconfig.json', 'tsconfig.build.json'];
const sourceFiles = (await readdir(path.join(canonicalSdkRoot, 'src')))
	.filter((file) => file.endsWith('.ts'))
	.map((file) => path.join('src', file));
const files = [...rootFiles, ...sourceFiles];
const mismatches = [];

for (const file of files) {
	const source = path.join(canonicalSdkRoot, file);
	const target = path.join(vendoredSdkRoot, file);
	const [sourceContent, targetContent] = await Promise.all([readFile(source), readFile(target)]);

	if (!sourceContent.equals(targetContent)) {
		mismatches.push(file);
	}
}

if (mismatches.length > 0) {
	console.error('Bring the Firm builder SDK is out of sync with Overbase:');
	for (const file of mismatches) {
		console.error(`- ${file}`);
	}
	console.error('Run `npm run builder-sdk:sync-bring` from Overbase to update the vendored copy.');
	process.exit(1);
}

console.log('Bring the Firm builder SDK source/package files match Overbase.');
