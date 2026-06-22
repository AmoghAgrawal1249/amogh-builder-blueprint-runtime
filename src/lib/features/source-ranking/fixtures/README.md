# Source Ranking Fixtures

This folder contains synthetic evidence bundles for the source-ranking prototype.

The fixtures are intentionally realistic, but they are not connected to real CRM, calendar, Drive, proposal, partner, or email systems.

## Current Coverage

- Strong evidence: a recent same-client CRM note from the account owner.
- Medium evidence: an older same-client proposal with useful detail and a likely owner.
- Weak evidence: stale sensitive partner material with no clear owner.

## Fixture Requirements

Each fixture should include:

- One `ContextNeed`.
- One or more `ContextSource` records.
- Source claims that relate to the context need.
- Owner signals when a likely validator exists.
- Expected tier metadata for prototype validation.

## Test Coverage

`source-ranking-fixtures.test.ts` checks that fixture IDs are unique, expected source tiers reference existing sources, required context claims are present, dates are valid, owner confidence values are normalized, and the strong/medium/weak cases are represented.

## Adding More Fixtures

Prefer adding targeted cases that teach the ranking model a new behavior.

Good next cases:

- Meeting title without notes.
- Similar-client proposal.
- Same-client adjacent work.
- Vague CRM note.
- Final proposal plus decision feedback.
- Multiple sources that corroborate the same client concern.
