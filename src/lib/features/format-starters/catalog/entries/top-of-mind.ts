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
  slug: "top-of-mind",
  defaultPresentation: {
    title: "Stay top of mind",
    description: "Find high value reasons to reach out to clients",
  },
  dataSourceIds: ["bloomberg", "foundation"],
  industryTags: ["law"],
  variables: [
    { id: "marketing", label: "Marketing manager" },
    { id: "program_name", label: "Program name" },
    { id: "implementation_owner", label: "Implementation owner" },
    { id: "integration_owner", label: "Integration owner" },
    { id: "target_launch_date", label: "Target launch date" },
    { id: "kickoff_date", label: "Kickoff date" },
    { id: "migration_scope", label: "Migration scope" },
    { id: "dependency", label: "Dependency" },
    { id: "risk_mitigation", label: "Risk mitigation" },
    { id: "workstream_owner", label: "Workstream owner" },
    { id: "success_metric", label: "Success metric" },
  ],
  sampleEmail: {
    subject: "ADP opportunity",
    paragraphs: [
      "Hi Jordan,",
      "Sharing the first implementation plan for the rollout. The initial milestone is ready, and the dependency list is short enough to review in one pass.",
      "I attached the plan with owners, launch dates, and the success metric we should use for the first checkpoint.",
    ],
  },
  details: {
    paragraphs: [
      "Each lawyer connect their list of contacts and you give us details on the precise type of matters clients hire them for",
      "Then we find and send timely opportunities for lawyers to reach out to their contacts",
    ],
  },
  startingPointSelection: {
    kind: "guided",
    intro:
      "Let's create an email format that helps your lawyers easily reach out to their contacts about matters you can help with",
    questions: [
      {
        id: "recipient",
        title: "Who should receive these opportunities?",
        helpText: "Dummy help text for choosing the recipient.",
        options: [
          {
            id: "marketing",
            label: "Send to marketing so they can forward to lawyers",
          },
          { id: "lawyers", label: "Send to lawyers directly" },
          {
            id: "assistants",
            label: "Send to each lawyer's assistant",
          },
        ],
      },
      {
        id: "complexity",
        title: "How complex is the work?",
        helpText: "Dummy help text for choosing complexity.",
        options: [
          { id: "simple", label: "Simple rollout" },
          { id: "multi_team", label: "Multi-team rollout" },
          { id: "high_risk", label: "High-risk rollout" },
        ],
      },
      {
        id: "ownership",
        title: "Who owns execution?",
        helpText: "Dummy help text for choosing ownership.",
        options: [
          { id: "client_led", label: "Client-led" },
          { id: "joint", label: "Joint team" },
          { id: "vendor_led", label: "Vendor-led" },
        ],
      },
    ],
    rules: [
      {
        id: "high-risk",
        startingPointId: "risk-controlled-plan",
        answers: { complexity: "high_risk" },
      },
      {
        id: "assistants",
        startingPointId: "risk-controlled-plan",
        answers: { recipient: "assistants" },
      },
      {
        id: "lawyers",
        startingPointId: "migration-plan",
        answers: { recipient: "lawyers" },
      },
      {
        id: "multi-team-joint",
        startingPointId: "migration-plan",
        answers: { complexity: "multi_team", ownership: "joint" },
      },
      { id: "default", startingPointId: "kickoff-plan", answers: {} },
    ],
  },
  startingPoints: [
    {
      id: "kickoff-plan",
      label: "Kickoff plan",
      emailContent: {
        title: "Stay top of mind",
        to: ["Marketing manager"],
        cc: [],
        attachment: null,
        body: [
          paragraph("kickoff-greeting", [
            text("Hi "),
            variable("marketing"),
            text(","),
          ]),
          paragraph("kickoff-summary", [
            text("Here is the kickoff plan for "),
            variable("program_name"),
            text(". We will start on "),
            variable("kickoff_date"),
            text(" and work toward "),
            variable("target_launch_date"),
            text("."),
          ]),
          paragraph("kickoff-owner", [
            variable("implementation_owner"),
            text(
              " will own implementation, and we will measure success against ",
            ),
            variable("success_metric"),
            text("."),
          ]),
        ],
      },
    },
    {
      id: "migration-plan",
      label: "Migration plan",
      emailContent: {
        title: "Migration implementation plan",
        to: ["Implementation team"],
        cc: ["Technical owners"],
        attachment: seededSpreadsheetAttachment("Migration plan.xlsx", [
          [cell("Scope"), cell("Dependency"), cell("Owner"), cell("Target")],
          [
            cell(variable("migration_scope")),
            cell(variable("dependency")),
            cell(variable("integration_owner")),
            cell(variable("target_launch_date")),
          ],
          [
            cell("Validation"),
            cell("Sample data review"),
            cell(variable("workstream_owner")),
            cell(variable("success_metric")),
          ],
        ]),
        body: [
          paragraph("migration-greeting", [
            text("Hi "),
            variable("marketing"),
            text(","),
          ]),
          paragraph("migration-summary", [
            text("The migration scope for "),
            variable("program_name"),
            text(" is "),
            variable("migration_scope"),
            text("."),
          ]),
          paragraph("migration-dependency", [
            text("The key dependency is "),
            variable("dependency"),
            text(", owned by "),
            variable("integration_owner"),
            text("."),
          ]),
        ],
      },
    },
    {
      id: "risk-controlled-plan",
      label: "Risk-controlled plan",
      emailContent: {
        title: "Implementation risk plan",
        to: ["Implementation leads"],
        cc: ["Client sponsor"],
        attachment: seededSpreadsheetAttachment(
          "Implementation risk plan.xlsx",
          [
            [
              cell("Risk area"),
              cell("Mitigation"),
              cell("Owner"),
              cell("Review date"),
            ],
            [
              cell(variable("dependency")),
              cell(variable("risk_mitigation")),
              cell(variable("workstream_owner")),
              cell(variable("kickoff_date")),
            ],
            [
              cell("Launch readiness"),
              cell(variable("success_metric")),
              cell(variable("implementation_owner")),
              cell(variable("target_launch_date")),
            ],
          ],
        ),
        body: [
          paragraph("risk-plan-greeting", [
            text("Hi "),
            variable("marketing"),
            text(","),
          ]),
          paragraph("risk-plan-summary", [
            text("For "),
            variable("program_name"),
            text(", we should use a controlled implementation plan because "),
            variable("dependency"),
            text(" needs close management."),
          ]),
          paragraph("risk-plan-mitigation", [
            text("Mitigation: "),
            variable("risk_mitigation"),
            text(". Success will be measured by "),
            variable("success_metric"),
            text("."),
          ]),
        ],
      },
    },
  ],
  showInGallery: true,
  sortOrder: 30,
  status: "active",
} satisfies FormatStarter;
