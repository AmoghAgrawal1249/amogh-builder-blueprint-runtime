import {
  formatParagraph as paragraph,
  formatText as text,
  formatVariable as variable,
} from "$lib/features/format-starters/domain";
import type { FormatStarter } from "../types";
import {
  seededSpreadsheetAttachment,
  spreadsheetCell as cell,
} from "./helpers";

export const formatStarter = {
  slug: "gathering-context",
  defaultPresentation: {
    title: "Gathering context",
    description:
      "Send consultants the prior work, experts, and caveats they need before a client pitch.",
  },
  dataSourceIds: ["flowcase", "salesforce", "onedrive", "calendar"],
  industryTags: ["tech-consulting"],
  variables: [
    { id: "recipient_name", label: "Recipient name" },
    { id: "client_name", label: "Client name" },
    { id: "opportunity_name", label: "Opportunity name" },
    { id: "context_owner_name", label: "Context owner name" },
    { id: "context_owner_role", label: "Context owner role" },
    { id: "primary_context_name", label: "Primary context name" },
    { id: "primary_context_type", label: "Primary context type" },
    { id: "attached_materials", label: "Attached materials" },
    { id: "relevance_reason", label: "Relevance reason" },
    { id: "context_caveat", label: "Context caveat" },
    { id: "recommended_action", label: "Recommended action" },
    { id: "similar_client_name", label: "Similar client name" },
    { id: "partner_name", label: "Partner name" },
    { id: "sensitivity_note", label: "Sensitivity note" },
  ],
  sampleEmail: {
    subject: "Context for JPMC pitch",
    paragraphs: [
      "Hi Alex,",
      "You are working on the JPMC pitch, and Jack London led a prior proposal for them last year.",
      "I attached the final proposal, post-decision notes, and supporting pursuit docs.",
      "The most useful context is where the client pushed back on timeline, ownership, and implementation risk.",
      "Jack is copied here and can help judge what still applies.",
    ],
  },
  details: {
    paragraphs: [
      "Create a context handoff email for IT consulting pitches.",
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
          "Choose the strongest kind of context available for this pitch.",
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
          "Choose how selective the handoff should be with supporting material.",
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
          "Choose whether the email should directly involve context owners.",
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
      {
        id: "same-client-prior-pitch",
        startingPointId: "same-client-prior-pitch",
        answers: { handoff_priority: "closest_prior_pitch" },
      },
      {
        id: "same-client-adjacent-context",
        startingPointId: "same-client-adjacent-context",
        answers: { handoff_priority: "recent_account_context" },
      },
      {
        id: "internal-expert-limited-docs",
        startingPointId: "internal-expert-limited-docs",
        answers: { handoff_priority: "internal_experts" },
      },
      {
        id: "similar-client-or-work",
        startingPointId: "similar-client-or-work",
        answers: { handoff_priority: "similar_client_work" },
      },
      {
        id: "partner-ecosystem-context",
        startingPointId: "partner-ecosystem-context",
        answers: { handoff_priority: "partner_ecosystem" },
      },
      {
        id: "limited-context",
        startingPointId: "limited-context",
        answers: { handoff_priority: "limited_context" },
      },
      {
        id: "default",
        startingPointId: "same-client-prior-pitch",
        answers: {},
      },
    ],
  },
  startingPoints: [
    {
      id: "same-client-prior-pitch",
      label: "Same client, prior pitch",
      emailContent: {
        title: "Same-client pitch context",
        to: ["Pitch owner"],
        cc: ["Prior pitch owner"],
        attachment: seededSpreadsheetAttachment("Same client context pack.xlsx", [
          [
            cell("Source material"),
            cell("Context type"),
            cell("Why it matters"),
            cell("Owner"),
            cell("Recommended use"),
            cell("Caveat or sensitivity"),
          ],
          [
            cell(variable("primary_context_name")),
            cell(variable("primary_context_type")),
            cell(variable("relevance_reason")),
            cell(variable("context_owner_name")),
            cell(variable("recommended_action")),
            cell(variable("sensitivity_note")),
          ],
          [
            cell(variable("attached_materials")),
            cell("Same client history"),
            cell("Prior proposal feedback"),
            cell(variable("context_owner_role")),
            cell("Review before client prep"),
            cell(variable("context_caveat")),
          ],
        ]),
        body: [
          paragraph("same-client-greeting", [
            text("Hi "),
            variable("recipient_name"),
            text(","),
          ]),
          paragraph("same-client-summary", [
            text("Sharing context for the "),
            variable("opportunity_name"),
            text(" pitch at "),
            variable("client_name"),
            text(". "),
            variable("context_owner_name"),
            text(" worked on "),
            variable("primary_context_name"),
            text(" and can help judge what still applies."),
          ]),
          paragraph("same-client-materials", [
            text("I attached "),
            variable("attached_materials"),
            text(" because "),
            variable("relevance_reason"),
            text("."),
          ]),
          paragraph("same-client-next-step", [
            text("Use this to "),
            variable("recommended_action"),
            text(". The main caveat is "),
            variable("context_caveat"),
            text("."),
          ]),
        ],
      },
    },
    {
      id: "same-client-adjacent-context",
      label: "Same client, adjacent context",
      emailContent: {
        title: "Adjacent client context",
        to: ["Pitch owner"],
        cc: ["Account team"],
        attachment: seededSpreadsheetAttachment("Adjacent client context.xlsx", [
          [
            cell("Source material"),
            cell("Context type"),
            cell("Why it matters"),
            cell("Owner"),
            cell("Recommended use"),
            cell("Caveat or sensitivity"),
          ],
          [
            cell(variable("primary_context_name")),
            cell(variable("primary_context_type")),
            cell(variable("relevance_reason")),
            cell(variable("context_owner_name")),
            cell(variable("recommended_action")),
            cell(variable("context_caveat")),
          ],
          [
            cell(variable("attached_materials")),
            cell("Adjacent account context"),
            cell("Client priorities may carry over"),
            cell(variable("context_owner_role")),
            cell("Use as directional context"),
            cell(variable("sensitivity_note")),
          ],
        ]),
        body: [
          paragraph("adjacent-greeting", [
            text("Hi "),
            variable("recipient_name"),
            text(","),
          ]),
          paragraph("adjacent-summary", [
            text("I found related context for "),
            variable("client_name"),
            text(" that may help with "),
            variable("opportunity_name"),
            text(". It is not the same stakeholder group, but it captures useful account context."),
          ]),
          paragraph("adjacent-materials", [
            text("The best source is "),
            variable("primary_context_name"),
            text(", with "),
            variable("attached_materials"),
            text(" included for support."),
          ]),
          paragraph("adjacent-next-step", [
            variable("context_owner_name"),
            text(" can help separate what is still relevant. I would use this to "),
            variable("recommended_action"),
            text("."),
          ]),
        ],
      },
    },
    {
      id: "similar-client-or-work",
      label: "Similar client or similar work",
      emailContent: {
        title: "Comparable pitch context",
        to: ["Pitch owner"],
        cc: ["Pursuit team"],
        attachment: seededSpreadsheetAttachment("Comparable work context.xlsx", [
          [
            cell("Source material"),
            cell("Context type"),
            cell("Why it matters"),
            cell("Owner"),
            cell("Recommended use"),
            cell("Caveat or sensitivity"),
          ],
          [
            cell(variable("primary_context_name")),
            cell("Comparable work for ", variable("similar_client_name")),
            cell(variable("relevance_reason")),
            cell(variable("context_owner_name")),
            cell(variable("recommended_action")),
            cell(variable("context_caveat")),
          ],
          [
            cell(variable("attached_materials")),
            cell(variable("primary_context_type")),
            cell("Closest available pattern"),
            cell(variable("context_owner_role")),
            cell("Reuse selectively"),
            cell(variable("sensitivity_note")),
          ],
        ]),
        body: [
          paragraph("similar-greeting", [
            text("Hi "),
            variable("recipient_name"),
            text(","),
          ]),
          paragraph("similar-summary", [
            text("I did not find a strong same-client pitch for "),
            variable("client_name"),
            text(", but "),
            variable("primary_context_name"),
            text(" from "),
            variable("similar_client_name"),
            text(" is the closest match."),
          ]),
          paragraph("similar-materials", [
            text("I attached "),
            variable("attached_materials"),
            text(" because "),
            variable("relevance_reason"),
            text("."),
          ]),
          paragraph("similar-next-step", [
            text("Use it to "),
            variable("recommended_action"),
            text(", with this caveat: "),
            variable("context_caveat"),
            text("."),
          ]),
        ],
      },
    },
    {
      id: "partner-ecosystem-context",
      label: "Partner or ecosystem context",
      emailContent: {
        title: "Partner ecosystem context",
        to: ["Pitch owner"],
        cc: ["Partner lead"],
        attachment: seededSpreadsheetAttachment("Partner context pack.xlsx", [
          [
            cell("Source material"),
            cell("Context type"),
            cell("Why it matters"),
            cell("Owner"),
            cell("Recommended use"),
            cell("Caveat or sensitivity"),
          ],
          [
            cell(variable("primary_context_name")),
            cell("Partner context from ", variable("partner_name")),
            cell(variable("relevance_reason")),
            cell(variable("context_owner_name")),
            cell(variable("recommended_action")),
            cell(variable("sensitivity_note")),
          ],
          [
            cell(variable("attached_materials")),
            cell(variable("primary_context_type")),
            cell("Ecosystem signal"),
            cell(variable("context_owner_role")),
            cell("Validate before reuse"),
            cell(variable("context_caveat")),
          ],
        ]),
        body: [
          paragraph("partner-greeting", [
            text("Hi "),
            variable("recipient_name"),
            text(","),
          ]),
          paragraph("partner-summary", [
            text("For the "),
            variable("client_name"),
            text(" pitch, the most useful ecosystem signal is from "),
            variable("partner_name"),
            text("."),
          ]),
          paragraph("partner-materials", [
            text("I included "),
            variable("primary_context_name"),
            text(" and "),
            variable("attached_materials"),
            text(" because "),
            variable("relevance_reason"),
            text("."),
          ]),
          paragraph("partner-next-step", [
            variable("context_owner_name"),
            text(" can confirm what is current. The safe next step is to "),
            variable("recommended_action"),
            text("."),
          ]),
        ],
      },
    },
    {
      id: "internal-expert-limited-docs",
      label: "Internal expert, limited documents",
      emailContent: {
        title: "Internal expert context",
        to: ["Pitch owner"],
        cc: ["Context owner"],
        attachment: seededSpreadsheetAttachment("Internal expert context.xlsx", [
          [
            cell("Source material"),
            cell("Context type"),
            cell("Why it matters"),
            cell("Owner"),
            cell("Recommended use"),
            cell("Caveat or sensitivity"),
          ],
          [
            cell(variable("primary_context_name")),
            cell(variable("primary_context_type")),
            cell(variable("relevance_reason")),
            cell(variable("context_owner_name")),
            cell(variable("recommended_action")),
            cell(variable("context_caveat")),
          ],
          [
            cell(variable("attached_materials")),
            cell("Expert-led context"),
            cell("Documents are limited"),
            cell(variable("context_owner_role")),
            cell("Follow up directly"),
            cell(variable("sensitivity_note")),
          ],
        ]),
        body: [
          paragraph("expert-greeting", [
            text("Hi "),
            variable("recipient_name"),
            text(","),
          ]),
          paragraph("expert-summary", [
            text("I did not find a strong final proposal for "),
            variable("client_name"),
            text(", but "),
            variable("context_owner_name"),
            text(" has relevant context as "),
            variable("context_owner_role"),
            text("."),
          ]),
          paragraph("expert-materials", [
            text("I attached "),
            variable("attached_materials"),
            text(", especially "),
            variable("primary_context_name"),
            text(", because "),
            variable("relevance_reason"),
            text("."),
          ]),
          paragraph("expert-next-step", [
            text("The best next step is to "),
            variable("recommended_action"),
            text(". The main limitation is "),
            variable("context_caveat"),
            text("."),
          ]),
        ],
      },
    },
    {
      id: "limited-context",
      label: "No relevant prior context",
      emailContent: {
        title: "Limited context handoff",
        to: ["Pitch owner"],
        cc: ["Pursuit team"],
        attachment: seededSpreadsheetAttachment("Limited context pack.xlsx", [
          [
            cell("Source material"),
            cell("Context type"),
            cell("Why it matters"),
            cell("Owner"),
            cell("Recommended use"),
            cell("Caveat or sensitivity"),
          ],
          [
            cell(variable("primary_context_name")),
            cell(variable("primary_context_type")),
            cell("Standard prep support"),
            cell(variable("context_owner_name")),
            cell(variable("recommended_action")),
            cell(variable("context_caveat")),
          ],
          [
            cell(variable("attached_materials")),
            cell("General template"),
            cell("No stronger match found"),
            cell(variable("context_owner_role")),
            cell("Use as a starting point"),
            cell(variable("sensitivity_note")),
          ],
        ]),
        body: [
          paragraph("limited-greeting", [
            text("Hi "),
            variable("recipient_name"),
            text(","),
          ]),
          paragraph("limited-summary", [
            text("I did not find a meaningful prior proposal, adjacent account context, similar-client pitch, partner signal, or internal expert for "),
            variable("client_name"),
            text("."),
          ]),
          paragraph("limited-materials", [
            text("Rather than send a weak match, I attached "),
            variable("attached_materials"),
            text(" and "),
            variable("primary_context_name"),
            text(" as standard prep material."),
          ]),
          paragraph("limited-next-step", [
            text("Use this to "),
            variable("recommended_action"),
            text(". I will avoid overstating the evidence; the current caveat is "),
            variable("context_caveat"),
            text("."),
          ]),
        ],
      },
    },
  ],
  showInGallery: true,
  sortOrder: 26,
  status: "active",
} satisfies FormatStarter;
