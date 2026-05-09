//questions asked at the begining of the conversation
//through a structured form

import type { GuideDefinition } from "./types";

export const bringTheFirmGuide = {
  intro:
    "Let's build your Bring the firm notification. I just have a few quick questions.",
  questions: [
    {
      id: "existing-program",
      type: "choice",
      title: "Does your firm already run a Bring the Firm program?",
      options: [
        "Yes and it's widely adopted",
        "Yes and it's only somewhat successful",
        "No but we have in the past",
        "We've never run one",
      ],
      customAnswerPlaceholder: "Describe your current program...",
    },
    {
      id: "confirm-availability",
      type: "choice",
      title:
        "Should we confirm that colleagues are available before proposing them?",
      options: [
        "Always confirm that colleagues are available",
        "Confirm only when the colleague is more senior",
        "Confirm only when the colleague is more junior",
        "Never confirm",
      ],
      customAnswerPlaceholder: "Explain when we should confirm...",
    },
  ],
} satisfies GuideDefinition;
