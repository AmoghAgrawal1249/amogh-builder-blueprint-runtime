export const builderAppCategories = [
	{
		slug: 'consulting',
		label: 'Consulting',
		iconId: 'briefcase-business',
		sortOrder: 0
	},
	{
		slug: 'insurance',
		label: 'Insurance',
		iconId: 'shield-check',
		sortOrder: 10
	},
	{
		slug: 'law',
		label: 'Law',
		iconId: 'scale',
		sortOrder: 20
	},
	{
		slug: 'manufacturing',
		label: 'Manufacturing',
		iconId: 'factory',
		sortOrder: 30
	}
] as const;

export type BuilderAppCategory = (typeof builderAppCategories)[number];
