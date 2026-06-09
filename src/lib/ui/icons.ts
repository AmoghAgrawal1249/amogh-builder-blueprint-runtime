import type { Component } from 'svelte';
import type { SVGAttributes } from 'svelte/elements';

export type PhosphorIconProps = Omit<SVGAttributes<SVGSVGElement>, 'size' | 'color'> & {
	size?: number | string;
	weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
	color?: string;
	mirrored?: boolean;
};

export type PhosphorIcon = Component<PhosphorIconProps>;
