# index.ts Notes

Purpose: public barrel exports for the blueprint package.

## Export

Current exports:

- manifest and type exports
- example accessors
- engine workflow functions

Target direction: export the Reasons to Connect manifest, examples, engine functions, and types with names that match the new blueprint once implementation changes are made.

## Research Contributions

### Existing Workflows and Integration Points

This barrel should make workflow-aware blueprint modules available without exposing implementation internals.

### Consulting Operating Model, Problem-Solving, And Delivery Formats

If consulting-stage, deliverable-type, diagnosis-layer, or meeting-prep concepts become first-class types, export them through the normal type surface only.

Do not export separate helper modules for every consulting deliverable unless the runtime actually needs different behavior.

### Business Models, Acquisition, and Recurring Sales

If new modules split examples by business motion, this file should export only the stable list/accessor API rather than each internal category.

### Partner-Vendor Ecosystem

If partner/vendor example families become separate modules, keep their access behind the normal example accessors.

### AI, Automation, Industry, And Signal Quality

If signal scoring or signal categories become first-class types, export those types from here.

### Consulting Collaboration Incentives and Blockers

If relationship-owner sensitivity, collaboration mode, or collaboration risk become first-class runtime concepts, export their stable types from `types.ts` rather than exposing internal prompt modules.

Do not export compensation, origination-credit, or internal politics helpers unless they are truly part of the user-facing contract. Those details should usually stay as prompt guidance.

## Planned Export Shape

Potential future exports:

- `reasonsToConnectManifest`
- `listReasonsToConnectExamples`
- `getReasonsToConnectExamples`
- `listReasonsToConnectDraftExamples`
- `routeReasonsToConnectBuilderRequest`
- `adaptReasonsToConnectExample`
- `applyReasonsToConnectInitialAnswer`
- `streamReasonsToConnectBuilderTurn`

## Tone

Keep this file boring. It should not contain research language or business rules.
