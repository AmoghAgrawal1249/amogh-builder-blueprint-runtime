import {
	SUPPORTED_COMPANY_INDUSTRIES,
	isSupportedCompanyIndustry,
	type SupportedCompanyIndustryId
} from '$domain/company-industries';

export const FORMAT_STARTER_INDUSTRY_TAGS = SUPPORTED_COMPANY_INDUSTRIES;

export type FormatStarterIndustryTagId = SupportedCompanyIndustryId;

export function isFormatStarterIndustryTagId(
	value: string
): value is FormatStarterIndustryTagId {
	return isSupportedCompanyIndustry(value);
}
