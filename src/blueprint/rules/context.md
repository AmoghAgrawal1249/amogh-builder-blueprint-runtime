# rules/context.ts Notes

Purpose: default AI context for the builder when no richer app context exists.

## Export

`BRING_THE_FIRM_DEFAULT_AI_CONTEXT`

Target rename when implementation changes: `REASONS_TO_CONNECT_DEFAULT_AI_CONTEXT`.

## Research Contributions

### Existing Workflows and Integration Points

Context should tell the model:

- the user is designing internal recommendation formats, not generic outbound email
- recommendations must fit existing account, PSA, CRM, QBR, proposal, partner, and service workflows
- the account owner, service owner, or workflow owner may need to approve before action
- "where this lands" matters as much as the recommendation itself

### Consulting Operating Model

Context should tell the model:

- consulting firms often operate across account ownership, pursuit/proposal, staffing, delivery, practice expertise, and follow-on work
- a reason to connect should identify where it fits in that operating model
- the note should support the relationship owner, engagement manager, practice lead, or delivery owner rather than bypass them
- a consultant/practice/team/asset is useful only if it improves the client work at that moment

### Consultant Problem-Solving and Meeting Prep

Context should tell the model:

- consultants work from a problem, hypothesis, evidence, stakeholder context, and next decision
- the note should help sharpen a client hypothesis before a meeting, proposal, readout, or workshop
- a good recommendation says what the other consultant can pressure-test, validate, add evidence to, or help explain

### Consultant Delivery Formats and Diagnosis

Context should tell the model:

- consulting outputs often include assessments, current-state findings, future-state options, business cases, roadmaps, risk heatmaps, workshops, operating models, and proposal/SOW reviews
- company diagnosis may inspect strategy, market/customer, financial model, operating model, organization, process, people, technology/data, governance, risk, and compliance
- the note should name the deliverable or diagnosis layer when it makes the connection more credible

### Business Models, Acquisition, and Recurring Sales

Context should tell the model:

- MSPs differ by business model: core MSP, MSSP, regulated/vertical MSP, public-sector MSP, roll-up/platform, standardized MSP group, parent-company acquired MSP, marketplace/platform, MSP-for-MSP provider, and IT management alternative
- recommendations should support acquisition-to-expansion motion, recurring revenue, QBRs, renewals, assessments, compliance, lifecycle, proposal, package, and service-capacity workflows
- client-helping language beats revenue language

### Partner-Vendor Ecosystem

Context should tell the model:

- partner/vendor data can create useful signals and political risk
- hyperscalers, distributors, hardware vendors, security vendors, backup vendors, compliance tools, PSA/RMM/QBR/CPQ platforms, and marketplaces all generate recommendation inputs
- vendor incentives, margin, rebate, MDF, bookings, pricing, distributor economics, and partner-of-record data are sensitive
- the client-specific reason must come before vendor economics
- account owner or partner owner validation is often required before naming a vendor, registering a deal, inviting a seller, or using pricing/renewal data

### AI and Automation

Context should tell the model:

- AI recommendations must be tied to a named workflow, not a generic productivity claim
- client-facing AI should start with readiness, governance, data, adoption, and success metrics
- Copilot should be treated as a data permissions and adoption project, not only a license rollout
- internal MSP automation should preserve human approval for risky actions
- AI-derived signals are inputs, not final advice
- automation should not write to PSA/RMM/CRM/QBR systems unless ownership, confidence, and approval rules are clear

### Client Industry-Specific Sales

Context should tell the model:

- client industry changes the buyer, risk, timing, source systems, and wording
- industry labels are not enough for a recommendation
- line-of-business systems, regulated data, operational workflows, and decision gates create stronger signals
- regulated drafts must avoid compliance guarantees
- public-sector and grant-funded drafts must avoid procurement conflict
- operational drafts should name the revenue-producing object, such as production line, jobsite, route, register, or dispatch board

### Consulting Collaboration Incentives and Blockers

Context should tell the model:

- Reasons to Connect is about substantive internal collaboration, not cross-selling
- the relationship owner may worry about client control, trust, credit, timing, or extra coordination work
- the note should make the relationship owner look prepared and in control
- the collaborator should have a clear contribution, such as validating, pressure-testing, adding evidence, reviewing a deliverable, or preparing a meeting angle
- the first ask should usually be small and internal before any client-facing introduction
- if the recommendation would create collaboration overload or political risk, it should become a caveated validation-first note

## Field Guidance

### `personContext`

Say the user is designing recommendation formats for an MSP, MSSP, IT services firm, MSP platform, marketplace, parent-company acquired MSP, standardized MSP group, MSP-for-MSP provider, or consulting/professional-services firm.

### `conversationReason`

Say they want to turn account, service, vendor, lifecycle, renewal, proposal, staffing, relationship, procurement, AI, automation, industry, and partner-program signals into internal recommendations.

### `formatUse`

Say the format should help account owners, vCIOs, service leaders, revenue leaders, partner teams, procurement/licensing specialists, platform operators, security leaders, or consultants decide:

- why this client
- why now
- what evidence supports the idea
- which system or partner produced the signal
- who validates it
- what commercial data must stay internal
- what small next step is safe
- whether human review is required for AI-generated output or automated action
- what industry-specific proof supports the recommendation
- whether a decision gate, seasonal window, or operational workflow changes the next step
- what consulting stage or client moment the note supports
- what hypothesis, deliverable, or diagnosis gap the other consultant improves
- what the other consultant would actually contribute
- how the relationship owner stays in control
- whether the first step should be internal only
- whether the collaboration ask is small enough to be accepted

## Draft Context Copy

`You are helping an MSP, MSSP, IT services firm, MSP platform, marketplace, parent-company acquired MSP, standardized MSP group, MSP-for-MSP provider, or consulting/professional-services firm define internal Reasons to Connect recommendation formats.`

`This person wants to turn account, service, partner/vendor, renewal, lifecycle, proposal, security, backup, compliance, staffing, procurement, AI, automation, industry, external-trigger, and relationship signals into useful internal recommendations for client-facing teams.`

`You are helping them build a format for recommendations sent to account managers, vCIOs, service leaders, revenue leaders, partner teams, procurement/licensing specialists, platform operators, security leaders, or consultants. The recommendation should explain why this client, why now, what evidence supports the idea, which source system or partner produced the signal, who validates it, what commercial data must stay internal, and what the smallest safe next step is.`

Consulting-work addition:

`If the recommendation is tied to a consulting workflow, it should name the client moment, working hypothesis, deliverable, diagnosis layer, or next meeting decision that the other consultant can improve. Do not suggest an expert just because their practice area sounds adjacent.`

AI/automation addition:

`If the recommendation involves AI or automation, it should name the workflow, data source, owner, approval point, risk level, and success metric. Do not recommend AI generically or imply autonomous action without human-review rules.`

Industry-specific addition:

`If the recommendation depends on the client's industry, it should name the workflow, line-of-business system, regulated data, decision gate, buyer, or operational risk that makes the recommendation credible. Do not use industry labels as fake specificity.`

Collaboration addition:

`If the recommendation involves another consultant, practice, or team, it should explain the collaborator's specific contribution and preserve the relationship owner's control. Prefer a small internal check or pressure-test before suggesting a client-facing introduction. Do not frame the note as cross-selling.`

## Tone

Keep compact enough for prompt context. Do not paste research prose into the runtime context.
