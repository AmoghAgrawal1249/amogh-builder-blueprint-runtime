# types.ts Notes

Purpose: shared TypeScript types for blueprint examples, AI context, routing, and structured results.

## Exports

Current exports:

- builder SDK catalog and stream types
- `BringTheFirmExamplesCandidate`
- `BringTheFirmExampleCandidate`
- `BringTheFirmAiContext`
- `BringTheFirmRouteResult`
- `BringTheFirmAdaptedExampleResult`

Target rename direction: replace `BringTheFirm*` names with `ReasonsToConnect*` names when code changes are made.

## Research Contributions

### Phase 9: Existing Workflows and Integration Points

Types may need to represent where the recommendation lands and which workflow owns action.

Potential fields:

- `landingWorkflow`
- `recipientRole`
- `workflowOwner`
- `validationOwner`
- `sourceSystem`

### Phase 10: Business Models, Acquisition, and Recurring Sales

Types may need to represent business motion:

- acquisition
- retention
- renewal
- expansion
- assessment
- compliance roadmap
- proposal support
- service capacity

### Phase 11: Partner-Vendor Ecosystem

Types may need to represent vendor sensitivity:

- `partnerSignalType`
- `commercialSensitivity`
- `requiresPartnerOwnerReview`
- `vendorMayBeNamed`
- `pricingDataAllowed`

### Friday/Saturday: AI, Automation, Industry, And Signal Quality

Types may need to represent signal quality:

- `signalSource`
- `signalCategory`
- `specificityScore`
- `timingScore`
- `clientRelevanceScore`
- `consultantFitScore`
- `actionabilityScore`
- `confidence`
- `missingInfo`

AI/automation fields:

- `workflowName`
- `dataSource`
- `automationOwner`
- `approvalPoint`
- `riskLevel`
- `successMetric`

Industry fields:

- `industry`
- `lineOfBusinessSystem`
- `regulatedData`
- `decisionGate`
- `buyer`
- `operationalRisk`

## Draft Type Direction

```ts
type ReasonsToConnectSignalCategory =
  | 'ai-automation'
  | 'industry-compliance'
  | 'external-trigger'
  | 'internal-delivery'
  | 'partner-vendor'
  | 'relationship-staffing';

type ReasonsToConnectSignalScore = {
  specificity: 0 | 1 | 2;
  timing: 0 | 1 | 2;
  clientRelevance: 0 | 1 | 2;
  consultantFit: 0 | 1 | 2;
  actionability: 0 | 1 | 2;
};
```

## Tone

Keep types descriptive, not over-modeled. Add structured fields only when they influence prompts, routing, examples, or output validation.
