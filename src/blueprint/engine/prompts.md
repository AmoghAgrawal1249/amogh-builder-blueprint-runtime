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

### Existing Workflows and Integration Points

Prompts should carry workflow context:

- where the recommendation lands
- who owns the client/workflow
- what system or process produced the signal
- what action is safe inside the existing workflow

### Consulting Operating Model

Prompts should help the model place the note inside the consulting work cycle:

- discovery/diagnosis
- proposal/pursuit
- staffing/expert search
- delivery
- meeting prep
- executive readout
- renewal/follow-on

### Consultant Problem-Solving and Meeting Prep

Prompts should nudge the model to reason like a consultant:

- problem or hypothesis
- evidence
- uncertainty
- stakeholder concern
- next decision or meeting objective

### Consultant Delivery Formats and Diagnosis

Prompts should use deliverable context when supplied:

- current-state assessment
- options analysis
- business case
- roadmap
- operating model
- risk heatmap
- workshop pack
- proposal/SOW

The model should explain how the other consultant improves that deliverable or diagnosis layer.

### Business Models, Acquisition, and Recurring Sales

Prompts should make the model distinguish:

- client-helping reason
- commercial/business motion
- account owner safety
- recurring account context

The note can support revenue, but should not read like revenue extraction.

### Partner-Vendor Ecosystem

Prompts should instruct the model:

- partner/vendor signals require client-specific evidence
- commercial data stays internal
- vendor naming, pricing, deal registration, and seller involvement may require validation
- partner economics do not belong in recipient-facing notes unless explicitly requested

### AI, Automation, Industry, And Signal Quality

Prompts should add:

- reject weak signals instead of forcing a recommendation
- AI/automation must name workflow, owner, data source, approval point, risk, and success metric when relevant
- industry recommendations must name the workflow, regulated data, system, decision gate, buyer, or operational risk that makes the reason credible

### Consulting Collaboration Incentives and Blockers

Prompts should make the model distinguish real collaboration from cross-selling:

- real collaboration: another consultant helps validate, sharpen, de-risk, review, or prepare the client work
- weak cross-selling: another practice is mentioned without a client-specific reason

Prompts should require the output to state:

- the relationship owner's control
- the collaborator's specific contribution
- the smallest useful ask
- whether the first step stays internal
- what still needs validation before any client-facing move

## Prompt Block Guidance

### AI Context Block

Keep context compact. It should frame the builder user and use case, not paste research.

### Routing Prompt

Routing should choose the closest example family and ask one public question that improves the note:

- signal source
- consulting stage or deliverable
- workflow landing spot
- validation need
- one consultant vs team vs asset
- confidence or missing info

### Adaptation Prompt

Adaptation should produce a hidden draft that includes:

- signal observed
- why the signal matters for this client
- consulting stage, hypothesis, or deliverable gap when relevant
- why another consultant/practice is relevant
- how the collaboration helps the relationship owner
- low-friction internal ask
- validation/caveat

### Refinement Prompt

Refinement should preserve relationship-owner control and should not invent stronger evidence than the user supplied.

## Draft Prompt Rule Additions

```text
Do not generate a Reasons to Connect note for every interesting fact. A useful reason needs a specific signal, timely context, client relevance, consultant or practice fit, and a small next step.

If the setup includes a consulting deliverable or meeting, explain what the collaborator would improve: the hypothesis, evidence, risk caveat, scope, executive message, roadmap sequence, or next decision.

If the signal is weak, ask for one missing detail instead of forcing a recommendation.

If the note involves a vendor, partner, pricing, renewal, rebate, MDF, or deal-registration signal, keep commercial mechanics internal and lead with the client-specific reason.

Do not turn Reasons to Connect into cross-selling language. The note should read like a small internal collaboration ask that helps the relationship owner decide what to do next.
```

## Tone

Prompt text should be compact, operational, and easy for the model to obey.
