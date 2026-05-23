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

### Business Models, Acquisition, and Recurring Sales

If business-model rules become large, consider a new `business-model.ts` rule module instead of overloading context.

### Partner-Vendor Ecosystem

If partner/vendor sensitivity rules become large, consider a new `partner.ts` rule module and re-export it here.

### AI, Automation, Industry, And Signal Quality

If AI/automation or signal scoring rules become large, consider new modules:

- `signals.ts`
- `automation.ts`
- `industry.ts`

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
