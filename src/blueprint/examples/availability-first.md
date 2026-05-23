# examples/availability-first.ts Notes

Purpose: examples for cases where availability, fit, relationship sensitivity, or other validation must be checked before a connection is suggested externally.

## Export

`availabilityFirstExamples`

Target rename direction: `validationFirstExamples`.

## Research Contributions

### Existing Workflows and Integration Points

Validation-first examples should cover more than calendar availability:

- account owner approval
- service owner confirmation
- source-system validation
- workflow owner approval
- fit check before client mention

### Business Models, Acquisition, and Recurring Sales

Validation is especially important for renewals, proposals, assessments, and expansion motions where a premature recommendation can feel salesy or politically unsafe.

### Partner-Vendor Ecosystem

This example family should cover vendor-sensitive recommendations:

- pricing or renewal data
- deal registration
- partner-of-record
- vendor seller involvement
- margin, rebate, MDF, distributor economics

The default next step should often be "check internally first."

### AI, Automation, Industry, And Signal Quality

Validation-first examples should cover:

- AI-derived signal needs human review
- automation cannot write to PSA/RMM/CRM without approval
- regulated-industry recommendation needs compliance specialist caveat
- public-sector procurement risk needs internal check before vendor mention

## Example Guidance

Replace or add examples like:

1. AI/Copilot readiness check before client recommendation
2. Vendor promotion matched to client gap, but partner owner must validate before naming vendor
3. CMMC/OT signal needs specialist review before client discussion
4. Security alert pattern is suggestive, but SOC lead should confirm before account note

## Draft Example Shape

```text
Client signal appears relevant, but I would confirm [fit/source/availability/sensitivity] before suggesting anything outside the firm.

Suggested ask: have [specialist/practice owner] give you a short internal view first. If the angle is weak or politically sensitive, no client intro is needed.
```

## Tone

Careful, humble, and validation-oriented. Do not overstate uncertain signals.
