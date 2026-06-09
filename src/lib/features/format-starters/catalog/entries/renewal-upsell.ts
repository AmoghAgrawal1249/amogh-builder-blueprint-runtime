import {
  formatParagraph as paragraph,
  formatText as text,
  formatVariable as variable,
} from "$lib/features/format-starters/domain";
import type { FormatStarter } from "../types";
import { seededSpreadsheetAttachment } from "./helpers";

export const formatStarter = {
  slug: "renewal-upsell",
  defaultPresentation: {
    title: "Upsell at renewal",
    description: "Make it comfortable for brokers to upsell clients",
  },
  dataSourceIds: ["calendar", "epic", "onedrive"],
  industryTags: ["insurance"],
  variables: [
    { id: "broker_name", label: "Broker name" },
    { id: "existing_client", label: "Existing client" },
    { id: "premiums_amount", label: "Premiums amount" },
    { id: "carrier_name", label: "Carrier name" },
  ],
  sampleEmail: {
    subject: "Report for Exterra",
    paragraphs: [
      "Hi Stephen,",
      "A renewal upsell report for the Exterra renewal is attached.",
      "We identified new policies worth $400,000 which you might propose at your renewal meeting next month.",
      "Each proposed policy has a benchmark. Those were calculated with data from Allianz and Chubb. The right people from both carriers are CCed.",
    ],
  },
  details: {
    paragraphs: [
      "Your team receives a report by email 1 month before their annual renewal conversations with existing clients",
      "This report highlights the most profitable additional policies the client should buy",
    ],
  },
  startingPointSelection: {
    kind: "guided",
    intro:
      "We'll find the most profitable policies brokers should propose to each client. Then we'll send those policies to each broker 1 month before their renewal conversation with clients",
    questions: [
      {
        id: "broker-policy-comfort",
        title:
          "How important is it to help brokers learn about policies they're less familiar with?",
        helpText:
          "Should we help brokers learn about policies outside their wheelhouse?",
        options: [
          {
            id: "broker-education-very-important",
            label: "Very important",
          },
          {
            id: "broker-education-important",
            label: "Important",
          },
          {
            id: "broker-education-not-important",
            label: "Not important",
          },
        ],
      },
      {
        id: "policy-recommendation-data",
        title: "What data do you want to use to find this whitespace?",
        helpText:
          "Overbase can use any and all data from your firm and from your ecosystem partners",
        options: [
          {
            id: "public-firm-carrier-data",
            label: "Carrier benchmarks, data from our firm and public data",
          },
          {
            id: "public-firm-data",
            label: "Data from our firm and public data",
          },
          {
            id: "firm-data-only",
            label: "Only data from our firm",
          },
        ],
      },
    ],
    rules: [
      {
        id: "public-firm-carrier-data",
        startingPointId: "renewal-upsell-carrier-benchmarks",
        answers: { "policy-recommendation-data": "public-firm-carrier-data" },
      },
      {
        id: "broker-education-very-important",
        startingPointId: "renewal-upsell",
        answers: { "broker-policy-comfort": "broker-education-very-important" },
      },
      {
        id: "broker-education-important",
        startingPointId: "renewal-upsell",
        answers: { "broker-policy-comfort": "broker-education-important" },
      },
      {
        id: "broker-education-not-important",
        startingPointId: "renewal-upsell",
        answers: { "broker-policy-comfort": "broker-education-not-important" },
      },
      { id: "default", startingPointId: "renewal-upsell", answers: {} },
    ],
  },
  startingPoints: [
    {
      id: "renewal-upsell",
      label: "Renewal upsell",
      emailContent: {
        title: "Renewal upsell",
        to: ["Broker"],
        cc: [],
        attachment: seededSpreadsheetAttachment("report.xlsx", []),
        body: [
          paragraph("renewal-greeting", [
            text("Hi "),
            variable("broker_name"),
            text(","),
          ]),
          paragraph("renewal-summary", [
            text("A whitespace analysis for the "),
            variable("existing_client"),
            text(" renewal is attached."),
          ]),
          paragraph("renewal-opportunity", [
            text("We identified new policies worth "),
            variable("premiums_amount"),
            text(
              " which you might propose at your renewal meeting next month.",
            ),
          ]),
        ],
      },
    },
    {
      id: "renewal-upsell-carrier-benchmarks",
      label: "Renewal upsell with carrier benchmarks",
      emailContent: {
        title: "Renewal upsell",
        to: ["Broker"],
        cc: ["Carrier contact"],
        attachment: seededSpreadsheetAttachment("report.xlsx", []),
        body: [
          paragraph("renewal-greeting", [
            text("Hi "),
            variable("broker_name"),
            text(","),
          ]),
          paragraph("renewal-summary", [
            text("A whitespace analysis for the "),
            variable("existing_client"),
            text(" renewal is attached."),
          ]),
          paragraph("renewal-opportunity", [
            text("We identified new policies worth "),
            variable("premiums_amount"),
            text(
              " which you might propose at your renewal meeting next month.",
            ),
          ]),
          paragraph("renewal-carrier-benchmarks", [
            text(
              "Each proposed policy has a benchmark which was calculated with data from ",
            ),
            variable("carrier_name"),
            text(". The right person from "),
            variable("carrier_name"),
            text(" is CCed in case you have questions."),
          ]),
        ],
      },
    },
  ],
  showInGallery: true,
  sortOrder: 20,
  status: "active",
} satisfies FormatStarter;
