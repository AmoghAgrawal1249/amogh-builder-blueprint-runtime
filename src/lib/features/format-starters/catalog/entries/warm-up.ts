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
  slug: "warm-up",
  defaultPresentation: {
    title: "Warm up accounts",
    description: "Help lawyers warm up specific accounts",
  },
  dataSourceIds: ["foundation", "salesforce"],
  industryTags: ["law"],
  variables: [
    { id: "client_name", label: "Client name" },
    { id: "account_owner", label: "Account owner" },
    { id: "project_name", label: "Project name" },
    { id: "reporting_period", label: "Reporting period" },
    { id: "current_status", label: "Current status" },
    { id: "priority_update", label: "Priority update" },
    { id: "decision_needed", label: "Decision needed" },
    { id: "decision_due_date", label: "Decision due date" },
    { id: "risk_summary", label: "Risk summary" },
    { id: "risk_owner", label: "Risk owner" },
    { id: "next_meeting_date", label: "Next meeting date" },
  ],
  sampleEmail: {
    subject: "Opportunity to help General Motors",
    paragraphs: [
      "Hey Nicole,",
      "Robert Rosenberg is the lawyer from the Tax team who is tasked with building a relationship with General Motors.",
      "You might consider flagging to him that GM started searching for a new CFO. And we might want to brainstorm a few recommendations our firm could make.",
      "I also CCed the folks at Korn Ferry who are leading that search - they’re the ones who flagged this opportunity.",
    ],
  },
  details: {
    paragraphs: [
      "Create a concise client update for status, decisions, or risk follow-up.",
      "The generated draft includes a spreadsheet attachment that can be edited locally.",
    ],
  },
  startingPointSelection: {
    kind: "guided",
    intro:
      "Answer a few questions so the starter email matches the update you need to send.",
    questions: [
      {
        id: "update_focus",
        title: "What is the update focused on?",
        helpText: "Choose the main job this email needs to do.",
        options: [
          { id: "status", label: "Project status" },
          { id: "decision", label: "Decision needed" },
          { id: "risk", label: "Risk or blocker" },
        ],
      },
      {
        id: "audience",
        title: "Who is the primary audience?",
        helpText: "This affects how direct and detailed the draft should be.",
        options: [
          { id: "executive", label: "Executive sponsor" },
          { id: "working_team", label: "Working team" },
          { id: "client_lead", label: "Client lead" },
        ],
      },
      {
        id: "detail_level",
        title: "How much detail should the email include?",
        helpText: "Dummy help text for choosing detail level.",
        options: [
          { id: "summary", label: "Short summary" },
          { id: "detailed", label: "Detailed context" },
          { id: "actions", label: "Action-focused" },
        ],
      },
    ],
    rules: [
      {
        id: "risk-focus",
        startingPointId: "risk-escalation",
        answers: { update_focus: "risk" },
      },
      {
        id: "decision-focus",
        startingPointId: "decision-request",
        answers: { update_focus: "decision" },
      },
      {
        id: "executive-summary",
        startingPointId: "steady-progress",
        answers: { audience: "executive", detail_level: "summary" },
      },
      {
        id: "status-detailed",
        startingPointId: "steady-progress",
        answers: { update_focus: "status", detail_level: "detailed" },
      },
      { id: "default", startingPointId: "steady-progress", answers: {} },
    ],
  },
  startingPoints: [
    {
      id: "steady-progress",
      label: "Steady progress update",
      emailContent: {
        title: "Client update",
        to: ["Client team"],
        cc: ["Project team"],
        attachment: seededSpreadsheetAttachment("Client update tracker.xlsx", [
          [
            cell("Workstream"),
            cell("Status"),
            cell("Owner"),
            cell("Next checkpoint"),
          ],
          [
            cell("Program summary"),
            cell(variable("current_status")),
            cell(variable("account_owner")),
            cell(variable("next_meeting_date")),
          ],
          [
            cell("Priority item"),
            cell(variable("priority_update")),
            cell("Overbase"),
            cell("This week"),
          ],
        ]),
        body: [
          paragraph("steady-greeting", [
            text("Hi "),
            variable("client_name"),
            text(","),
          ]),
          paragraph("steady-summary", [
            text("Here is the update for "),
            variable("project_name"),
            text(" covering "),
            variable("reporting_period"),
            text(". The current status is "),
            variable("current_status"),
            text("."),
          ]),
          paragraph("steady-priority", [
            text("The priority update is "),
            variable("priority_update"),
            text(", and the next checkpoint is "),
            variable("next_meeting_date"),
            text("."),
          ]),
        ],
      },
    },
    {
      id: "decision-request",
      label: "Decision request",
      emailContent: {
        title: "Decision needed",
        to: ["Client lead"],
        cc: ["Project team"],
        attachment: seededSpreadsheetAttachment("Decision tracker.xlsx", [
          [cell("Decision"), cell("Owner"), cell("Due date"), cell("Impact")],
          [
            cell(variable("decision_needed")),
            cell("Client team"),
            cell(variable("decision_due_date")),
            cell("Keeps the plan moving"),
          ],
          [
            cell("Supporting context"),
            cell(variable("account_owner")),
            cell("Prepared"),
            cell(variable("priority_update")),
          ],
        ]),
        body: [
          paragraph("decision-greeting", [
            text("Hi "),
            variable("client_name"),
            text(","),
          ]),
          paragraph("decision-summary", [
            text("We need your direction on "),
            variable("decision_needed"),
            text(" for "),
            variable("project_name"),
            text("."),
          ]),
          paragraph("decision-timing", [
            text("A decision by "),
            variable("decision_due_date"),
            text(" will let "),
            variable("account_owner"),
            text(" keep the next step on track."),
          ]),
        ],
      },
    },
    {
      id: "risk-escalation",
      label: "Risk escalation",
      emailContent: {
        title: "Risk update",
        to: ["Client sponsor"],
        cc: ["Project team"],
        attachment: seededSpreadsheetAttachment("Risk register.xlsx", [
          [cell("Risk"), cell("Owner"), cell("Status"), cell("Mitigation")],
          [
            cell(variable("risk_summary")),
            cell(variable("risk_owner")),
            cell(variable("current_status")),
            cell("Review and unblock"),
          ],
          [
            cell("Next review"),
            cell(variable("account_owner")),
            cell(variable("next_meeting_date")),
            cell(variable("priority_update")),
          ],
        ]),
        body: [
          paragraph("risk-greeting", [
            text("Hi "),
            variable("client_name"),
            text(","),
          ]),
          paragraph("risk-summary", [
            text("Flagging one risk for "),
            variable("project_name"),
            text(": "),
            variable("risk_summary"),
            text("."),
          ]),
          paragraph("risk-owner", [
            text("The current owner is "),
            variable("risk_owner"),
            text(", and we should review this before "),
            variable("next_meeting_date"),
            text("."),
          ]),
        ],
      },
    },
  ],
  showInGallery: true,
  sortOrder: 10,
  status: "active",
} satisfies FormatStarter;
