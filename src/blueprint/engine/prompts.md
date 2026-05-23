# engine/prompts.ts Notes

Purpose: build system and user prompts for routing, example adaptation, initial answer application, and refinement.

## Exports

Current exports:

- `formatBringTheFirmAiContextPromptBlock`
- `buildBringTheFirmRoutingPrompt`
- `buildBringTheFirmExampleAdaptationPrompt`
- `buildBringTheFirmInitialAnswerPrompt`
- `buildBringTheFirmRefinementSystemPrompt`
- `buildBringTheFirmRefinementUserPrompt`

Target rename direction: `ReasonsToConnect*`.

## Research Contributions

### Phase 9: Existing Workflows and Integration Points

Prompts should carry workflow context:

- where the recommendation lands
- who owns the client/workflow
- what system or process produced the signal
- what action is safe inside the existing workflow

### Phase 10: Business Models, Acquisition, and Recurring Sales

Prompts should make the model distinguish:

- client-helping reason
- commercial/business motion
- account owner safety
- recurring account context

The note can support revenue, but should not read like revenue extraction.

### Phase 11: Partner-Vendor Ecosystem

Prompts should instruct the model:

- partner/vendor signals require client-specific evidence
- commercial data stays internal
- vendor naming, pricing, deal registration, and seller involvement may require validation
- partner economics do not belong in recipient-facing notes unless explicitly requested

### Friday/Saturday: AI, Automation, Industry, And Signal Quality

Prompts should add:

- reject weak signals instead of forcing a recommendation
- AI/automation must name workflow, owner, data source, approval point, risk, and success metric when relevant
- industry recommendations must name the workflow, regulated data, system, decision gate, buyer, or operational risk that makes the reason credible

## Prompt Block Guidance

### AI Context Block

Keep context compact. It should frame the builder user and use case, not paste research.

### Routing Prompt

Routing should choose the closest example family and ask one public question that improves the note:

- signal source
- workflow landing spot
- validation need
- one consultant vs team vs asset
- confidence or missing info

### Adaptation Prompt

Adaptation should produce a hidden draft that includes:

- signal observed
- why the signal matters for this client
- why another consultant/practice is relevant
- low-friction internal ask
- validation/caveat

### Refinement Prompt

Refinement should preserve relationship-owner control and should not invent stronger evidence than the user supplied.

## Draft Prompt Rule Additions

```text
Do not generate a Reasons to Connect note for every interesting fact. A useful reason needs a specific signal, timely context, client relevance, consultant or practice fit, and a small next step.

If the signal is weak, ask for one missing detail instead of forcing a recommendation.

If the note involves a vendor, partner, pricing, renewal, rebate, MDF, or deal-registration signal, keep commercial mechanics internal and lead with the client-specific reason.
```

## Tone

Prompt text should be compact, operational, and easy for the model to obey.
