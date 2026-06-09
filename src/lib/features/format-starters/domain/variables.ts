export type FormatVariableDefinition = {
	id: string;
	label: string;
	description?: string;
	sampleValue?: string;
};

export function resolveFormatVariable(
	variables: readonly FormatVariableDefinition[],
	variableId: string
) {
	return variables.find((variable) => variable.id === variableId) ?? null;
}

export function formatFormatVariableLabel(
	variables: readonly FormatVariableDefinition[],
	variableId: string
) {
	return resolveFormatVariable(variables, variableId)?.label ?? `{${variableId}}`;
}
