import {
  formatParagraph as paragraph,
  formatText as text,
  formatVariable as variable,
  type FormatInlineNode,
  type FormatSpreadsheetCell,
} from "$lib/features/format-starters/domain";
import type { FormatStarter, FormatStartingPoint } from "../types";
import {
  seededSpreadsheetAttachment,
  spreadsheetCell as cell,
} from "./helpers";

type InlinePart = string | FormatInlineNode;
type OwnerReferenceMode = "cced" | "optional" | "none";
type ScenarioVariant =
  | "curated"
  | "direct-docs"
  | "document-focused"
  | "broad-bundle"
  | "people-first"
  | "optional-followup";

type ScenarioDefinition = {
  id: string;
  priorityOptionId: string;
  label: string;
  title: string;
  filename: string;
  cc: readonly string[];
  ownerRoleDescription: readonly InlinePart[];
  opening: (
    ownerReference: readonly InlinePart[],
    ownerMode: OwnerReferenceMode,
  ) => readonly InlinePart[];
  curatedMaterial: readonly InlinePart[];
  directMaterial: readonly InlinePart[];
  broadMaterial: readonly InlinePart[];
  peopleMaterial: readonly InlinePart[];
  insight: readonly InlinePart[];
  curatedFollowUp: readonly InlinePart[];
  optionalFollowUp: readonly InlinePart[];
  documentCaveat: readonly InlinePart[];
  broadCaveat: readonly InlinePart[];
  peopleFollowUp: readonly InlinePart[];
  primaryContextType: readonly InlinePart[];
  supportContextType: readonly InlinePart[];
  supportWhy: readonly InlinePart[];
  supportRecommendedUse: readonly InlinePart[];
  broadContextType: readonly InlinePart[];
  broadWhy: readonly InlinePart[];
  broadRecommendedUse: readonly InlinePart[];
  peopleRecommendedUse: readonly InlinePart[];
};

const scenarioVariants: readonly ScenarioVariant[] = [
  "curated",
  "direct-docs",
  "document-focused",
  "broad-bundle",
  "people-first",
  "optional-followup",
];

const contextPackHeaderRow: readonly FormatSpreadsheetCell[] = [
  cell("Source material"),
  cell("Context type"),
  cell("Why it matters"),
  cell("Owner"),
  cell("Recommended use"),
  cell("Caveat or sensitivity"),
];

function v(variableId: string) {
  return variable(variableId);
}

function p(id: string, parts: readonly InlinePart[]) {
  return paragraph(id, parts.map((part) => (typeof part === "string" ? text(part) : part)));
}

function c(parts: readonly InlinePart[]) {
  return cell(...parts);
}

function contextPackAttachment(
  filename: string,
  rows: readonly (readonly FormatSpreadsheetCell[])[],
) {
  return seededSpreadsheetAttachment(filename, [contextPackHeaderRow, ...rows]);
}

function ownerReference(
  mode: OwnerReferenceMode,
  roleDescription: readonly InlinePart[],
): readonly InlinePart[] {
  if (mode === "cced") {
    return [v("context_owner_name"), ", CCed, ", ...roleDescription];
  }

  if (mode === "optional") {
    return [v("context_owner_name"), " ", ...roleDescription];
  }

  return [];
}

function createScenarioRules(scenario: ScenarioDefinition) {
  const answer = scenario.priorityOptionId;

  return [
    {
      id: `${scenario.id}-document-focused-people`,
      startingPointId: `${scenario.id}-document-focused`,
      answers: {
        handoff_priority: answer,
        people_handling: "document_focused",
      },
    },
    {
      id: `${scenario.id}-optional-followup`,
      startingPointId: `${scenario.id}-optional-followup`,
      answers: {
        handoff_priority: answer,
        people_handling: "optional_followups",
      },
    },
    {
      id: `${scenario.id}-people-first`,
      startingPointId: `${scenario.id}-people-first`,
      answers: {
        handoff_priority: answer,
        bundle_scope: "people_over_attachments",
      },
    },
    {
      id: `${scenario.id}-broad-bundle`,
      startingPointId: `${scenario.id}-broad-bundle`,
      answers: {
        handoff_priority: answer,
        bundle_scope: "broader_context",
      },
    },
    {
      id: `${scenario.id}-direct-docs`,
      startingPointId: `${scenario.id}-direct-docs`,
      answers: {
        handoff_priority: answer,
        bundle_scope: "direct_docs_only",
      },
    },
    {
      id: `${scenario.id}-curated`,
      startingPointId: `${scenario.id}-curated`,
      answers: { handoff_priority: answer },
    },
  ];
}

