# definition.ts Notes

Purpose: app manifest and public positioning for the builder.

## Export

`bringTheFirmManifest`

Target rename when implementation changes: `reasonsToConnectManifest`.

## Research Contributions

### Existing Workflows and Integration Points

Manifest copy should tell the user this builder designs internal recommendation formats that fit existing account, PSA, CRM, QBR, proposal, partner, and service workflows.

The product should not sound like a new workflow layer. It should sound like a lightweight format for explaining why one consultant, practice, team, or asset may be useful in a client situation already underway.

### Consulting Operating Model

Manifest copy should also fit how consulting firms actually work: client relationship ownership, pursuit/proposal work, staffing, delivery, expert/practice support, steering meetings, and follow-on account work.

The builder should not imply that it changes the firm's operating model. It should help a consultant notice where another practice or expert fits into an existing client moment.

### Consultant Problem-Solving and Meeting Prep

Public positioning should signal that the note helps consultants prepare better for a real client conversation by clarifying:

- the client problem or hypothesis
- the evidence behind it
- the specialist who can sharpen it
- the next decision or discussion the meeting needs to support

### Consultant Delivery Formats and Diagnosis

Manifest copy may mention that Reasons to Connect can support assessments, executive readouts, options analysis, business cases, roadmaps, operating-model work, risk heatmaps, workshops, and proposal/SOW reviews.

The key is not the deliverable itself; it is identifying which diagnosis layer or deliverable gap another consultant can improve.

### Business Models, Acquisition, and Recurring Sales

Public copy should include recurring account work, renewal, expansion, compliance, assessment, package, lifecycle, proposal, and service-capacity motions.

Avoid making the feature sound like generic lead generation. The value is turning firm knowledge and client signals into credible internal "reasons to connect."

### Partner-Vendor Ecosystem

Manifest details should acknowledge partner/vendor signals, but should not frame vendor economics as the client reason. Vendor data is an input; the output must explain why the client situation makes the connection useful.

### AI, Automation, Industry, And Signal Quality

Manifest should say the format can use AI, automation, industry, external, and internal signals, but only when they create a specific, timely, evidence-backed reason to involve another consultant.

### Consulting Collaboration Incentives and Blockers

Manifest copy should make clear that the builder creates low-risk internal collaboration notes, not cross-selling prompts.

The core product promise should protect the relationship owner:

- the note helps them decide whether another consultant is useful
- it does not bypass their control of the client
- it explains the collaborator's exact contribution
- it keeps the first ask small enough to respect billable time and collaboration load
- it frames collaboration around client value, not firm revenue or practice exposure

## Field Guidance

### `title`

Use a product name closer to "Reasons to Connect" than "Bring the firm" if the repo direction changes.

### `description`

Should describe internal consultant-to-consultant or consultant-to-relationship-owner recommendations.

Suggested direction:

`Create internal reasons-to-connect notes that explain why another consultant, practice, team, or asset may help with a specific client situation while keeping the relationship owner in control.`

### `details.paragraphs`

Should explain:

- the builder reviews account, service, partner, lifecycle, proposal, relationship, industry, AI, automation, and external-trigger signals
- the output is a short internal note, not generic outbound email
- the best note explains why this client, why now, why this consultant or capability, what evidence supports it, how it helps the relationship owner, and what safe next step is suggested

## Draft Manifest Copy

`Reasons to Connect helps teams turn account, service, partner, industry, AI, automation, and external-trigger signals into internal recommendations for asking the right consultant, practice, team, or asset for help at the right moment.`

`The guided setup captures where the recommendation will land, what signal triggered it, who owns the relationship, what the collaborator would contribute, what needs validation, and what evidence makes the connection useful without turning it into cross-selling.`

## Tone

Compact product positioning. Do not paste research prose into the manifest.
