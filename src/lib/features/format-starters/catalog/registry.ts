import { formatStarterEntries } from './entries';
import type { FormatStarterGalleryEntry, FormatStarter } from './types';
import { validateFormatStarterCatalog } from './validate-catalog';

const formatStarterCatalog: readonly FormatStarter[] = formatStarterEntries;
const formatStarterCatalogValidationIssues = validateFormatStarterCatalog(formatStarterCatalog);

if (formatStarterCatalogValidationIssues.length > 0) {
	throw new Error(
		`Invalid format starter catalog:\n${formatStarterCatalogValidationIssues
			.map((issue) => `- ${issue.formatStarterSlug ? `${issue.formatStarterSlug}: ` : ''}${issue.message}`)
			.join('\n')}`
	);
}

export function listFormatStarters() {
	return [...formatStarterCatalog]
		.filter((formatStarter) => formatStarter.status === 'active')
		.sort(compareFormatStarterCatalogEntries);
}

function compareFormatStarterCatalogEntries(left: FormatStarter, right: FormatStarter) {
	return left.sortOrder - right.sortOrder;
}

export function listFormatStarterGalleryEntries(): FormatStarterGalleryEntry[] {
	return listFormatStarters()
		.filter((formatStarter) => formatStarter.showInGallery)
		.map(({ slug, defaultPresentation, dataSourceIds, industryTags, sampleEmail }) => ({
			slug,
			...defaultPresentation,
			dataSourceIds,
			industryTags,
			sampleEmail
		}));
}

export function getFormatStarter(slug: string) {
	return (
		formatStarterCatalog.find((formatStarter) => formatStarter.slug === slug && formatStarter.status === 'active') ?? null
	);
}
