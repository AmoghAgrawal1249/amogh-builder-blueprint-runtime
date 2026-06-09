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
  slug: "finance-whitespace-analysis",
  defaultPresentation: {
    title: "Coverage whitespace",
    description: "Send bankers focused next-best-action ideas for covered accounts",
  },
  dataSourceIds: ["bloomberg", "navatar", "onedrive"],
  industryTags: ["finance"],
  variables: [
    { id: "banker_name", label: "Banker name" },
    { id: "client_company", label: "Client company" },
    { id: "coverage_owner", label: "Coverage owner" },
    { id: "product_specialist", label: "Product specialist" },
    { id: "relationship_context", label: "Relationship context" },
    { id: "trigger_event", label: "Trigger event" },
    { id: "recommended_idea", label: "Recommended idea" },
    { id: "comparable_company", label: "Comparable company" },
    { id: "supporting_material", label: "Supporting material" },
    { id: "next_step", label: "Next step" },
    { id: "next_step_date", label: "Next step date" },
    { id: "open_question", label: "Open question" },
  ],
  sampleEmail: {
    subject: "Coverage ideas for Northstar Renewables",
    paragraphs: [
      "Hi Maya,",
      "Attached is a short whitespace view for Northstar Renewables.",
      "The strongest idea is a refinancing conversation tied to their 2027 maturity, with DCM and rates coverage looped in.",
      "I included the Bloomberg comps, recent meeting notes, and the relationship context from Navatar so you can decide whether to reach out this week.",
    ],
  },
  details: {
    paragraphs: [
      "Create a coverage-whitespace email that turns account data into a specific banker action.",
      "The attachment organizes triggers, comparable deals, product owners, and open questions.",
    ],
  },
  startingPointSelection: {
    kind: "guided",
    intro:
      "Choose the account situation so the coverage idea starts with the right context.",
    questions: [
      {
        id: "coverage_situation",
        title: "What triggered the idea?",
        helpText: "Dummy help text for choosing the coverage trigger.",
        options: [
          { id: "market_event", label: "Market event" },
          { id: "portfolio_gap", label: "Portfolio gap" },
          { id: "relationship_review", label: "Relationship review" },
        ],
      },
      {
        id: "product_area",
        title: "Which team should act?",
        helpText: "Dummy help text for choosing the acting team.",
        options: [
          { id: "dcm", label: "Debt capital markets" },
          { id: "mna", label: "M&A" },
          { id: "treasury", label: "Treasury" },
        ],
      },
      {
        id: "recipient",
        title: "Who needs the email?",
        helpText: "Dummy help text for choosing the recipient.",
        options: [
          { id: "coverage_banker", label: "Coverage banker" },
          { id: "product_specialist", label: "Product specialist" },
          { id: "team", label: "Account team" },
        ],
      },
    ],
    rules: [
      {
        id: "market-dcm",
        startingPointId: "refinancing-idea",
        answers: { coverage_situation: "market_event", product_area: "dcm" },
      },
      {
        id: "portfolio-gap",
        startingPointId: "mandate-expansion",
        answers: { coverage_situation: "portfolio_gap" },
      },
      {
        id: "product-recipient",
        startingPointId: "specialist-handoff",
        answers: { recipient: "product_specialist" },
      },
      {
        id: "treasury-specialist",
        startingPointId: "specialist-handoff",
        answers: { product_area: "treasury" },
      },
      { id: "default", startingPointId: "refinancing-idea", answers: {} },
    ],
  },
  startingPoints: [
    {
      id: "refinancing-idea",
      label: "Refinancing idea",
      emailContent: {
        title: "Coverage whitespace idea",
        to: ["Coverage banker"],
        cc: ["Product specialist"],
        attachment: seededSpreadsheetAttachment("Coverage whitespace.xlsx", [
          [
            cell("Client"),
            cell("Trigger"),
            cell("Recommended idea"),
            cell("Owner"),
          ],
          [
            cell(variable("client_company")),
            cell(variable("trigger_event")),
            cell(variable("recommended_idea")),
            cell(variable("coverage_owner")),
          ],
          [
            cell("Comparable"),
            cell(variable("comparable_company")),
            cell(variable("supporting_material")),
            cell(variable("product_specialist")),
          ],
        ]),
        body: [
          paragraph("refinancing-greeting", [
            text("Hi "),
            variable("banker_name"),
            text(","),
          ]),
          paragraph("refinancing-summary", [
            text("Sharing a coverage idea for "),
            variable("client_company"),
            text(" based on "),
            variable("trigger_event"),
            text("."),
          ]),
          paragraph("refinancing-action", [
            text("The recommended angle is "),
            variable("recommended_idea"),
            text(", supported by "),
            variable("supporting_material"),
            text(" and the comparable "),
            variable("comparable_company"),
            text("."),
          ]),
        ],
      },
    },
    {
      id: "mandate-expansion",
      label: "Mandate expansion",
      emailContent: {
        title: "Mandate expansion opportunity",
        to: ["Coverage banker"],
        cc: ["Account team"],
        attachment: seededSpreadsheetAttachment("Mandate expansion.xlsx", [
          [cell("Current relationship"), cell("Gap"), cell("Next step"), cell("Date")],
          [
            cell(variable("relationship_context")),
            cell(variable("recommended_idea")),
            cell(variable("next_step")),
            cell(variable("next_step_date")),
          ],
          [
            cell("Open question"),
            cell(variable("open_question")),
            cell(variable("coverage_owner")),
            cell(variable("product_specialist")),
          ],
        ]),
        body: [
          paragraph("mandate-greeting", [
            text("Hi "),
            variable("banker_name"),
            text(","),
          ]),
          paragraph("mandate-summary", [
            text("The relationship context for "),
            variable("client_company"),
            text(" suggests an expansion opportunity: "),
            variable("recommended_idea"),
            text("."),
          ]),
          paragraph("mandate-next-step", [
            text("Suggested next step is "),
            variable("next_step"),
            text(" by "),
            variable("next_step_date"),
            text("."),
          ]),
        ],
      },
    },
    {
      id: "specialist-handoff",
      label: "Specialist handoff",
      emailContent: {
        title: "Product specialist handoff",
        to: ["Product specialist"],
        cc: ["Coverage banker"],
        attachment: seededSpreadsheetAttachment("Specialist handoff.xlsx", [
          [cell("Client"), cell("Idea"), cell("Context"), cell("Question")],
          [
            cell(variable("client_company")),
            cell(variable("recommended_idea")),
            cell(variable("relationship_context")),
            cell(variable("open_question")),
          ],
          [
            cell("Supporting material"),
            cell(variable("supporting_material")),
            cell("Next step"),
            cell(variable("next_step")),
          ],
        ]),
        body: [
          paragraph("handoff-greeting", [
            text("Hi "),
            variable("product_specialist"),
            text(","),
          ]),
          paragraph("handoff-summary", [
            variable("coverage_owner"),
            text(" is covering "),
            variable("client_company"),
            text(" and could use your view on "),
            variable("recommended_idea"),
            text("."),
          ]),
          paragraph("handoff-question", [
            text("The open question is: "),
            variable("open_question"),
            text(". I included "),
            variable("supporting_material"),
            text(" for context."),
          ]),
        ],
      },
    },
  ],
  showInGallery: true,
  sortOrder: 22,
  status: "active",
} satisfies FormatStarter;