function createScenarioStartingPoints(
  scenario: ScenarioDefinition,
): FormatStartingPoint[] {
  return scenarioVariants.map((variant) => createScenarioStartingPoint(scenario, variant));
}

function createScenarioStartingPoint(
  scenario: ScenarioDefinition,
  variant: ScenarioVariant,
): FormatStartingPoint {
  return {
    id: `${scenario.id}-${variant}`,
    label: formatVariantLabel(scenario.label, variant),
    emailContent: {
      title: formatVariantTitle(scenario.title, variant),
      to: ["Pitch owner"],
      cc: formatVariantCc(scenario, variant),
      attachment: contextPackAttachment(
        formatVariantFilename(scenario.filename, variant),
        createAttachmentRows(scenario, variant),
      ),
      body: createBody(scenario, variant),
    },
  };
}

function formatVariantLabel(label: string, variant: ScenarioVariant) {
  if (variant === "curated") {
    return label;
  }

  return `${label} - ${formatVariantSuffix(variant)}`;
}

function formatVariantTitle(title: string, variant: ScenarioVariant) {
  if (variant === "curated") {
    return title;
  }

  return `${title}: ${formatVariantSuffix(variant)}`;
}

function formatVariantFilename(filename: string, variant: ScenarioVariant) {
  if (variant === "curated") {
    return filename;
  }

  return filename.replace(".xlsx", ` - ${formatVariantSuffix(variant)}.xlsx`);
}

function formatVariantSuffix(variant: ScenarioVariant) {
  switch (variant) {
    case "document-focused":
      return "document focused";
    case "direct-docs":
      return "direct docs";
    case "broad-bundle":
      return "broader bundle";
    case "people-first":
      return "people first";
    case "optional-followup":
      return "optional follow-up";
    case "curated":
      return "curated";
  }
}

function formatVariantCc(
  scenario: ScenarioDefinition,
  variant: ScenarioVariant,
) {
  if (variant === "document-focused" || variant === "optional-followup") {
    return [];
  }

  return scenario.cc;
}

function ownerModeForVariant(variant: ScenarioVariant): OwnerReferenceMode {
  if (variant === "document-focused") {
    return "none";
  }

  if (variant === "optional-followup") {
    return "optional";
  }

  return "cced";
}

function createBody(
  scenario: ScenarioDefinition,
  variant: ScenarioVariant,
) {
  const ownerMode = ownerModeForVariant(variant);
  const owner = ownerReference(ownerMode, scenario.ownerRoleDescription);

  return [
    p(`${scenario.id}-${variant}-greeting`, ["Hey ", v("recipient_name"), ","]),
    p(`${scenario.id}-${variant}-opening`, scenario.opening(owner, ownerMode)),
    p(`${scenario.id}-${variant}-material`, materialForVariant(scenario, variant)),
    p(`${scenario.id}-${variant}-insight`, scenario.insight),
    p(`${scenario.id}-${variant}-follow-up`, followUpForVariant(scenario, variant)),
  ];
}

function materialForVariant(
  scenario: ScenarioDefinition,
  variant: ScenarioVariant,
) {
  switch (variant) {
    case "direct-docs":
    case "document-focused":
      return scenario.directMaterial;
    case "broad-bundle":
      return scenario.broadMaterial;
    case "people-first":
      return scenario.peopleMaterial;
    case "optional-followup":
    case "curated":
      return scenario.curatedMaterial;
  }
}

function followUpForVariant(
  scenario: ScenarioDefinition,
  variant: ScenarioVariant,
) {
  switch (variant) {
    case "direct-docs":
      return scenario.curatedFollowUp;
    case "document-focused":
      return scenario.documentCaveat;
    case "broad-bundle":
      return scenario.broadCaveat;
    case "people-first":
      return scenario.peopleFollowUp;
    case "optional-followup":
      return scenario.optionalFollowUp;
    case "curated":
      return scenario.curatedFollowUp;
  }
}

