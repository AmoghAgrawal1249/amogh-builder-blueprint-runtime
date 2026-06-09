import {
	getFormatStarter,
	isFormatStarterIndustryTagId,
	type FormatStarterCardEntry
} from '$lib/features/format-starters/catalog';
import type { SupportedCompanyIndustryId } from '$domain/company-industries';

type JoinFormatStarterRecommendationConfig = Pick<
	FormatStarterCardEntry,
	'slug' | 'title' | 'description'
>;

const JOIN_FORMAT_STARTER_RECOMMENDATION_BY_INDUSTRY = {
	insurance: {
		slug: 'renewal-upsell',
		title: 'Propose new policies to existing clients',
		description:
			'Send a whitespace analysis report to brokers before each renewal conversation. This report lists additional policies this client should buy'
	},
	law: {
		slug: 'warm-up',
		title: 'Give lawyers easy reasons to reach out',
		description: 'Send timely client opportunities your team can act on from their inbox.'
	},
	finance: {
		slug: 'finance-whitespace-analysis',
		title: 'Find account whitespace',
		description:
			'Send bankers specific relationship opportunities with the context to follow up.'
	},
	consulting: {
		slug: 'pitch-context',
		title: 'Send useful pitch context',
		description:
			'Give consultants the background they need to act on client opportunities.'
	},
	'tech-consulting': {
		slug: 'tech-consulting-call-intelligence',
		title: 'Surface account opportunities',
		description:
			'Turn account conversations into focused emails your team can use to follow up.'
	}
} as const satisfies Record<
	SupportedCompanyIndustryId,
	JoinFormatStarterRecommendationConfig
>;

export type JoinFormatStarterRecommendation = FormatStarterCardEntry;

export function getJoinFormatStarterRecommendation(
	industryId: string | null | undefined
): JoinFormatStarterRecommendation | null {
	if (!industryId || !isFormatStarterIndustryTagId(industryId)) {
		return null;
	}

	const recommendation = JOIN_FORMAT_STARTER_RECOMMENDATION_BY_INDUSTRY[industryId];
	const formatStarter = getJoinFormatStarter(recommendation);

	if (!formatStarter.industryTags.includes(industryId)) {
		throw new Error(
			`Join format starter "${formatStarter.slug}" is not tagged for industry "${industryId}".`
		);
	}

	return formatStarter;
}

function getJoinFormatStarter(recommendation: JoinFormatStarterRecommendationConfig) {
	const formatStarter = getFormatStarter(recommendation.slug);

	if (!formatStarter) {
		throw new Error(`Join format starter "${recommendation.slug}" is not available.`);
	}

	return {
		slug: formatStarter.slug,
		title: recommendation.title,
		description: recommendation.description,
		dataSourceIds: formatStarter.dataSourceIds,
		industryTags: formatStarter.industryTags,
		sampleEmail: formatStarter.sampleEmail
	};
}
