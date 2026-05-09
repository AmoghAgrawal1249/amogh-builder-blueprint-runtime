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
      id: "expertise-signal",
      type: "choice",
      title: "What kind of colleague should we look for?",
      options: [
        "Someone with relevant industry experience",
        "Someone who knows the account personally",
        "Someone with a matching service-line specialty",
        "Someone who worked on a similar deal",
      ],
      customAnswerPlaceholder: "Describe the expertise you want...",
    },
    {
      id: "delivery-channel",
      type: "text",
      title: "What context should the recommendation include?",
      placeholder:
        "Describe the client context, meeting notes, or expertise signals to include...",
    },
  ],
} satisfies GuideDefinition;