function createAttachmentRows(
  scenario: ScenarioDefinition,
  variant: ScenarioVariant,
) {
  const primaryRow = [
    c([v("primary_context_name")]),
    c(scenario.primaryContextType),
    c([v("relevance_reason")]),
    c([v("context_owner_name")]),
    c([v("recommended_action")]),
    c([v("sensitivity_note")]),
  ];
  const supportRow = [
    c([v("attached_materials")]),
    c(scenario.supportContextType),
    c(scenario.supportWhy),
    c([v("context_owner_role")]),
    c(scenario.supportRecommendedUse),
    c([v("context_caveat")]),
  ];
  const broadRow = [
    c(["Broader context"]),
    c(scenario.broadContextType),
    c(scenario.broadWhy),
    c([v("context_owner_role")]),
    c(scenario.broadRecommendedUse),
    c([v("context_caveat")]),
  ];
  const peopleRow = [
    c([v("context_owner_name")]),
    c(["Context owner"]),
    c([v("context_owner_role")]),
    c([v("context_owner_name")]),
    c(scenario.peopleRecommendedUse),
    c([v("context_caveat")]),
  ];
  const optionalRow = [
    c([v("context_owner_name")]),
    c(["Optional follow-up"]),
    c([v("context_owner_role")]),
    c(["Not CCed"]),
    c(scenario.peopleRecommendedUse),
    c([v("context_caveat")]),
  ];

  switch (variant) {
    case "direct-docs":
    case "document-focused":
      return [primaryRow];
    case "broad-bundle":
      return [primaryRow, supportRow, broadRow];
    case "people-first":
      return [peopleRow, primaryRow];
    case "optional-followup":
      return [primaryRow, supportRow, optionalRow];
    case "curated":
      return [primaryRow, supportRow];
  }
}

