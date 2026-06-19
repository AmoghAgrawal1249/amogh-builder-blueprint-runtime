import {
  formatParagraph as paragraph,
  formatText as text,
  formatVariable as variable,
  type FormatInlineNode,
} from "$lib/features/format-starters/domain";
import type { FormatStarter, FormatStartingPoint } from "../types";

type InlinePart = string | FormatInlineNode;
type RequestVariant =
  | "one-question"
  | "send-materials"
  | "sanity-check"
  | "owner-intro";

type RequestScenario = {
  id: string;
  gapOptionId: string;
  label: string;
  title: string;
  to: readonly string[];
  cc: readonly string[];
  contextLine: readonly InlinePart[];
  knownLine: readonly InlinePart[];
  oneQuestionAsk: readonly InlinePart[];
  materialAsk: readonly InlinePart[];
  sanityCheckAsk: readonly InlinePart[];
  ownerIntroAsk: readonly InlinePart[];
  whyLine: readonly InlinePart[];
  closeLine: readonly InlinePart[];
};

const requestVariants: readonly RequestVariant[] = [
  "one-question",
  "send-materials",
  "sanity-check",
  "owner-intro",
];

function v(variableId: string) {
  return variable(variableId);
}

function p(id: string, parts: readonly InlinePart[]) {
  return paragraph(id, parts.map((part) => (typeof part === "string" ? text(part) : part)));
}

function createScenarioRules(scenario: RequestScenario) {
  const answer = scenario.gapOptionId;

  return [
    {
      id: `${scenario.id}-send-materials`,
      startingPointId: `${scenario.id}-send-materials`,
      answers: {
        context_gap_source: answer,
        request_shape: "send_materials",
      },
    },
    {
      id: `${scenario.id}-sanity-check`,
      startingPointId: `${scenario.id}-sanity-check`,
      answers: {
        context_gap_source: answer,
        request_shape: "sanity_check",
      },
    },
    {
      id: `${scenario.id}-owner-intro`,
      startingPointId: `${scenario.id}-owner-intro`,
      answers: {
        context_gap_source: answer,
        request_shape: "point_to_owner",
      },
    },
    {
      id: `${scenario.id}-one-question`,
      startingPointId: `${scenario.id}-one-question`,
      answers: { context_gap_source: answer },
    },
  ];
}

function createScenarioStartingPoints(
  scenario: RequestScenario,
): FormatStartingPoint[] {
  return requestVariants.map((variant) => createScenarioStartingPoint(scenario, variant));
}

function createScenarioStartingPoint(
  scenario: RequestScenario,
  variant: RequestVariant,
): FormatStartingPoint {
  return {
    id: `${scenario.id}-${variant}`,
    label: formatVariantLabel(scenario.label, variant),
    emailContent: {
      title: formatVariantTitle(scenario.title, variant),
      to: scenario.to,
      cc: scenario.cc,
      attachment: null,
      body: [
        p(`${scenario.id}-${variant}-greeting`, ["Hey ", v("recipient_name"), ","]),
        p(`${scenario.id}-${variant}-context`, scenario.contextLine),
        p(`${scenario.id}-${variant}-known`, scenario.knownLine),
        p(`${scenario.id}-${variant}-ask`, askForVariant(scenario, variant)),
        p(`${scenario.id}-${variant}-why`, scenario.whyLine),
        p(`${scenario.id}-${variant}-close`, scenario.closeLine),
      ],
    },
  };
}

function formatVariantLabel(label: string, variant: RequestVariant) {
  if (variant === "one-question") {
    return label;
  }

  return `${label} - ${formatVariantSuffix(variant)}`;
}

function formatVariantTitle(title: string, variant: RequestVariant) {
  if (variant === "one-question") {
    return title;
  }

  return `${title}: ${formatVariantSuffix(variant)}`;
}

function formatVariantSuffix(variant: RequestVariant) {
  switch (variant) {
    case "send-materials":
      return "send materials";
    case "sanity-check":
      return "sanity check";
    case "owner-intro":
      return "owner intro";
    case "one-question":
      return "one question";
  }
}

function askForVariant(
  scenario: RequestScenario,
  variant: RequestVariant,
) {
  switch (variant) {
    case "send-materials":
      return scenario.materialAsk;
    case "sanity-check":
      return scenario.sanityCheckAsk;
    case "owner-intro":
      return scenario.ownerIntroAsk;
    case "one-question":
      return scenario.oneQuestionAsk;
  }
}

