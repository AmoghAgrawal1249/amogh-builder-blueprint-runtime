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
      "I'm helping prep the ",
      v("client_name"),
      " pitch and found prior work from ",
      v("source_team_or_office"),
      " ",
      v("context_timeframe"),
      ".",
    ],
    knownLine: [
      "The useful material so far is ",
      v("known_materials"),
      ", but the gap is ",
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
      "Could you send the version, notes, or decision feedback that best explains ",
      v("context_gap"),
      "?",
    ],
    sanityCheckAsk: [
      "Could you sanity-check whether ",
      v("client_signal"),
      " is still a fair read before we reuse anything from the prior pitch?",
    ],
    ownerIntroAsk: [
      "If you are not the right person, could you point me to whoever owned the prior client conversation?",
    ],
    whyLine: [
      "I want to avoid handing the team stale proposal language or overstating how directly the prior work applies.",
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
      "I'm helping prep the ",
      v("client_name"),
      " pitch and need a current account read before I send the context handoff.",
    ],
    knownLine: [
      "I have ",
      v("known_materials"),
      ", but I do not yet know enough about ",
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
      "If someone else has the better account read, could you point me to that person?",
    ],
    whyLine: [
      "The risk is sending a technically relevant example that misses what the account actually cares about now.",
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
      "I'm helping prep the ",
      v("client_name"),
      " pitch and need expert context on ",
      v("pitch_context"),
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
      "If there is someone closer to this topic, could you point me to them and say what I should ask?",
    ],
    whyLine: [
      "I want the handoff to include the right expert judgment, not just a pile of nearby documents.",
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
      "I'm helping prep the ",
      v("client_name"),
      " pitch and found possible context from ",
      v("partner_name"),
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
      "Could you send the cleanest partner-safe material or context note we can use for ",
      v("client_name"),
      "?",
    ],
    sanityCheckAsk: [
      "Could you sanity-check the sensitivity here: ",
      v("sensitivity_note"),
      "?",
    ],
    ownerIntroAsk: [
      "If someone else owns the ",
      v("partner_name"),
      " relationship, could you point me to them?",
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
      "I'm helping prep the ",
      v("client_name"),
      " pitch and have not found a strong prior proposal, comparable pitch, or obvious context owner yet.",
    ],
    knownLine: [
      "The only useful material so far is ",
      v("known_materials"),
      ", and the open gap is ",
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
      "Ask the right person for missing pitch context before creating a handoff.",
  },
  dataSourceIds: ["flowcase", "salesforce", "onedrive", "calendar"],
  industryTags: ["consulting", "tech-consulting"],
  variables: [
    { id: "recipient_name", label: "Recipient name" },
    { id: "client_name", label: "Client name" },
    { id: "pitch_context", label: "Pitch context" },
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
      "I'm helping prep the JPMC pitch and need a current account read before I send the context handoff.",
      "I have last year's implementation proposal, but I do not yet know enough about whether timeline, ownership, and integration risk are still the right concerns.",
      "Could you sanity-check whether those are still the right things for the pitch team to emphasize?",
      "I only need the practical version, not a polished write-up.",
    ],
  },
  details: {
    paragraphs: [
      "Create a targeted request when the useful pitch context is missing, stale, or owned by someone else.",
      "The format changes based on whether the user needs a prior owner, account context, expert judgment, partner context, or a next search angle.",
      "The email asks for the smallest useful answer so the pitch team does not wait on a broad research request.",
    ],
  },
  startingPointSelection: {
    kind: "guided",
    intro:
      "Choose the missing context so the email asks the right person for the smallest useful answer.",
    questions: [
      {
        id: "context_gap_source",
        title: "What context is missing?",
        helpText:
          "Choose the gap that is blocking a useful pitch handoff.",
        options: [
          { id: "prior_pitch_owner", label: "Read from a prior pitch owner" },
          { id: "account_context_owner", label: "Current account or delivery context" },
          { id: "internal_expert", label: "Expert judgment on the topic" },
          { id: "partner_ecosystem", label: "Partner or ecosystem sensitivity" },
          { id: "no_owner_found", label: "No clear owner or strong match found" },
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
