import { bringTheFirmGuide } from "./guide";
import type { BuilderAppManifest } from "./types";

export const bringTheFirmManifest = {
  slug: "bring-the-firm",
  title: "Bring the firm",
  description:
    "Accelerate your Bring the firm program by analyzing the upcoming client meetings of your consultants then proposing colleagues they could invite to join",
  mode: "guided",
  guide: bringTheFirmGuide,
} satisfies BuilderAppManifest;
