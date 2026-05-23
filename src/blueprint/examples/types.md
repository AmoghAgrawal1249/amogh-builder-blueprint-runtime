# examples/types.ts Notes

Purpose: type definitions for example families and individual draft examples.

## Exports

Current exports:

- `BringTheFirmExample`
- `BringTheFirmExamples`

Target rename direction:

- `ReasonsToConnectExample`
- `ReasonsToConnectExamples`

## Research Contributions

### Existing Workflows and Integration Points

Examples may need fields for workflow landing spot and recipient role.

### Business Models, Acquisition, and Recurring Sales

Examples may need match signals for business motion:

- renewal
- expansion
- assessment
- proposal
- compliance
- service-capacity

### Partner-Vendor Ecosystem

Examples may need match signals for partner/vendor sensitivity and validation.

### AI, Automation, Industry, And Signal Quality

Examples may need signal metadata:

- signal category
- signal strength
- industry
- source system
- validation requirement

## Type Guidance

Current type shape is simple and useful:

```ts
type Example = {
  slug: string;
  description: string;
  matchSignals: string[];
  emailDraft: EmailDraft;
};
```

Do not overcomplicate unless routing needs structured fields.

Possible additive fields:

```ts
signalCategory?: ReasonsToConnectSignalCategory;
workflow?: string;
validationMode?: string;
minimumSignalStrength?: 'weak' | 'good' | 'strong';
```

## Tone

Keep example types readable. Complex scoring can live in separate types if needed.
