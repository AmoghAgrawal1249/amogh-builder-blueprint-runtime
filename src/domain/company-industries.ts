export const UNSUPPORTED_COMPANY_INDUSTRY_ID = 'other';

export const SUPPORTED_COMPANY_INDUSTRIES = [
	{ id: 'insurance', label: 'Insurance' },
	{ id: 'law', label: 'Law' },
	{ id: 'finance', label: 'Finance' },
	{ id: 'consulting', label: 'Consulting' },
	{ id: 'tech-consulting', label: 'Tech consulting' }
] as const;

export const COMPANY_INDUSTRY_OPTIONS = [
	...SUPPORTED_COMPANY_INDUSTRIES,
	{ id: UNSUPPORTED_COMPANY_INDUSTRY_ID, label: 'Other' }
] as const;

export type SupportedCompanyIndustryId = (typeof SUPPORTED_COMPANY_INDUSTRIES)[number]['id'];
export type CompanyIndustryOptionId = (typeof COMPANY_INDUSTRY_OPTIONS)[number]['id'];

export function isSupportedCompanyIndustry(value: string): value is SupportedCompanyIndustryId {
	return SUPPORTED_COMPANY_INDUSTRIES.some((industry) => industry.id === value);
}

export function getCompanyIndustryLabel(value: string | null | undefined) {
	return SUPPORTED_COMPANY_INDUSTRIES.find((industry) => industry.id === value)?.label ?? null;
}
