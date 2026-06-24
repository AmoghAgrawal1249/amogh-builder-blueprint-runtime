# Source Ranking Fixtures

This folder contains synthetic evidence bundles for the source-ranking prototype.

The fixtures are intentionally realistic, but they are not connected to real CRM, calendar, Drive, proposal, partner, or email systems.

## Current Coverage

- Strong evidence: a recent same-client CRM note from the account owner.
- Strong evidence: a current opportunity-owner note.
- Medium evidence: an older same-client proposal with useful detail and a likely owner.
- Medium evidence: a meeting title without notes but with a likely attendee validator.
- Medium evidence: a customer email with partial context.
- Medium evidence: same-client adjacent account work.
- Weak evidence: a stale similar-client proposal.
- Weak evidence: stale sensitive partner material with no clear owner.
- Blocked evidence: a stale generic deck with no owner or client-specific path forward.
- Needs-review evidence: a useful same-client document with unclear ownership and inferred claims.
- Corroborated evidence: meeting notes and proposal feedback supporting the same claim kinds.
- Conflicting evidence: a current note contradicting stale proposal context with claim-level stance.

The current fixture set covers these source kinds:

- `accountNote`
- `crmNote`
- `deck`
- `document`
- `email`
- `meeting`
- `opportunityNote`
- `partnerMaterial`
- `proposal`

## Fixture Requirements

Each fixture should include:

- One `ContextNeed`.
- One or more `ContextSource` records.
- Source claims that relate to the context need.
- Owner signals when a likely validator exists.
- Expected tier metadata for prototype validation.
- Local truth metadata for expected automation behavior.

## Local Truth Values

Each fixture stores truth values in `expected`.

These values are not produced by the source-ranking engine. They are local labels that let future work validate scoring, decisioning, UI states, and trajectory simulations.

Truth metadata includes:

- `strongestTier`: expected strongest source tier in the bundle.
- `sourceTiers`: expected tier for every source in the bundle.
- `automationDecision`: expected future Week 2 decision: `autoHandoff`, `generateContextRequest`, `needsUserReview`, or `blocked`.
- `primarySourceIds`: sources the future decision should rely on.
- `likelyOwnerIds`: owners the system should consider as validators.
- `validatedClaimIds`: claims that are safe or directly supported.
- `weakClaimIds`: claims that should require validation, review, cautious wording, or blocking.
- `contextRequestOwnerId`: owner to ask when the truth decision is `generateContextRequest`.
- `reviewPromptKind`: expected focused review category when the truth decision is `needsUserReview`.
- `blockedReason`: expected blocking reason when the truth decision is `blocked`.
- `notes`: short explanation of the fixture's intended lesson.
- `corroboratedClaimKinds`: claim kinds expected to appear as corroborated in bundle assessment.
- `conflictingClaimKinds`: claim kinds expected to appear as conflicting in bundle assessment.

## Test Coverage

`source-ranking-fixtures.test.ts` checks that fixture IDs are unique, expected source tiers reference existing sources, required context claims are present, dates are valid, owner confidence values are normalized, source-kind coverage is present, automation decisions are covered, local truth metadata references real source, claim, and owner IDs, and corroboration/conflict truth cases exist.

## Adding More Fixtures

Prefer adding targeted cases that teach the ranking model a new behavior.

Good next cases:

- Vague CRM note.
- Final proposal plus decision feedback.
- Multiple sources that corroborate the same client concern.
- Conflicting sources where one source supports and another source contradicts a claim.
- Human-validated weak source approval.
- Source that should become strong only after corroboration.
