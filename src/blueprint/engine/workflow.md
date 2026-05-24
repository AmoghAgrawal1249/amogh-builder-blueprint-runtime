# engine/workflow.ts Notes

Purpose: runtime orchestration for route, hidden draft generation, initial answer application, and visible draft refinement.

## Exports

Current exports:

- `routeBringTheFirmBuilderRequest`
- `adaptBringTheFirmExample`
- `applyBringTheFirmInitialAnswer`
- `streamBringTheFirmBuilderTurn`

Target rename direction: `ReasonsToConnect*`.

## Research Contributions

### Existing Workflows and Integration Points

Workflow state should preserve selected example family and initial question. Future state may also preserve signal category, landing workflow, and validation mode.

### Consulting Operating Model

Future state may need to preserve consulting stage if routing needs to distinguish proposal, delivery, meeting prep, executive readout, or follow-on work.

### Consultant Problem-Solving and Meeting Prep

Future state may need to carry a working hypothesis, meeting objective, or next decision if the UI captures it separately from the free-text answer.

### Consultant Delivery Formats and Diagnosis

Future state may need deliverable type or diagnosis layer if those become routing dimensions.

### Business Models, Acquisition, and Recurring Sales

If business motion becomes a routing dimension, workflow should pass it into routing/adaptation without hard-coding MSP-specific behavior in orchestration.

### Partner-Vendor Ecosystem

Workflow should support cases where the safest output is a validation-first note, not a direct connection suggestion.

### AI, Automation, Industry, And Signal Quality

Workflow may need to represent weak-signal behavior:

- ask one missing-info question
- generate caveated draft
- generate no draft until signal is specific enough

This should be handled by prompt/tool result shape if possible, rather than ad hoc branching.

### Consulting Collaboration Incentives and Blockers

Workflow may need to preserve collaboration-safety state if the UI or prompts start treating it as first-class:

- relationship-owner sensitivity
- collaboration risk
- collaboration mode
- ask size
- whether client-facing introduction is allowed

If this is added, keep the orchestration simple: routing/adaptation should decide whether the output is direct, caveated, or validation-first.

## State Guidance

Current state:

- `selectedExamplesSlug`
- `selectedExampleSlug`
- `initialQuestionText`
- `aiContext`

Potential future state:

- `selectedSignalCategory`
- `selectedWorkflow`
- `consultingStage`
- `deliverableType`
- `diagnosisLayer`
- `meetingObjective`
- `validationMode`
- `signalStrength`
- `relationshipOwnerSensitivity`
- `collaborationMode`
- `collaborationRisk`
- `clientIntroAllowed`

## Structured Tool Guidance

Routing result could eventually include:

- `examplesSlug`
- `publicQuestion`
- `signalCategory`
- `consultingStage`
- `deliverableType`
- `needsMoreContext`
- `collaborationRisk`

Adaptation result could eventually include:

- `exampleSlug`
- `emailDraft`
- `signalStrength`
- `missingInfo`
- `consultingStage`
- `deliverableType`
- `collaborationMode`
- `relationshipOwnerControlNote`

## Behavior Guidance

Keep the current flow unless product requirements demand deeper changes:

1. route to example family
2. ask one public question
3. generate hidden draft in background
4. apply user's answer
5. show visible draft
6. refine via patch

If collaboration risk is high, the visible draft should stay validation-first and internal unless the user explicitly asks for a client-facing introduction.

## Tone

Workflow code should stay product-agnostic. Keep research logic in rules, prompts, examples, and types.
