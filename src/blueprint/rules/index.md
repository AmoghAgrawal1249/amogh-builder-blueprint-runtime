# rules/index.ts Notes

Purpose: barrel export for blueprint rule modules.

## Exports

Current exports:

- `context`
- `drafting`
- `routing`
- `writing`

## Research Contributions

### Existing Workflows and Integration Points

Rules should remain modular so workflow context, drafting behavior, routing behavior, and writing tone can evolve separately.

### Consulting Operating Model, Problem-Solving, And Delivery Formats

If consulting-stage, diagnosis, or deliverable-specific rules become large, consider new modules:

- `consulting.ts`
- `diagnosis.ts`
- `deliverables.ts`

Only add them if the current context/drafting/routing/writing split becomes hard to maintain.

### Business Models, Acquisition, and Recurring Sales

If business-model rules become large, consider a new `business-model.ts` rule module instead of overloading context.

### Partner-Vendor Ecosystem

If partner/vendor sensitivity rules become large, consider a new `partner.ts` rule module and re-export it here.

### AI, Automation, Industry, And Signal Quality

If AI/automation or signal scoring rules become large, consider new modules:

- `signals.ts`
- `automation.ts`
- `industry.ts`

### Consulting Collaboration Incentives and Blockers

If relationship-owner safety, collaboration mode, or collaboration-risk rules become large, consider a new `collaboration.ts` or `governance.ts` module.

Keep compensation, origination credit, and internal-politics details out of the barrel unless the product explicitly exposes them. They should usually remain as drafting and routing guidance.

## Planned Export Guidance

Keep the barrel small:

```ts
export * from './context';
export * from './drafting';
export * from './routing';
export * from './writing';
```

Add new exports only when the rule module is actually created.

## Tone

No prose or business logic here.
