# examples/index.ts Notes

Purpose: collect example families and expose helper functions for listing/selecting example sets.

## Exports

Current exports:

- `bringTheFirmExamples`
- `listBringTheFirmExamples`
- `getBringTheFirmExamples`
- `listBringTheFirmDraftExamples`
- example family re-exports

Target rename direction: `reasonsToConnectExamples` and matching accessors.

## Research Contributions

### Phase 9: Existing Workflows and Integration Points

Example families should eventually represent workflow/signal patterns, not only program maturity.

Possible families:

- new/low-trust program
- established program
- validation-first
- AI/automation
- industry/compliance
- external trigger
- partner/vendor
- internal delivery signal

### Phase 10: Business Models, Acquisition, and Recurring Sales

If too many examples accumulate, keep grouped families by motion:

- retention/renewal
- expansion/adjacent service
- proposal/pursuit
- compliance/risk
- partner/vendor activation

### Phase 11: Partner-Vendor Ecosystem

Partner/vendor examples may need their own family because validation rules are different.

### Friday/Saturday: AI, Automation, Industry, And Signal Quality

Signal-quality examples may need to include weak-signal cases. If weak examples are not used as base drafts, they can still be included as routing or rule tests.

## Helper Guidance

Keep accessors stable:

- list example families for routing
- get selected family by slug
- list draft examples for selected family

## Draft Family Direction

Initial implementation can preserve the three current families but reinterpret them:

- `new-program`: low-trust Reasons to Connect programs
- `established-program`: mature, high-signal internal recommendations
- `availability-first`: validation-first recommendations

Later implementation can add signal-specific families if routing quality requires it.

## Tone

No research prose in runtime helper functions.
