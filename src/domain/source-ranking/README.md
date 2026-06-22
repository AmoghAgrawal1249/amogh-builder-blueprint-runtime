# Source Ranking Domain

This module defines the pure domain model for Data Source Ranking + Weak Source Approval.

It does not call Convex, Clerk, Svelte, or external services. It should stay deterministic and reusable from backend functions, route loaders, fixtures, and prototype UI.

## Mental Model

The system should not ask whether a source is globally good or bad. It should ask whether a source is useful for a specific context need.

```txt
context need + candidate sources
-> source assessments
-> evidence assessment
-> automation decision
```

Week 1 owns the first two layers: representing context needs, sources, claims, owners, normalized scores, source tiers, and evidence bundles.

Week 2 will convert an `EvidenceAssessment` into an automation decision: auto handoff, context request, user review, or blocked.

Week 3 can add trajectory search around those deterministic decisions, but it should not override them.

## Files

- `types.ts`: domain types for context needs, sources, claims, owner signals, scores, assessments, bundles, and fixtures.
- `policy.ts`: centralized thresholds, normalized priors, and confidence weights.
- `index.ts`: public exports.
- `policy.test.ts`: invariants for the normalized scoring policy.

## Scoring Shape

Scores use normalized ML-style values from `0` to `1`.

- `0` means no support, no confidence, or no risk depending on the dimension.
- `1` means maximum support, maximum confidence, or maximum risk depending on the dimension.

Confidence and risk are intentionally separate:

```ts
type SourceScores = {
	confidence: ConfidenceScores;
	risk: RiskScores;
};
```

This matters because a source can be highly specific and authoritative while still being unsafe to automate from, such as sensitive partner-channel material.

## Confidence Dimensions

- `freshness`: how recent the source is.
- `directness`: how closely the source maps to the client, opportunity, or pitch.
- `authority`: whether the source type and creator are trustworthy.
- `ownershipSignal`: whether the source points to a likely human validator.
- `completeness`: whether it answers the actual context need.
- `corroboration`: whether other sources support the same signal.
- `specificity`: whether the source contains concrete usable information.
- `historicalReliability`: whether this type of source has historically worked well.

## Risk Dimensions

- `sensitivity`: whether using the source could be risky because it is confidential, partner-sourced, stale, internal-only, or otherwise unsafe.

Sensitivity should behave as an automation gate, not just a minor score penalty.

## Fixture Data

Synthetic fixtures live in `src/lib/features/source-ranking/fixtures`.

They are prototype evidence bundles used to validate the domain shape and later exercise the scoring and decision engines. Current fixtures cover strong, medium, and weak evidence examples.

## Testing

Run:

```bash
npm test
```

Current tests validate policy invariants and fixture integrity. They do not yet validate scoring output because scoring functions are a Week 1 Day 2 task.

## Next Implementation Step

Implement pure scoring functions that produce `SourceAssessment` values from a `ContextNeed` and `ContextSource`.

Keep scoring deterministic and explainable. Every score should be paired with a reason that can be shown in the prototype UI.