const scenarioDefinitions: readonly ScenarioDefinition[] = [
  {
    id: "same-client-prior-pitch",
    priorityOptionId: "closest_prior_pitch",
    label: "Same client, prior pitch",
    title: "Same-client pitch context",
    filename: "Same client context pack.xlsx",
    cc: ["Prior pitch owner"],
    ownerRoleDescription: [
      "led a proposal to ",
      v("client_name"),
      " from our ",
      v("source_team_or_office"),
      " ",
      v("context_timeframe"),
    ],
    opening: (owner, mode) =>
      mode === "none"
        ? [
            "You're working on the ",
            v("client_name"),
            " pitch. I found a prior proposal to ",
            v("client_name"),
            " from our ",
            v("source_team_or_office"),
            " ",
            v("context_timeframe"),
            ".",
          ]
        : [
            "You're working on the ",
            v("client_name"),
            " pitch. ",
            ...owner,
            ".",
          ],
    curatedMaterial: [
      "I attached the final proposal ",
      v("context_owner_name"),
      " submitted, plus ",
      v("attached_materials"),
      " from the pursuit folder.",
    ],
    directMaterial: [
      "I kept this to the final proposal ",
      v("context_owner_name"),
      " submitted and the most relevant notes from ",
      v("attached_materials"),
      ".",
    ],
    broadMaterial: [
      "I attached the final proposal ",
      v("context_owner_name"),
      " submitted, plus the post-decision notes, supporting pursuit docs, and nearby account context from ",
      v("attached_materials"),
      ".",
    ],
    peopleMaterial: [
      "I attached the core pursuit docs, but the useful part is really ",
      v("context_owner_name"),
      "'s judgment on what still applies from the prior pitch.",
    ],
    insight: [
      "The useful context is both the proposal itself and where the client pushed back on ",
      v("client_signal"),
      ".",
    ],
    curatedFollowUp: [
      v("context_owner_name"),
      " can help judge what still applies for this pitch.",
    ],
    optionalFollowUp: [
      "Use ",
      v("context_owner_name"),
      " as an optional follow-up if the prior pushback around ",
      v("client_signal"),
      " becomes central.",
    ],
    documentCaveat: [
      "I left out weaker adjacent material so the handoff stays anchored to the prior proposal.",
    ],
    broadCaveat: [
      "The broader material is there for pattern matching, but the prior proposal and post-decision notes should carry the most weight.",
    ],
    peopleFollowUp: [
      v("context_owner_name"),
      " should be the first follow-up before reusing any prior proposal language.",
    ],
    primaryContextType: ["Prior proposal"],
    supportContextType: ["Post-decision notes and pursuit docs"],
    supportWhy: ["Shows decision feedback"],
    supportRecommendedUse: ["Review before client prep"],
    broadContextType: ["Account and pursuit context"],
    broadWhy: ["May explain what changed"],
    broadRecommendedUse: ["Use after the core proposal"],
    peopleRecommendedUse: ["Judge what still applies"],
  },
  {
    id: "same-client-adjacent-context",
    priorityOptionId: "recent_account_context",
    label: "Same client, adjacent context",
    title: "Adjacent client context",
    filename: "Adjacent client context.xlsx",
    cc: ["Account context owner"],
    ownerRoleDescription: [
      "worked with another ",
      v("client_name"),
      " team ",
      v("context_timeframe"),
      " on a related effort",
    ],
    opening: (owner, mode) =>
      mode === "none"
        ? [
            "You're working on the ",
            v("client_name"),
            " pitch. I found same-client context from a different team, not an exact prior pitch.",
          ]
        : [
            "You're working on the ",
            v("client_name"),
            " pitch. ",
            ...owner,
            ".",
          ],
    curatedMaterial: [
      "I attached ",
      v("context_owner_name"),
      "'s working notes, the account context that team used, and the delivery notes from ",
      v("attached_materials"),
      ".",
    ],
    directMaterial: [
      "I kept this to ",
      v("context_owner_name"),
      "'s working notes and the delivery notes from ",
      v("attached_materials"),
      ".",
    ],
    broadMaterial: [
      "I attached ",
      v("context_owner_name"),
      "'s working notes, the account context that team used, the delivery notes from ",
      v("attached_materials"),
      ", and recent strategy context.",
    ],
    peopleMaterial: [
      "Because this is adjacent rather than exact, ",
      v("context_owner_name"),
      "'s judgment is more useful than sending a large document bundle.",
    ],
    insight: [
      "It is not the same stakeholder group, but some of the same priorities and decision concerns may carry over: ",
      v("client_signal"),
      ".",
    ],
    curatedFollowUp: [
      v("context_owner_name"),
      " can help judge what is still relevant for this pitch.",
    ],
    optionalFollowUp: [
      "Mention ",
      v("context_owner_name"),
      " only as an optional follow-up if the adjacent account context starts to matter.",
    ],
    documentCaveat: [
      "I avoided broader account history so the email does not overstate how directly this maps to the current stakeholders.",
    ],
    broadCaveat: [
      "The broader context may help with account orientation, but treat it as directional until ",
      v("context_owner_name"),
      " confirms what still applies.",
    ],
    peopleFollowUp: [
      "Start with ",
      v("context_owner_name"),
      " before reusing the notes, because the fit depends on which client priorities carried over.",
    ],
    primaryContextType: ["Same-client account context"],
    supportContextType: ["Delivery notes and workshop notes"],
    supportWhy: ["Shows priorities that may carry over"],
    supportRecommendedUse: ["Use as directional context"],
    broadContextType: ["Recent strategy and account history"],
    broadWhy: ["Helps orient the pitch team"],
    broadRecommendedUse: ["Use for background only"],
    peopleRecommendedUse: ["Confirm what still applies"],
  },
  {
    id: "similar-client-or-work",
    priorityOptionId: "similar_client_work",
    label: "Similar client or similar work",
    title: "Comparable pitch context",
    filename: "Comparable work context.xlsx",
    cc: ["Comparable pursuit owner"],
    ownerRoleDescription: [
      "led that pursuit and can share what the client cared about most",
    ],
    opening: () => [
      "You're working on the ",
      v("client_name"),
      " pitch. I did not find a recent ",
      v("client_name"),
      " proposal, but ",
      "the ",
      v("similar_client_name"),
      " proposal from ",
      v("context_timeframe"),
      " looks like the closest match.",
    ],
    curatedMaterial: [
      "I attached ",
      v("attached_materials"),
      ": the final proposal, discovery notes, and supporting appendix.",
    ],
    directMaterial: [
      "I kept this to the closest reusable material: ",
      v("primary_context_name"),
      " and the discovery notes in ",
      v("attached_materials"),
      ".",
    ],
    broadMaterial: [
      "I attached ",
      v("attached_materials"),
      ", including the final proposal, discovery notes, appendix, and adjacent delivery context.",
    ],
    peopleMaterial: [
      "The client is different, so ",
      v("context_owner_name"),
      "'s read on what the comparable client cared about matters more than the deck alone.",
    ],
    insight: [
      "The client is different, but the problem and pitch structure are similar enough to be useful: ",
      v("client_signal"),
      ".",
    ],
    curatedFollowUp: [
      v("context_owner_name"),
      ", CCed, led that pursuit and can share what the client cared about most.",
    ],
    optionalFollowUp: [
      "Keep ",
      v("context_owner_name"),
      " as an optional follow-up if the team wants to reuse the structure directly.",
    ],
    documentCaveat: [
      "I left out looser examples so the handoff does not make a similar-client match look stronger than it is.",
    ],
    broadCaveat: [
      "The broader material is useful for patterns, but the current client is different, so reuse it selectively.",
    ],
    peopleFollowUp: [
      "Talk to ",
      v("context_owner_name"),
      " before reusing the proposal structure, especially around ",
      v("client_signal"),
      ".",
    ],
    primaryContextType: ["Comparable proposal"],
    supportContextType: ["Discovery notes and appendix"],
    supportWhy: ["Shows reusable structure"],
    supportRecommendedUse: ["Reuse selectively"],
    broadContextType: ["Adjacent delivery and proposal context"],
    broadWhy: ["May reveal transferable patterns"],
    broadRecommendedUse: ["Use for pattern matching"],
    peopleRecommendedUse: ["Explain what the client cared about"],
  },
  {
    id: "partner-ecosystem-context",
    priorityOptionId: "partner_ecosystem",
    label: "Partner or ecosystem context",
    title: "Partner ecosystem context",
    filename: "Partner context pack.xlsx",
    cc: ["Partner context owner"],
    ownerRoleDescription: [
      "worked on our prior proposal and can help separate what is still current from what has changed in the account",
    ],
    opening: () => [
      "You're working on the ",
      v("client_name"),
      " pitch.",
    ],
    curatedMaterial: [
      "I attached our prior proposal, plus a recent ",
      v("partner_name"),
      " proposal that came through the partner channel.",
    ],
    directMaterial: [
      "I kept this to the two strongest sources: our prior proposal and ",
      v("primary_context_name"),
      " from ",
      v("partner_name"),
      ".",
    ],
    broadMaterial: [
      "I attached our prior proposal, a recent ",
      v("partner_name"),
      " proposal from the partner channel, and the related alliance context in ",
      v("attached_materials"),
      ".",
    ],
    peopleMaterial: [
      "The partner material is useful, but ",
      v("context_owner_name"),
      " should sanity-check what is current before the team uses it.",
    ],
    insight: [
      "The ",
      v("partner_name"),
      " material may help because it frames a similar problem from a different angle: ",
      v("client_signal"),
      ".",
    ],
    curatedFollowUp: [
      v("context_owner_name"),
      ", CCed, worked on our prior proposal and can help separate what is still current from what has changed in the account.",
    ],
    optionalFollowUp: [
      "Keep ",
      v("context_owner_name"),
      " as an optional follow-up before reusing any partner-sourced framing.",
    ],
    documentCaveat: [
      "I left out weaker ecosystem material so the handoff stays grounded in the prior proposal and partner-channel source.",
    ],
    broadCaveat: [
      "The alliance context is useful background, but partner material may need a sensitivity check before reuse.",
    ],
    peopleFollowUp: [
      "Start with ",
      v("context_owner_name"),
      " so the team can separate current account facts from stale ecosystem signal.",
    ],
    primaryContextType: ["Partner-channel material"],
    supportContextType: ["Prior proposal"],
    supportWhy: ["Frames a similar problem"],
    supportRecommendedUse: ["Validate before reuse"],
    broadContextType: ["Alliance and ecosystem context"],
    broadWhy: ["May reveal partner angle"],
    broadRecommendedUse: ["Use after sensitivity review"],
    peopleRecommendedUse: ["Check what is current"],
  },
  {
    id: "internal-expert-limited-docs",
    priorityOptionId: "internal_experts",
    label: "Internal expert, limited documents",
    title: "Internal expert context",
    filename: "Internal expert context.xlsx",
    cc: ["Internal expert"],
    ownerRoleDescription: [
      "has worked with the ",
      v("client_name"),
      " team on related work before",
    ],
    opening: (owner, mode) =>
      mode === "none"
        ? [
            "You're working on the ",
            v("client_name"),
            " pitch. I did not find a recent final proposal, but there is useful expert context.",
          ]
        : [
            "You're working on the ",
            v("client_name"),
            " pitch. I did not find a recent final proposal, but ",
            ...owner,
            ".",
          ],
    curatedMaterial: [
      "I attached ",
      v("context_owner_name"),
      "'s notes from the last workshop and the short context deck shared with the client.",
    ],
    directMaterial: [
      "I kept this to ",
      v("primary_context_name"),
      " and the short context deck in ",
      v("attached_materials"),
      ".",
    ],
    broadMaterial: [
      "I attached ",
      v("attached_materials"),
      ", including workshop notes, the short context deck, and nearby account notes.",
    ],
    peopleMaterial: [
      "The best context is the person, not the artifacts: ",
      v("context_owner_name"),
      " can explain what the client was focused on at the time.",
    ],
    insight: [
      "The notes may be more useful than a full proposal because they show what the client was focused on: ",
      v("client_signal"),
      ".",
    ],
    curatedFollowUp: [
      v("context_owner_name"),
      " can help decide which examples to reuse.",
    ],
    optionalFollowUp: [
      "Mention ",
      v("context_owner_name"),
      " as an optional follow-up if the team needs more color than the notes provide.",
    ],
    documentCaveat: [
      "I avoided adding stale or weak documents because there is no recent final proposal to anchor them.",
    ],
    broadCaveat: [
      "The broader account notes may help with orientation, but the workshop notes should carry more weight.",
    ],
    peopleFollowUp: [
      "Start with ",
      v("context_owner_name"),
      " before reusing any examples, because the documents are limited.",
    ],
    primaryContextType: ["Workshop notes"],
    supportContextType: ["Short context deck"],
    supportWhy: ["Shows what the client focused on"],
    supportRecommendedUse: ["Use before drafting examples"],
    broadContextType: ["Nearby account notes"],
    broadWhy: ["May add background"],
    broadRecommendedUse: ["Use for orientation"],
    peopleRecommendedUse: ["Decide which examples to reuse"],
  },
  {
    id: "limited-context",
    priorityOptionId: "limited_context",
    label: "No relevant prior context",
    title: "Limited context handoff",
    filename: "Limited context pack.xlsx",
    cc: [],
    ownerRoleDescription: ["owns the next search step"],
    opening: () => [
      "You're working on the ",
      v("client_name"),
      " pitch. I did not find a prior ",
      v("client_name"),
      " proposal, a strong comparable pitch, or anyone with recent account context.",
    ],
    curatedMaterial: [
      "I attached ",
      v("attached_materials"),
      ", which may still be useful as starting points.",
    ],
    directMaterial: [
      "I kept this deliberately thin: ",
      v("primary_context_name"),
      " and ",
      v("attached_materials"),
      " are useful starting points, but they are not client-specific.",
    ],
    broadMaterial: [
      "I attached ",
      v("attached_materials"),
      ", but I did not include weak lookalike examples that might make the context seem stronger than it is.",
    ],
    peopleMaterial: [
      "I did not find a relevant expert to lead with, so the honest handoff is the checklist plus a targeted next search angle.",
    ],
    insight: [
      "I'll keep looking for more specific context, but I did not want to send a weak match and make it look more relevant than it is.",
    ],
    curatedFollowUp: [
      "Reply here if there is a particular angle you want me to search for, such as ",
      v("next_search_angle"),
      ".",
    ],
    optionalFollowUp: [
      "There is no context owner to CC yet; reply with a search angle like ",
      v("next_search_angle"),
      " if you want a deeper pass.",
    ],
    documentCaveat: [
      "I avoided weak matches so the recipient can treat this as prep material, not prior client context.",
    ],
    broadCaveat: [
      "The broader bundle is intentionally generic; anything more specific should be treated as unverified until a stronger match appears.",
    ],
    peopleFollowUp: [
      "Use this to decide the next search angle rather than to reuse prior work directly.",
    ],
    primaryContextType: ["Standard pitch prep"],
    supportContextType: ["General proposal template"],
    supportWhy: ["No stronger match found"],
    supportRecommendedUse: ["Use as starting point"],
    broadContextType: ["Generic supporting material"],
    broadWhy: ["Avoids overstating weak evidence"],
    broadRecommendedUse: ["Search again if the angle changes"],
    peopleRecommendedUse: ["Define the next search angle"],
  },
];