const requestScenarios: readonly RequestScenario[] = [
  {
    id: "prior-pitch-owner",
    gapOptionId: "prior_pitch_owner",
    label: "Prior pitch owner",
    title: "Prior pitch context request",
    to: ["Prior pitch owner"],
    cc: [],
    contextLine: [
      "I'm preparing the context handoff for the ",
      v("client_name"),
      " pitch. I found ",
      v("context_signal"),
      " in ",
      v("signal_source"),
      ", and it points to you because ",
      v("owner_reason"),
      ".",
    ],
    knownLine: [
      "The material I can use is ",
      v("known_materials"),
      ", but the missing piece is ",
      v("context_gap"),
      ".",
    ],
    oneQuestionAsk: [
      "Could you answer one thing before ",
      v("deadline"),
      ": ",
      v("specific_question"),
      "?",
    ],
    materialAsk: [
      "Could you send the decision feedback, notes, or final version that would confirm what changed after that pitch",
      "?",
    ],
    sanityCheckAsk: [
      "Could you sanity-check whether ",
      v("client_signal"),
      " is still a fair read before I include this in the handoff?",
    ],
    ownerIntroAsk: [
      "If this signal is pointing at the wrong person, could you point me to whoever has the better read on that prior pitch?",
    ],
    whyLine: [
      "I'm trying to turn the prior work into useful context without making it look more current or reusable than it really is.",
    ],
    closeLine: ["A quick note is enough; I can turn it into the handoff for the pitch team."],
  },
  {
    id: "account-context-owner",
    gapOptionId: "account_context_owner",
    label: "Account context owner",
    title: "Account context request",
    to: ["Account context owner"],
    cc: [],
    contextLine: [
      "I'm preparing the context handoff for the ",
      v("client_name"),
      " pitch. The strongest signal I found is ",
      v("context_signal"),
      " from ",
      v("signal_source"),
      ", which points to you because ",
      v("owner_reason"),
      ".",
    ],
    knownLine: [
      "I have ",
      v("known_materials"),
      ", but I'm missing ",
      v("context_gap"),
      ".",
    ],
    oneQuestionAsk: [
      "Could you answer this before ",
      v("deadline"),
      ": ",
      v("specific_question"),
      "?",
    ],
    materialAsk: [
      "Could you send any recent account notes, delivery notes, or stakeholder context that would explain ",
      v("client_signal"),
      "?",
    ],
    sanityCheckAsk: [
      "Could you sanity-check whether ",
      v("client_signal"),
      " is still the right thing for the pitch team to emphasize?",
    ],
    ownerIntroAsk: [
      "If someone else has the better account read, could you point me to that person and the reason they are closer to it?",
    ],
    whyLine: [
      "This helps avoid sending a technically relevant example that misses what the account actually cares about now.",
    ],
    closeLine: ["I only need the practical version, not a polished write-up."],
  },
  {
    id: "internal-expert",
    gapOptionId: "internal_expert",
    label: "Internal expert",
    title: "Internal expert context request",
    to: ["Internal expert"],
    cc: [],
    contextLine: [
      "I'm preparing the context handoff for the ",
      v("client_name"),
      " pitch around ",
      v("pitch_context"),
      ". I found ",
      v("context_signal"),
      " in ",
      v("signal_source"),
      ", which points to you because ",
      v("owner_reason"),
      ".",
    ],
    knownLine: [
      "I found ",
      v("known_materials"),
      ", but the missing piece is ",
      v("context_gap"),
      ".",
    ],
    oneQuestionAsk: [
      "Could you answer this before ",
      v("deadline"),
      ": ",
      v("specific_question"),
      "?",
    ],
    materialAsk: [
      "Could you send the best example, slide, note, or prior deliverable that explains ",
      v("pitch_context"),
      " for this kind of client?",
    ],
    sanityCheckAsk: [
      "Could you sanity-check whether the angle around ",
      v("client_signal"),
      " is technically credible for this pitch?",
    ],
    ownerIntroAsk: [
      "If this signal is too loose, could you point me to the person who is closer to this topic and say what I should ask?",
    ],
    whyLine: [
      "I want the handoff to include the right expert judgment, not just nearby documents that happen to mention the topic.",
    ],
    closeLine: ["A short answer or one pointed example would help a lot."],
  },
  {
    id: "partner-ecosystem",
    gapOptionId: "partner_ecosystem",
    label: "Partner or ecosystem lead",
    title: "Partner context request",
    to: ["Partner context owner"],
    cc: [],
    contextLine: [
      "I'm preparing the context handoff for the ",
      v("client_name"),
      " pitch and found a partner-channel signal: ",
      v("context_signal"),
      " from ",
      v("signal_source"),
      ". It points to you because ",
      v("owner_reason"),
      ".",
    ],
    knownLine: [
      "The material I have is ",
      v("known_materials"),
      ", but I need help with ",
      v("context_gap"),
      ".",
    ],
    oneQuestionAsk: [
      "Could you answer this before ",
      v("deadline"),
      ": ",
      v("specific_question"),
      "?",
    ],
    materialAsk: [
      "Could you send the cleanest partner-safe material or context note I can use for ",
      v("client_name"),
      "?",
    ],
    sanityCheckAsk: [
      "Could you sanity-check the sensitivity here: ",
      v("sensitivity_note"),
      "?",
    ],
    ownerIntroAsk: [
      "If someone else owns the current ",
      v("partner_name"),
      " relationship, could you point me to them before I reuse this signal?",
    ],
    whyLine: [
      "I do not want to reuse partner-sourced framing without checking what is current and appropriate.",
    ],
    closeLine: ["Even a quick yes/no on what is safe to use would help."],
  },
  {
    id: "no-owner-found",
    gapOptionId: "no_owner_found",
    label: "No clear owner found",
    title: "Next search angle request",
    to: ["Pitch owner"],
    cc: [],
    contextLine: [
      "I'm preparing the context handoff for the ",
      v("client_name"),
      " pitch, but the signals I found in ",
      v("signal_source"),
      " do not point to a reliable context owner yet.",
    ],
    knownLine: [
      "The only useful material so far is ",
      v("known_materials"),
      ", and the unresolved gap is ",
      v("context_gap"),
      ".",
    ],
    oneQuestionAsk: [
      "Before I keep searching, which angle should I prioritize: ",
      v("next_search_angle"),
      "?",
    ],
    materialAsk: [
      "If you have any rough notes, old decks, account names, or people I should search around, could you send them over?",
    ],
    sanityCheckAsk: [
      "Could you sanity-check whether ",
      v("client_signal"),
      " is even the right direction before I spend more time searching?",
    ],
    ownerIntroAsk: [
      "If there is someone who would know where this context lives, could you point me to them?",
    ],
    whyLine: [
      "I would rather be explicit about the gap than send the team a weak match that looks more relevant than it is.",
    ],
    closeLine: ["Once I have a better angle, I can turn it into a cleaner context handoff."],
  },
];

