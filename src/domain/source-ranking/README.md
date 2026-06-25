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
- `evidence.ts`: deterministic bundle-level assessment, aggregation, corroboration, and conflict detection.
- `index.ts`: public exports.
- `policy.test.ts`: invariants for the normalized scoring policy.
- `scoring.test.ts`: fixture-backed tests for source-level scoring behavior.
- `evidence.test.ts`: fixture-backed tests for evidence-bundle assessment behavior.

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

## Bundle Assessment API

Use `assessEvidenceBundle` to assess all sources in one evidence bundle:

```ts
const assessment = assessEvidenceBundle({
	bundle,
	now
});
```

Bundle assessment calls `assessSourceForContext` for every source, then combines source assessments into an `EvidenceAssessment`.

The output includes:

- `sourceAssessments`: one source-level assessment per source.
- `strongestTier`: strongest source tier in the bundle.
- `aggregateConfidence`: best-source weighted confidence.
- `aggregateRisk`: best-source weighted risk.
- `bestSourceIds`: source IDs with the highest source-level confidence.
- `likelyOwnerSignals`: deduped likely owners, ordered by owner-signal confidence.
- `corroboratedClaimKinds`: claim kinds supported by at least two sources.
- `conflictingClaimKinds`: claim kinds with both support and contradiction stances.
- `unresolvedWeaknesses`: deduped weaknesses from non-strong sources.

Bundle aggregation uses an 80/20 split from `EVIDENCE_BUNDLE_AGGREGATION_POLICY`:

- 80% comes from the best source or tied best sources.
- 20% comes from the remaining supporting sources.

When a bundle has only one source, the support side falls back to that same source so single-source bundles are not artificially penalized.

## Claim Stance

Claims support the context need by default. A claim can set `stance: 'contradicts'` when it is relevant evidence but argues against another source's claim.

This lets the domain model represent conflict without making a Week 2 automation decision.

Example:

```ts
{
	kind: 'implementationRisk',
	support: 'direct',
	stance: 'contradicts',
	text: 'Timeline risk should not be stated as active.'
}
```

Day 3 only detects conflict at the claim-kind level. It does not decide whether that conflict should produce user review or blocking; Week 2 owns that decision.

## Fixture Data

Synthetic fixtures live in `src/lib/features/source-ranking/fixtures`.

They are prototype evidence bundles used to validate the domain shape and later exercise the scoring and decision engines. Current fixtures cover strong, medium, weak, review, request, and blocked evidence examples.

Each fixture includes local truth metadata under `expected`. These truth values describe the intended future automation decision, expected source tiers, primary source IDs, likely owner IDs, validated claims, weak claims, review prompt type, request owner, or blocked reason. They are hand-authored labels for tests and prototypes, not runtime decisions.

## Evidence Lab Route

The hidden authenticated prototype route lives at:

```txt
/internal-data/evidence-lab
```

It is intentionally direct-URL only and is not linked from app navigation.

The route starts as a data-source catalog. Selecting a fixture opens the dashboard for that fixture. From the dashboard, individual source records can be opened in a reader panel.

The route server-loads fixture assessments through `buildEvidenceLabViewData`, then renders a product-like dashboard for inspecting fixture truth, source assessments, source contents, bundle-level evidence, corroboration, conflicts, and unresolved weaknesses.

Supported query params:

- `fixture`: selected fixture id.
- `source`: selected source id to open in the source reader.
- `now`: assessment timestamp. ISO strings and `datetime-local` values are supported.
- `hide`: source ids to hide before assessment. May be repeated or comma-separated.

Examples:

```txt
/internal-data/evidence-lab?fixture=corroborated-acme-client-concern
/internal-data/evidence-lab?fixture=corroborated-acme-client-concern&source=source-acme-proposal-decision-feedback
/internal-data/evidence-lab?fixture=corroborated-acme-client-concern&hide=source-acme-meeting-notes-readiness
/internal-data/evidence-lab?fixture=strong-current-account-note&now=2027-06-15T12:00
```

The route does not use Convex and does not persist anything. It is a deterministic fixture browser for Week 1 prototyping.

## Testing

Run:

```bash
npm test
```

Current tests validate policy invariants, fixture integrity, local truth metadata, source-level scoring behavior, and bundle-level evidence assessment behavior.

## Next Implementation Step

Implement automation-decision policy that maps an `EvidenceAssessment` into auto handoff, context request, focused user review, or blocked.

Keep scoring deterministic and explainable. Every score should be paired with a reason that can be shown in the prototype UI.
