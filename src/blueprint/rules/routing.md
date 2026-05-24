# rules/routing.ts Notes

Purpose: rules for choosing the closest example set and generating the first public follow-up question.

## Export

`BRING_THE_FIRM_ROUTING_RULES`

Target rename direction: `REASONS_TO_CONNECT_ROUTING_RULES`.

## Research Contributions

### Existing Workflows and Integration Points

Routing should consider where the note lands:

- account review
- QBR/security review
- proposal/pursuit
- delivery handoff
- renewal
- partner/vendor workflow
- internal prep

### Consulting Operating Model

Routing should consider the consulting stage:

- discovery/diagnosis
- proposal/pursuit
- staffing/expert search
- active delivery
- meeting prep
- executive readout
- renewal/follow-on

### Consultant Problem-Solving and Meeting Prep

Routing should prefer examples that match the user's problem-solving need:

- validate a hypothesis
- add evidence
- pressure-test risk
- prepare for stakeholder questions
- clarify a next decision

### Consultant Delivery Formats and Diagnosis

Routing should consider deliverable type when stated:

- assessment
- options analysis
- business case
- roadmap
- operating model
- risk heatmap
- workshop pack
- proposal/SOW

### Business Models, Acquisition, and Recurring Sales

Routing should consider business motion:

- retention
- renewal value proof
- expansion
- assessment
- compliance roadmap
- proposal support
- recurring service packaging

### Partner-Vendor Ecosystem

Routing should identify partner/vendor-heavy recommendations and prefer validation-first examples when commercial data or partner politics are sensitive.

### AI, Automation, Industry, And Signal Quality

Routing should consider signal family:

- AI/automation
- industry/compliance
- external trigger
- internal delivery
- partner/vendor
- relationship/staffing

Routing should avoid forcing a draft when the signal is too weak.

### Consulting Collaboration Incentives and Blockers

Routing should consider collaboration risk:

- low risk: internal pressure-test or quick expert view
- medium risk: relationship-owner approval needed before involving the person
- high risk: validation-first example; no client intro by default

Signals of higher collaboration risk include sensitive client ownership, unclear consultant fit, very senior or busy expert, vendor economics, pricing, proposal politics, or a weak signal that feels like practice promotion.

## Good Public Question Topics

- What kind of signal created this reason to connect?
- Where will this recommendation land?
- What consulting moment or deliverable does this support?
- What hypothesis, evidence gap, or next meeting decision is the other consultant helping with?
- Should the note suggest one consultant, a practice, a small team, or a solution asset?
- What should be validated before anyone is contacted?
- Should vendor or pricing context stay internal?
- Is this an AI/automation, industry/compliance, external trigger, internal delivery, or partner/vendor reason?
- Should the first step be an internal check, a pressure-test, a deliverable review, or a client-facing intro only if approved?
- What would make the relationship owner comfortable using this recommendation?

## Bad Public Question Topics

- hidden scoring weights
- model routing
- lead scoring
- CRM field names
- quota, commission, credit split
- deal-registration mechanics unless user explicitly asks
- "how much revenue can this create?"

## Draft Routing Rule Copy

`Route by the signal that makes another consultant relevant, not by generic topic words. If the setup only contains a vague topic, ask one concise question that would make the reason specific enough to draft.`

`If relationship-owner sensitivity is high or consultant fit is unclear, route toward validation-first behavior instead of a direct connection suggestion.`

## Tone

One concise, natural question. Do not mention examples, hidden routing, scoring, or prompt logic.
