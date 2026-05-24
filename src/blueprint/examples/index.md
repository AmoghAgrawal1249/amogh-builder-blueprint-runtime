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

### Existing Workflows and Integration Points

Example families should eventually represent workflow/signal patterns, not only program maturity.

### Consulting Operating Model, Problem-Solving, And Delivery Formats

Examples may eventually need to split by consulting stage or deliverable when the wording differs enough:

- meeting-prep examples should focus on hypothesis, evidence, and next decision
- proposal examples should focus on scope, proof, and risk before pricing
- delivery examples should focus on issue diagnosis and safe escalation
- executive-readout examples should focus on concise message and business implication

Possible families:

- new/low-trust program
- established program
- validation-first
- consulting-stage
- deliverable-review
- meeting-prep
- AI/automation
- industry/compliance
- external trigger
- partner/vendor
- internal delivery signal

### Business Models, Acquisition, and Recurring Sales

If too many examples accumulate, keep grouped families by motion:

- retention/renewal
- expansion/adjacent service
- proposal/pursuit
- compliance/risk
- partner/vendor activation

### Partner-Vendor Ecosystem

Partner/vendor examples may need their own family because validation rules are different.

### AI, Automation, Industry, And Signal Quality

Signal-quality examples may need to include weak-signal cases. If weak examples are not used as base drafts, they can still be included as routing or rule tests.

### Consulting Collaboration Incentives and Blockers

Example families should eventually help the model choose between:

- direct internal recommendation
- validation-first internal check
- relationship-owner-sensitive note
- expert pressure-test
- deliverable or proposal review
- client introduction only with owner approval

## Helper Guidance

Keep accessors stable:

- list example families for routing
- get selected family by slug
- list draft examples for selected family

## Draft Family Direction

Initial implementation can preserve the three current families but reinterpret them:

- `new-program`: low-trust Reasons to Connect programs
- `established-program`: mature, high-signal internal recommendations
- `availability-first`: validation-first and relationship-owner-sensitive recommendations

Later implementation can add signal-specific families if routing quality requires it.

It can also add consulting-stage or deliverable-specific families if examples start to behave differently for discovery, proposal, delivery, executive readout, or roadmap work.

## Tone

No research prose in runtime helper functions.
