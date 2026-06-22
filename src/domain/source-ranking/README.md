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
- `scoring.ts`: deterministic source-level scoring and tiering.
- `index.ts`: public exports.
- `policy.test.ts`: invariants for the normalized scoring policy.
- `scoring.test.ts`: fixture-backed tests for source-level scoring behavior.

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

## Scoring API

Use `assessSourceForContext` to score one source against one context need:

```ts
const assessment = assessSourceForContext({
	contextNeed,
	source,
	allSources,
	now
});
```

`now` is injectable so freshness scoring stays deterministic in tests and fixtures.

The assessment includes:

- `scores.confidence`: normalized confidence scores for each confidence dimension.
- `scores.risk`: normalized risk scores, currently sensitivity.
- `aggregateConfidence`: weighted confidence using `SOURCE_RANKING_CONFIDENCE_WEIGHTS`.
- `aggregateRisk`: source risk used by tiering.
- `tier`: `strong`, `medium`, or `weak` using `SOURCE_TIER_POLICY`.
- `matchedClaims`: source claims matching the context need.
- `explanations`: one explanation per score dimension.
- `weaknesses`: low-confidence or high-risk issues the UI can surface.

Tiering is policy-driven:

- Strong sources need high confidence, low risk, enough directness, and enough specificity.
- Medium sources need acceptable confidence and risk.
- Weak sources fail those gates or carry too much risk.

Corroboration can use `allSources`, but full bundle-level assessment is intentionally left for the next implementation step.

## Fixture Data

Synthetic fixtures live in `src/lib/features/source-ranking/fixtures`.

They are prototype evidence bundles used to validate the domain shape and later exercise the scoring and decision engines. Current fixtures cover strong, medium, and weak evidence examples.

## Testing

Run:

```bash
npm test
```

Current tests validate policy invariants, fixture integrity, and source-level scoring behavior.

## Next Implementation Step

Implement evidence-bundle assessment that combines multiple `SourceAssessment` values into an `EvidenceAssessment`.

Keep scoring deterministic and explainable. Every score should be paired with a reason that can be shown in the prototype UI.
