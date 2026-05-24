# engine/index.ts Notes

Purpose: barrel export for engine workflow functions.

## Exports

Current exports:

- `adaptBringTheFirmExample`
- `applyBringTheFirmInitialAnswer`
- `routeBringTheFirmBuilderRequest`
- `streamBringTheFirmBuilderTurn`

Target rename direction: `*ReasonsToConnect*`.

## Research Contributions

### Existing Workflows and Integration Points

Engine exports should preserve a simple runtime contract even if the prompt internals become workflow-aware.

### Consulting Operating Model, Problem-Solving, And Delivery Formats

Consulting-stage, meeting-prep, diagnosis, and deliverable details should flow through workflow inputs/results, not separate engine exports.

### Business Models, Acquisition, and Recurring Sales

If the engine later gains separate routing by business motion, keep one stable export for route/adapt/refine.

### Partner-Vendor Ecosystem

Partner/vendor validation should be handled in prompts and workflow state, not by exporting many vendor-specific functions.

### AI, Automation, Industry, And Signal Quality

Signal scoring should be internal unless the UI or runtime needs to display it. If displayed, export a stable type or helper from `types.ts`, not from this barrel.

### Consulting Collaboration Incentives and Blockers

Collaboration-safety concepts should remain inside workflow results and shared types. Do not create separate public engine exports for relationship-owner politics unless the UI needs a distinct flow.

## Planned Export Shape

```ts
export {
  adaptReasonsToConnectExample,
  applyReasonsToConnectInitialAnswer,
  routeReasonsToConnectBuilderRequest,
  streamReasonsToConnectBuilderTurn
} from './workflow';
```

## Tone

No research prose here. Keep it a mechanical export surface.
