# index.ts Notes

Purpose: public barrel exports for the blueprint package.

## Export

Current exports:

- manifest and type exports
- example accessors
- engine workflow functions

Target direction: export the Reasons to Connect manifest, examples, engine functions, and types with names that match the new blueprint once implementation changes are made.

## Research Contributions

### Phase 9: Existing Workflows and Integration Points

This barrel should make workflow-aware blueprint modules available without exposing implementation internals.

### Phase 10: Business Models, Acquisition, and Recurring Sales

If new modules split examples by business motion, this file should export only the stable list/accessor API rather than each internal category.

### Phase 11: Partner-Vendor Ecosystem

If partner/vendor example families become separate modules, keep their access behind the normal example accessors.

### Friday/Saturday: AI, Automation, Industry, And Signal Quality

If signal scoring or signal categories become first-class types, export those types from here.

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
