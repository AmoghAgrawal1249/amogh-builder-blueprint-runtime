import { newProgramExamples } from "./new-program";

export type { BringTheFirmExample, BringTheFirmExamples } from "./types";
export * from "./new-program";

export const bringTheFirmExamples = [newProgramExamples];

export function listBringTheFirmExamples() {
  return [...bringTheFirmExamples];
}

export function getBringTheFirmExamples(slug: string) {
  return (
    bringTheFirmExamples.find((examples) => examples.slug === slug) ?? null
  );
}

export function listBringTheFirmDraftExamples(examplesSlug: string) {
  return getBringTheFirmExamples(examplesSlug)?.examples ?? [];
}
