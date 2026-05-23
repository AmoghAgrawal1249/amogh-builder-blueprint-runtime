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

## State Guidance

Current state:

- `selectedExamplesSlug`
- `selectedExampleSlug`
- `initialQuestionText`
- `aiContext`

Potential future state:

- `selectedSignalCategory`
- `selectedWorkflow`
- `validationMode`
- `signalStrength`

## Structured Tool Guidance

Routing result could eventually include:

- `examplesSlug`
- `publicQuestion`
- `signalCategory`
- `needsMoreContext`

Adaptation result could eventually include:

- `exampleSlug`
- `emailDraft`
- `signalStrength`
- `missingInfo`

## Behavior Guidance

Keep the current flow unless product requirements demand deeper changes:

1. route to example family
2. ask one public question
3. generate hidden draft in background
4. apply user's answer
5. show visible draft
6. refine via patch

## Tone

Workflow code should stay product-agnostic. Keep research logic in rules, prompts, examples, and types.
