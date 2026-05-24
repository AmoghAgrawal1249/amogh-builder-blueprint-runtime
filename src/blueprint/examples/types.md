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

### Consulting Operating Model

Examples may need match signals for consulting stage:

- discovery
- proposal
- delivery
- meeting-prep
- executive-readout
- renewal-follow-on

### Consultant Problem-Solving and Meeting Prep

Examples may need optional metadata for hypothesis, evidence, meeting objective, or next decision if routing becomes more precise.

### Consultant Delivery Formats and Diagnosis

Examples may need match signals for deliverable type or diagnosis layer.

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

### Consulting Collaboration Incentives and Blockers

Examples may need collaboration metadata only if routing quality requires it:

- collaboration mode
- relationship-owner sensitivity
- expected contribution
- ask size
- client intro allowed

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
consultingStage?: ReasonsToConnectConsultingStage;
deliverableType?: ReasonsToConnectDeliverableType;
workflow?: string;
validationMode?: string;
minimumSignalStrength?: 'weak' | 'good' | 'strong';
collaborationMode?: ReasonsToConnectCollaborationMode;
relationshipOwnerSensitivity?: 'low' | 'medium' | 'high';
clientIntroAllowed?: boolean;
```

## Tone

Keep example types readable. Complex scoring can live in separate types if needed.