export const formatStarter = {
  slug: "gathering-context",
  defaultPresentation: {
    title: "Gathering context",
    description:
      "Send consultants the prior work, experts, and caveats they need before a client pitch.",
  },
  dataSourceIds: ["flowcase", "salesforce", "onedrive", "calendar"],
  industryTags: ["consulting", "tech-consulting"],
  variables: [
    { id: "recipient_name", label: "Recipient name" },
    { id: "client_name", label: "Client name" },
    { id: "context_owner_name", label: "Context owner name" },
    { id: "context_owner_role", label: "Context owner role" },
    { id: "source_team_or_office", label: "Source team or office" },
    { id: "context_timeframe", label: "Context timeframe" },
    { id: "primary_context_name", label: "Primary context name" },
    { id: "attached_materials", label: "Attached materials" },
    { id: "relevance_reason", label: "Relevance reason" },
    { id: "client_signal", label: "Client signal" },
    { id: "context_caveat", label: "Context caveat" },
    { id: "recommended_action", label: "Recommended action" },
    { id: "similar_client_name", label: "Similar client name" },
    { id: "partner_name", label: "Partner name" },
    { id: "sensitivity_note", label: "Sensitivity note" },
    { id: "next_search_angle", label: "Next search angle" },
  ],
  sampleEmail: {
    subject: "Context for JPMC pitch",
    paragraphs: [
      "Hey Alex,",
      "You're working on the JPMC pitch. Jack London, CCed, led a proposal to JPMC from our NYC office last year.",
      "I attached the final proposal Jack submitted, plus the post-decision notes and a few supporting docs from the pursuit folder.",
      "The useful context is both the proposal itself and where the client pushed back on timeline, ownership, and implementation risk.",
      "Jack can help you judge what still applies for this pitch.",
    ],
  },
  details: {
    paragraphs: [
      "Create a context handoff email for IT consulting pitches.",
      "The format changes based on whether the handoff should lead with prior work, adjacent account context, comparable clients, partner material, internal experts, or an honest limited-context fallback.",
      "The attachment organizes source material, relevance, owners, caveats, and recommended next steps.",
    ],
  },
  startingPointSelection: {
    kind: "guided",
    intro:
      "Choose the strongest available context so the handoff starts from the right source material.",
    questions: [
      {
        id: "handoff_priority",
        title: "What should this handoff prioritize?",
        helpText:
          "Choose the strongest example pattern available for this pitch.",
        options: [
          { id: "closest_prior_pitch", label: "Closest prior pitch or proposal" },
          {
            id: "recent_account_context",
            label: "Recent account or delivery context",
          },
          {
            id: "internal_experts",
            label: "Internal experts who know the client",
          },
          {
            id: "similar_client_work",
            label: "Comparable work from similar clients",
          },
          { id: "partner_ecosystem", label: "Partner or ecosystem context" },
          { id: "limited_context", label: "No strong prior context found" },
        ],
      },
      {
        id: "bundle_scope",
        title: "How broad should the context bundle be?",
        helpText:
          "Choose how selective the handoff should be with documents and attachments.",
        options: [
          {
            id: "direct_docs_only",
            label: "Only the most directly relevant docs",
          },
          { id: "curated_bundle", label: "A small curated bundle" },
          {
            id: "broader_context",
            label: "Include broader context if it might help",
          },
          {
            id: "people_over_attachments",
            label: "Prefer people/context over attachments",
          },
        ],
      },
      {
        id: "people_handling",
        title: "How should people with relevant context be handled?",
        helpText:
          "Choose whether context owners should be copied directly or only mentioned.",
        options: [
          { id: "cc_by_default", label: "CC them by default" },
          { id: "optional_followups", label: "Mention them as optional follow-ups" },
          {
            id: "cc_prior_owner_only",
            label: "Only CC if they owned the prior work",
          },
          { id: "document_focused", label: "Keep the email document-focused" },
        ],
      },
    ],
    rules: [
      ...scenarioDefinitions.flatMap(createScenarioRules),
      {
        id: "default",
        startingPointId: "limited-context-curated",
        answers: {},
      },
    ],
  },
  startingPoints: scenarioDefinitions.flatMap(createScenarioStartingPoints),
  showInGallery: true,
  sortOrder: 26,
  status: "active",
} satisfies FormatStarter;
