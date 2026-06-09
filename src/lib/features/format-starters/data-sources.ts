export const DATA_SOURCE_LOGO_REGISTRY = {
	bloomberg: {
		label: 'Bloomberg',
		logoSrc: '/logos/bloomberg.jpg'
	},
	calendar: {
		label: 'Calendar',
		logoSrc: '/logos/calendar.png'
	},
	epic: {
		label: 'Epic',
		logoSrc: '/logos/epic.png'
	},
	flowcase: {
		label: 'Flowcase',
		logoSrc: '/logos/flowcase.png'
	},
	foundation: {
		label: 'Foundation',
		logoSrc: '/logos/foundation.png'
	},
	gong: {
		label: 'Gong',
		logoSrc: '/logos/gong.png'
	},
	navatar: {
		label: 'Navatar',
		logoSrc: '/logos/navatar.png'
	},
	onedrive: {
		label: 'OneDrive',
		logoSrc: '/logos/onedrive.png'
	},
	salesforce: {
		label: 'Salesforce',
		logoSrc: '/logos/salesforce.png'
	}
} as const;

export type DataSourceId = keyof typeof DATA_SOURCE_LOGO_REGISTRY;

export function isDataSourceId(value: string): value is DataSourceId {
	return Object.hasOwn(DATA_SOURCE_LOGO_REGISTRY, value);
}