export const formatStarter = {
  slug: "context-request",
  defaultPresentation: {
    title: "Context request",
    description:
      "Use source signals to ask a likely context owner for the missing piece.",
  },
  dataSourceIds: ["flowcase", "salesforce", "onedrive", "calendar"],
  industryTags: ["consulting", "tech-consulting"],
  variables: [
    { id: "recipient_name", label: "Recipient name" },
    { id: "client_name", label: "Client name" },
    { id: "pitch_context", label: "Pitch context" },
    { id: "context_signal", label: "Context signal" },
    { id: "signal_source", label: "Signal source" },
    { id: "owner_reason", label: "Why recipient may know" },
    { id: "known_materials", label: "Known materials" },
    { id: "context_gap", label: "Context gap" },
    { id: "specific_question", label: "Specific question" },
    { id: "source_team_or_office", label: "Source team or office" },
    { id: "context_timeframe", label: "Context timeframe" },
    { id: "client_signal", label: "Client signal" },
    { id: "partner_name", label: "Partner name" },
    { id: "sensitivity_note", label: "Sensitivity note" },
    { id: "deadline", label: "Deadline" },
    { id: "next_search_angle", label: "Next search angle" },
  ],
  sampleEmail: {
    subject: "Quick context check for JPMC pitch",
    paragraphs: [
      "Hey Priya,",
      "I'm preparing the context handoff for the JPMC pitch. The strongest signal I found is your name on two recent account review meetings from Calendar, which points to you because you were closest to the latest stakeholder discussion.",
      "I have last year's implementation proposal, but I'm missing whether timeline, ownership, and integration risk are still the right concerns.",
      "Could you sanity-check that before Friday?",
      "I only need the practical version, not a polished write-up.",
    ],
  },
  details: {
    paragraphs: [
      "Create a targeted request when connected systems show a likely context owner, but one context gap blocks the handoff.",
      "The format changes based on whether the signal comes from prior work, account activity, expert material, partner context, or no reliable owner signal.",
      "The email explains what signal pointed to the recipient, what is missing, and the smallest useful answer needed.",
    ],
  },
  startingPointSelection: {
    kind: "guided",
    intro:
      "Choose the signal and gap so the email asks the likely context owner for the smallest useful answer.",
    questions: [
      {
        id: "context_gap_source",
        title: "Which signal points to the recipient?",
        helpText:
          "Choose the data-source signal that makes this person a likely context owner.",
        options: [
          { id: "prior_pitch_owner", label: "Prior proposal or document owner" },
          { id: "account_context_owner", label: "Recent account activity or meetings" },
          { id: "internal_expert", label: "Expert or content ownership signal" },
          { id: "partner_ecosystem", label: "Partner or ecosystem signal" },
          { id: "no_owner_found", label: "No reliable owner signal" },
        ],
      },
      {
        id: "request_shape",
        title: "What should the request ask for?",
        helpText:
          "Choose the smallest useful response the recipient can give.",
        options: [
          { id: "one_question", label: "Answer one specific question" },
          { id: "send_materials", label: "Send the best source material" },
          { id: "sanity_check", label: "Sanity-check the current angle" },
          { id: "point_to_owner", label: "Point me to the right owner" },
        ],
      },
    ],
    rules: [
      ...requestScenarios.flatMap(createScenarioRules),
      {
        id: "default",
        startingPointId: "no-owner-found-one-question",
        answers: {},
      },
    ],
  },
  startingPoints: requestScenarios.flatMap(createScenarioStartingPoints),
  showInGallery: true,
  sortOrder: 28,
  status: "active",
} satisfies FormatStarter;
