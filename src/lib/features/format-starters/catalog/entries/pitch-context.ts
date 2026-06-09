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
  slug: "pitch-context",
  defaultPresentation: {
    title: "Context for pitches",
    description: "Give consultants the context they need to pitch clients",
  },
  dataSourceIds: ["flowcase", "salesforce", "onedrive"],
  industryTags: ["consulting"],
  variables: [
    { id: "consultant_name", label: "Consultant name" },
    { id: "client_company", label: "Client company" },
    { id: "pitch_owner", label: "Pitch owner" },
    { id: "prior_pitch_owner", label: "Prior pitch owner" },
    { id: "prior_pitch_date", label: "Prior pitch date" },
    { id: "proposal_topic", label: "Proposal topic" },
    { id: "relevant_proposal", label: "Relevant proposal" },
    { id: "source_material", label: "Source material" },
    { id: "partner_firm", label: "Partner firm" },
    { id: "competitor_context", label: "Competitor context" },
    { id: "decision_maker", label: "Decision maker" },
    { id: "meeting_date", label: "Meeting date" },
    { id: "recommended_angle", label: "Recommended angle" },
    { id: "follow_up_owner", label: "Follow-up owner" },
  ],
  sampleEmail: {
    subject: "Context for JPMC pitch",
    paragraphs: [
      "Hey Alex,",
      "You're working the pitch for JPMC, and Jack London in our NYC office pitched them last year.",
      "I attached the final proposal Jack submitted, plus a few related files that may help frame your approach.",
      "There is also a proposal our partner Thoughtworks submitted to them last month.",
      "Reply here if you want us to pull more context before the meeting.",
    ],
  },
  details: {
    paragraphs: [
      "Create a pitch-context email with relevant prior proposals, relationship context, and recommended angles.",
      "The attachment organizes source material, reusable proof points, and open questions.",
    ],
  },
  startingPointSelection: {
    kind: "guided",
    intro:
      "Choose the pitch situation so the context package starts with the right source material.",
    questions: [
      {
        id: "pitch_stage",
        title: "Where is the pitch?",
        helpText: "Dummy help text for choosing the pitch stage.",
        options: [
          { id: "early_context", label: "Early context" },
          { id: "proposal_draft", label: "Proposal draft" },
          { id: "final_prep", label: "Final prep" },
        ],
      },
      {
        id: "context_gap",
        title: "What context matters most?",
        helpText: "Dummy help text for choosing the context gap.",
        options: [
          { id: "prior_work", label: "Prior work" },
          { id: "competitor", label: "Competitor view" },
          { id: "executive", label: "Executive angle" },
        ],
      },
      {
        id: "audience",
        title: "Who needs the context?",
        helpText: "Dummy help text for choosing the audience.",
        options: [
          { id: "pitch_owner", label: "Pitch owner" },
          { id: "partner", label: "Partner" },
          { id: "team", label: "Pitch team" },
        ],
      },
    ],
    rules: [
      {
        id: "competitor-context",
        startingPointId: "competitor-context",
        answers: { context_gap: "competitor" },
      },
      {
        id: "executive-final-prep",
        startingPointId: "executive-context",
        answers: { pitch_stage: "final_prep", context_gap: "executive" },
      },
      {
        id: "partner-executive",
        startingPointId: "executive-context",
        answers: { audience: "partner", context_gap: "executive" },
      },
      {
        id: "proposal-draft",
        startingPointId: "proposal-context",
        answers: { pitch_stage: "proposal_draft" },
      },
      { id: "default", startingPointId: "proposal-context", answers: {} },
    ],
  },
  startingPoints: [
    {
      id: "proposal-context",
      label: "Proposal context",
      emailContent: {
        title: "Pitch context",
        to: ["Pitch owner"],
        cc: ["Pitch team"],
        attachment: seededSpreadsheetAttachment("Pitch context pack.xlsx", [
          [
            cell("Source"),
            cell("Why it matters"),
            cell("Owner"),
            cell("Recommended use"),
          ],
          [
            cell(variable("relevant_proposal")),
            cell(variable("proposal_topic")),
            cell(variable("prior_pitch_owner")),
            cell(variable("recommended_angle")),
          ],
          [
            cell(variable("source_material")),
            cell(variable("client_company"), " context"),
            cell(variable("pitch_owner")),
            cell("Review before ", variable("meeting_date")),
          ],
        ]),
        body: [
          paragraph("proposal-greeting", [
            text("Hi "),
            variable("consultant_name"),
            text(","),
          ]),
          paragraph("proposal-summary", [
            text("Sharing context for the "),
            variable("client_company"),
            text(" pitch. "),
            variable("prior_pitch_owner"),
            text(" worked on a related proposal, "),
            variable("relevant_proposal"),
            text("."),
          ]),
          paragraph("proposal-angle", [
            text("The most reusable angle is "),
            variable("recommended_angle"),
            text(", with supporting material in "),
            variable("source_material"),
            text("."),
          ]),
        ],
      },
    },
    {
      id: "competitor-context",
      label: "Competitor context",
      emailContent: {
        title: "Competitor pitch context",
        to: ["Pitch owner"],
        cc: ["Partner"],
        attachment: seededSpreadsheetAttachment("Competitor context.xlsx", [
          [
            cell("Client"),
            cell("Competitor or partner"),
            cell("Source material"),
            cell("Pitch angle"),
          ],
          [
            cell(variable("client_company")),
            cell(variable("partner_firm")),
            cell(variable("source_material")),
            cell(variable("competitor_context")),
          ],
          [
            cell("Prior proposal"),
            cell(variable("relevant_proposal")),
            cell(variable("prior_pitch_date")),
            cell(variable("recommended_angle")),
          ],
        ]),
        body: [
          paragraph("competitor-greeting", [
            text("Hi "),
            variable("consultant_name"),
            text(","),
          ]),
          paragraph("competitor-summary", [
            text("For the "),
            variable("client_company"),
            text(" pitch, the useful competitor context is "),
            variable("competitor_context"),
            text("."),
          ]),
          paragraph("competitor-source", [
            text("I included "),
            variable("source_material"),
            text(" and the prior proposal "),
            variable("relevant_proposal"),
            text(" so you can compare positioning."),
          ]),
        ],
      },
    },
    {
      id: "executive-context",
      label: "Executive context",
      emailContent: {
        title: "Executive pitch context",
        to: ["Partner"],
        cc: ["Pitch owner"],
        attachment: seededSpreadsheetAttachment("Executive context.xlsx", [
          [
            cell("Decision maker"),
            cell("Known priority"),
            cell("Proof point"),
            cell("Follow-up owner"),
          ],
          [
            cell(variable("decision_maker")),
            cell(variable("proposal_topic")),
            cell(variable("relevant_proposal")),
            cell(variable("follow_up_owner")),
          ],
          [
            cell("Meeting date"),
            cell(variable("meeting_date")),
            cell(variable("source_material")),
            cell(variable("pitch_owner")),
          ],
        ]),
        body: [
          paragraph("executive-greeting", [
            text("Hi "),
            variable("consultant_name"),
            text(","),
          ]),
          paragraph("executive-summary", [
            text("Ahead of the "),
            variable("client_company"),
            text(" meeting with "),
            variable("decision_maker"),
            text(", the strongest executive angle is "),
            variable("recommended_angle"),
            text("."),
          ]),
          paragraph("executive-follow-up", [
            variable("follow_up_owner"),
            text(" can pull more detail from "),
            variable("source_material"),
            text(" before "),
            variable("meeting_date"),
            text("."),
          ]),
        ],
      },
    },
  ],
  showInGallery: true,
  sortOrder: 12,
  status: "active",
} satisfies FormatStarter;
