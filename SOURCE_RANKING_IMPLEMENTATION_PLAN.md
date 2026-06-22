# Data Source Ranking + Weak Source Approval Implementation Plan

## Objective

Build a prototype that evaluates the quality of context before it is used in automated email workflows. The system should decide whether to auto-generate a context handoff, request validation from a likely owner, ask the user to review one weak point, or block automation when the available context is unsafe or unreliable.

The first version uses synthetic but realistic fixtures instead of real CRM, calendar, Drive, proposal, or partner integrations. The deterministic ranking and decision engine remains the source of truth. Agentic workflows can enrich, simulate, or plan around evidence, but they cannot override deterministic policy decisions.

## Product Principles

- Strong evidence should flow with minimal friction.
- Medium evidence should get validated when there is a likely owner.
- Weak evidence should become a focused review or validation request.
- Unsafe evidence should block automation.
- User review should resolve the smallest blocking uncertainty, not the entire email.
- Source quality should be evaluated relative to a specific context need, not globally.
- Every automated decision should be explainable from source attributes, scores, and policy rules.

## Architecture Principles

- Keep the ranking core pure and deterministic under `src/domain/source-ranking`.
- Keep synthetic fixtures separate from domain logic, likely under `src/lib/features/source-ranking/fixtures`.
- Keep UI prototype code under feature folders and routes, not inside the domain engine.
- Let Convex persistence come later unless a flow truly needs saved state.
- Do not wire real outbound emails, real inbox polling, or real third-party integrations in this prototype phase.
- Treat agentic Week 3 workflows as optional planning/simulation layers around the deterministic Week 1 and Week 2 engine.

## Week 1: Ranking Core

### Goal

Build the deterministic core that evaluates sources for a specific context need and explains why each source is strong, medium, or weak.

### Core Questions

- What context does this email workflow need?
- Which sources are candidates for that need?
- Which claims does each source support?
- How strong is each source across the ranking dimensions?
- Why did the source receive its tier?
- Which human owner, if any, can validate the source or claim?

### Domain Model

Create a source-ranking domain module with types for:

- `ContextNeed`: the specific context the email workflow needs.
- `ContextSource`: a synthetic CRM note, meeting, proposal, deck, partner material, or similar source.
- `SourceClaim`: a concrete fact or inference a source may support.
- `OwnerSignal`: a possible human validator such as account owner, opportunity owner, meeting attendee, document author, or proposal owner.
- `SourceScores`: numeric or categorical scores across ranking dimensions.
- `SourceAssessment`: per-source scores, tier, reasons, risks, claims, and owner signal.
- `EvidenceBundle`: one context need plus candidate sources.
- `EvidenceAssessment`: combined source quality and unresolved uncertainties for the bundle.

### Ranking Dimensions

Implement deterministic scoring for:

- `freshness`: recent sources score higher than stale sources.
- `directness`: same-client and same-opportunity evidence scores higher than adjacent or similar-client evidence.
- `authority`: account owners, opportunity owners, final proposals, and owner-authored notes score higher than random documents.
- `ownershipSignal`: sources that identify a likely validator score higher.
- `completeness`: sources that answer the actual context need score higher.
- `corroboration`: repeated signals across multiple sources improve bundle confidence.
- `sensitivity`: partner, confidential, stale, or internal-only material increases risk.
- `specificity`: concrete claims score higher than vague statements.
- `historicalReliability`: trusted source types score higher than historically noisy ones.

### Tiering

Map assessments into tiers:

- `strong`: fresh, direct, specific, low-risk, and sufficiently authoritative.
- `medium`: useful but missing freshness, directness, ownership, completeness, or corroboration.
- `weak`: stale, vague, indirect, sensitive, ownerless, or insufficiently specific.

Sensitivity should behave as a risk gate, not just a confidence penalty. A highly specific sensitive source may still require review.

### Fixtures

Create realistic fixture bundles for:

- Recent CRM/account note from account owner.
- Current opportunity owner note.
- Recent client meeting with clear attendees and useful notes.
- Final proposal plus decision feedback.
- Prior proposal older than one year.
- Same-client adjacent work.
- Meeting title without notes.
- Similar-client proposal.
- Useful document with unclear owner.
- Old generic deck.
- Unverified partner material.
- Vague CRM note.
- Stale account context.

Each fixture should include:

- Context need.
- Candidate sources.
- Candidate claims.
- Owner signals.
- Expected source tiers.
- Expected key explanation points.

### Implementation Steps

1. Add domain types for context needs, sources, claims, owners, scores, and assessments.
2. Add scoring constants and threshold policy in one readable file.
3. Implement one scoring function per dimension.
4. Implement source tier calculation.
5. Implement explanation generation for each score and tier.
6. Implement evidence bundle assessment, including corroboration across sources.
7. Add fixture bundles for strong, medium, weak, and blocked-style scenarios.
8. Add a lightweight prototype surface that can list fixture bundles and show per-source scores and explanations.

### Week 1 Deliverable

A fixture-backed ranking prototype that can:

- Rank each source as strong, medium, or weak.
- Show scores across all ranking dimensions.
- Explain why the source received its tier.
- Identify likely owners or explain why ownership is unclear.
- Show which claims are supported, weakly supported, or unsupported.

### Week 1 Day-By-Day Plan

#### Day 1: Domain Model + Policy Shape

- Define the core types for context needs, sources, claims, owners, source scores, source tiers, and source assessments.
- Decide the score scale for each dimension, such as `0` to `1` or `0` to `100`.
- Create the first policy constants file for thresholds and source-type defaults.
- Define the first fixture bundle shape, but do not create every fixture yet.
- End-of-day output: a readable domain model and enough scaffolding to represent one complete evidence bundle.

#### Day 2: Dimension Scoring

- Implement one pure scoring function per ranking dimension.
- Keep each scoring function small and explainable.
- Add reason generation beside each score so the UI can show why a dimension was high or low.
- Implement source tiering from dimension scores and sensitivity risk.
- End-of-day output: one source can be scored, tiered, and explained end-to-end.

#### Day 3: Fixtures + Evidence Bundle Assessment

- Create strong, medium, and weak source fixtures.
- Add context needs and source claims to each fixture.
- Implement evidence-bundle assessment across multiple sources.
- Add corroboration logic at the bundle level.
- End-of-day output: fixture bundles produce per-source assessments and combined evidence assessment.

#### Day 4: Prototype Surface

- Add a lightweight fixture browser or internal prototype panel.
- Show context need, candidate sources, source scores, tiers, reasons, claims, and owner signals.
- Make strong/medium/weak differences obvious in the UI.
- Keep persistence out of scope.
- End-of-day output: a user can inspect fixture source rankings without reading code.

#### Day 5: Tuning + Verification Buffer

- Tune thresholds using the fixture set.
- Add missing fixture cases for stale, sensitive, vague, and ownerless sources.
- Check that explanations match the mental model from the PDF.
- Run `npm run lint`, `npm run check`, and `npm run build`.
- End-of-day output: Week 1 ranking prototype is stable enough for Week 2 decisioning.

### Week 1 Acceptance Criteria

- Source ranking is deterministic and repeatable.
- Explanations are readable without inspecting code.
- Fixture cases cover strong, medium, and weak examples.
- Corroboration is computed at the evidence-bundle level, not only per source.
- Sensitivity risk can prevent a high-confidence source from being treated as automation-safe.
- `npm run lint`, `npm run check`, and `npm run build` pass.

## Week 2: Automation Decisions + Weak Source Approval

### Goal

Convert ranked evidence into a workflow decision: `autoHandoff`, `generateContextRequest`, `needsUserReview`, or `blocked`.

The user should only be asked to resolve the specific uncertainty blocking automation.

### Decision Outcomes

Implement four decision outcomes:

- `autoHandoff`: sources are strong, fresh, direct, specific, and low-risk.
- `generateContextRequest`: partial or medium evidence exists and there is a likely human owner who can validate or fill the gap.
- `needsUserReview`: evidence may be usable, but one sensitive, weak, or uncertain point requires user judgment.
- `blocked`: no reliable path forward exists, no clear owner exists, or automation would risk sending misleading context.

### Decision Inputs

The decision engine should use:

- Best source tier.
- Aggregate evidence confidence.
- Unresolved uncertainties.
- Sensitivity risk.
- Ownership availability.
- Corroboration strength.
- Unsupported or inferred claims.
- Whether a safe lower-friction alternative exists, such as skipping a claim.

### Focused Weak-Source Prompts

Build prompt generation for cases like:

- Old proposal: ask whether the prior owner should validate before use.
- Similar-client match: ask whether it can be used directionally or should be skipped.
- Unclear owner: ask which owner is most likely to have current context.
- Sensitive partner material: ask whether validation is required before mention.
- Unsupported claim: ask whether the claim is safe to state or should be phrased as a question.

Each prompt should include:

- One specific uncertainty.
- Why it blocks automation.
- The source or claim involved.
- Recommended action.
- Alternative actions.
- Resulting decision if resolved.

### Context Request Generation

For `generateContextRequest`, produce a minimal validation request:

- Who to ask.
- Why that person is likely to know.
- The smallest useful question.
- The source or claim being validated.
- What decision can be unlocked by a useful answer.

The request should not ask a broad question if a narrow one can resolve the uncertainty.

### Implementation Steps

1. Add `AutomationDecision` domain types.
2. Add policy thresholds for each outcome.
3. Implement `decideAutomation(evidenceAssessment)` as a pure function.
4. Implement weak-source review prompt builders.
5. Implement context request prompt builders.
6. Add decision explanations that reference the evidence assessment.
7. Expand fixtures to include expected decisions.
8. Add prototype UI sections for final decision, blockers, review prompts, and context requests.
9. Wire the decision output into the email-format configuration prototype surface.

### Week 2 Deliverable

A working decision engine that can process fixture bundles and produce:

- One of the four automation outcomes.
- Explanation of why that outcome was chosen.
- Focused weak-source approval prompt when needed.
- Minimal context request when a likely owner exists.
- Block reason when no safe path exists.

### Week 2 Day-By-Day Plan

#### Day 1: Decision Types + Policy Rules

- Define `AutomationDecision` types for `autoHandoff`, `generateContextRequest`, `needsUserReview`, and `blocked`.
- Define policy thresholds for each outcome.
- Map evidence-assessment fields to decision inputs.
- Create initial decision explanations.
- End-of-day output: the engine can return a basic official decision for every Week 1 fixture.

#### Day 2: Decision Engine Implementation

- Implement `decideAutomation(evidenceAssessment)` as a pure function.
- Prioritize safety and sensitivity rules before confidence rules.
- Make ownership availability determine whether medium evidence becomes a context request or review/block.
- Add unresolved uncertainty extraction.
- End-of-day output: fixture bundles map consistently to the four outcomes.

#### Day 3: Weak-Source Review Prompts

- Implement focused prompt builders for stale proposals, similar-client matches, unclear owners, sensitive partner material, and unsupported claims.
- Include recommended action and alternatives in every prompt.
- Ensure each prompt asks one specific question.
- End-of-day output: weak cases produce narrow review prompts instead of broad approval requests.

#### Day 4: Context Requests + UI Integration

- Implement minimal context request generation for owner-known medium cases.
- Add decision output to the prototype UI.
- Show the final decision, blockers, context request, review prompt, and explanation.
- Connect the prototype decision display to email-format configuration only at a fixture/demo level.
- End-of-day output: users can inspect the ranking and the resulting automation decision in one place.

#### Day 5: Decision Tuning + Verification Buffer

- Tune policy thresholds against fixture expectations.
- Add expected-decision metadata to fixture bundles.
- Review cases where the engine asks for too much user approval or automates too aggressively.
- Run `npm run lint`, `npm run check`, and `npm run build`.
- End-of-day output: Week 2 engine reliably produces useful workflow decisions from fixture evidence.

### Week 2 Acceptance Criteria

- Strong fixture cases reach `autoHandoff` without unnecessary review.
- Medium fixture cases produce a draft or context request when an owner exists.
- Weak fixture cases produce a focused review or validation prompt.
- Ownerless and unsafe fixture cases reach `blocked`.
- Review prompts never ask the user to review the full email.
- The deterministic decision engine remains the only source of official automation decisions.
- `npm run lint`, `npm run check`, and `npm run build` pass.

## Week 3: Evidence Trajectory Search Lab

### Goal

Build an optional agentic planning and simulation layer that explores possible evidence-resolution paths after Week 2 returns `generateContextRequest`, `needsUserReview`, or `blocked`.

The trajectory system should answer:

What is the safest next action that could move this workflow closer to automation?

### Core Concept

The trajectory lab treats the deterministic Week 1 and Week 2 engine as an oracle. It simulates possible next actions, applies synthetic outcomes, reruns deterministic ranking, and recommends the best path based on safety, friction, latency, and expected decision improvement.

The trajectory lab cannot declare an email safe. It can only explore what might happen if new evidence or approvals were added.

### Agentic Methods Used

- Tree or graph search over evidence states.
- Bounded rollouts over possible actions.
- Synthetic simulation environment.
- Structured trajectory outputs.
- Evaluator scoring for path quality.
- Policy-state-machine constraints.
- Trace-style observability for why paths were accepted or rejected.

### Trajectory Model

Add types for:

- `EvidenceState`: current context need, sources, claims, approvals, and official decision.
- `TrajectoryAction`: a possible next action.
- `SimulatedOutcome`: fixture-backed result of an action.
- `TrajectoryNode`: a state in the search graph.
- `TrajectoryEdge`: an action plus outcome from one state to another.
- `TrajectoryPath`: a sequence of nodes and edges.
- `TrajectoryRun`: the full search result.
- `TrajectoryRecommendation`: the recommended next move and why alternatives were rejected.

### Initial Action Set

Support a small bounded set of actions:

- `askLikelyOwner`: ask a likely source owner or opportunity owner to validate one point.
- `requestContext`: ask for missing context from a likely owner.
- `askUserApproval`: ask the current user to approve a scoped weak point.
- `skipWeakClaim`: remove an unsupported or risky claim from the handoff.
- `downgradeWording`: phrase a claim as uncertainty or a question instead of fact.
- `waitForMoreEvidence`: simulate whether a stronger source appears later.
- `blockAutomation`: stop when no useful safe path exists.

Each action should define:

- Target uncertainty.
- Expected user friction.
- Expected latency.
- Safety impact.
- Required owner or reviewer, if any.
- Allowed current decisions.
- Invalid conditions.

### Synthetic Simulation Fixtures

Extend fixtures with hidden possible outcomes.

Examples:

- Old proposal can be confirmed by prior owner.
- Similar-client example can be approved only as directional context.
- Sensitive partner deck requires validation before any mention.
- Vague meeting title can be corroborated by a CRM note.
- Unsupported implementation-risk claim can be skipped safely.
- Ownerless stale deck remains blocked after all paths.

Each simulated outcome should include:

- Action taken.
- Outcome label.
- New evidence added or changed.
- Whether an approval was granted or denied.
- New uncertainty state.
- Expected deterministic decision after reranking.

### Rollout Engine

Implement bounded search with clear limits:

- Maximum depth: 2 or 3.
- Maximum branches per node: 4 or 5.
- No repeated action on the same unresolved uncertainty.
- No simulated action without fixture support.
- Stop at terminal states.

Terminal states:

- `autoHandoff` reached.
- `blocked` reached with no remaining safe actions.
- Maximum depth reached.
- No valid actions remain.

Each rollout step should:

1. Generate valid actions for the current evidence state.
2. Apply fixture-backed simulated outcomes.
3. Produce a new evidence state.
4. Rerun Week 1 ranking.
5. Rerun Week 2 automation decision.
6. Store the transition as a traceable edge.

### Trajectory Scoring

Score paths using:

- Final deterministic decision.
- Safety improvement.
- Reduction in unresolved uncertainties.
- User friction.
- Expected latency.
- Number of steps.
- Sensitivity risk remaining.
- Whether the path depends on user approval or owner validation.

Recommended path preference should generally be:

- Low-risk `autoHandoff` path.
- Low-friction `generateContextRequest` path.
- Focused `needsUserReview` path.
- Clear `blocked` path when no safer option exists.

High-risk paths should lose even if they appear to reach automation.

### Prototype UI

Build a fixture-backed UI that shows:

- Current Week 2 decision.
- Blocking uncertainties.
- Generated action graph.
- Simulated trajectory tree.
- Recommended next action.
- Expected deterministic decision if the recommendation succeeds.
- Rejected alternatives and why they were rejected.
- Clear labeling that simulated evidence is synthetic.

Example UI copy:

Current decision: Needs User Review

Best next move: Ask Priya to validate whether implementation timeline is still a live concern.

Why: This resolves the stale proposal and unsupported inference at once. If confirmed, the deterministic engine moves this case to Auto Handoff.

Rejected alternatives: Cautious wording still leaves sensitivity unresolved. Skipping the claim avoids risk but loses the most useful handoff context.

### Implementation Steps

1. Add trajectory domain types.
2. Add action definitions and validity rules.
3. Extend fixtures with simulation outcomes.
4. Implement deterministic action generation from evidence states.
5. Implement bounded rollout search.
6. Implement trajectory scoring and recommendation.
7. Add trace/explanation generation for paths.
8. Build fixture-driven trajectory UI.
9. Wire trajectory results next to the Week 2 decision prototype.
10. Keep all official decisions sourced from Week 1 and Week 2 reruns.

### Week 3 Deliverable

A fixture-backed interactive Evidence Trajectory Search Lab that can:

- Start from a ranked evidence bundle and official automation decision.
- Explore possible evidence-resolution paths.
- Simulate outcomes using fixture data.
- Rerun deterministic ranking and decisioning at every step.
- Recommend the safest next move.
- Explain why other paths were rejected.
- Show a readable trajectory trace for demos.

### Week 3 Day-By-Day Plan

#### Day 1: Trajectory Types + Action State Machine

- Define `EvidenceState`, `TrajectoryAction`, `SimulatedOutcome`, `TrajectoryNode`, `TrajectoryEdge`, `TrajectoryPath`, `TrajectoryRun`, and `TrajectoryRecommendation`.
- Define the allowed action set and validity rules.
- Add state-machine constraints so invalid transitions are impossible.
- Keep action generation deterministic for the first version.
- End-of-day output: the system can represent possible next actions without running rollouts yet.

#### Day 2: Simulation Fixtures

- Extend source-ranking fixtures with hidden simulated outcomes.
- Add outcomes for owner confirmation, owner denial, weak approval, weak rejection, claim skipping, wording downgrade, and unresolved context.
- Ensure every simulated outcome produces a new evidence state that Week 1 and Week 2 can process.
- Label all simulated evidence clearly.
- End-of-day output: fixtures can support trajectory simulation without real integrations.

#### Day 3: Rollout Search Engine

- Implement bounded graph/tree expansion.
- Cap depth at 2 or 3 and branch count at 4 or 5.
- Apply one action, simulate one outcome, rerun Week 1 ranking, then rerun Week 2 decisioning.
- Stop at terminal states or max depth.
- End-of-day output: the system can generate full trajectory paths from a weak or medium decision.

#### Day 4: Scoring + Recommendation

- Implement trajectory scoring for safety, friction, latency, uncertainty reduction, and final deterministic decision.
- Generate a recommended next action and recommended path.
- Generate rejected-alternative explanations.
- Add trace output that makes every step inspectable.
- End-of-day output: trajectory runs produce a ranked recommendation, not just a tree.

#### Day 5: Trajectory Lab UI + Verification Buffer

- Build the Evidence Trajectory Search Lab prototype UI.
- Show current decision, blocking uncertainties, possible actions, trajectory tree, recommendation, and rejected paths.
- Add the trajectory panel beside the Week 2 decision prototype.
- Verify that all official final decisions still come from deterministic reruns.
- Run `npm run lint`, `npm run check`, and `npm run build`.
- End-of-day output: Week 3 demo shows a modern agentic search/simulation layer without replacing the policy engine.

### Week 3 Acceptance Criteria

- The trajectory lab never overrides deterministic Week 1 or Week 2 decisions.
- Rollouts are bounded and cannot loop indefinitely.
- Every simulated outcome is fixture-backed and clearly labeled.
- Recommendations optimize for safety before automation.
- UI makes the decision path easier to understand, not harder.
- `npm run lint`, `npm run check`, and `npm run build` pass.

## Future Work After Week 3

### Real Connectors

Replace synthetic fixtures with read-only connector outputs from CRM, calendar, Drive, proposal systems, partner systems, and internal documents.

### Persistent Approval Scope

Persist scoped approvals so weak-source decisions can apply only to a claim, workflow, source type, or time window.

### Context Request Lifecycle

Turn generated context requests into long-running workflows that wait for replies, extract new evidence, and rerun the deterministic decision engine.

### Policy Learning In Shadow Mode

Use approval/rejection history to propose deterministic policy updates, but require explicit human acceptance before changing scoring rules.

### Safety Replay

Run adversarial or counterfactual fixture cases to find unsafe paths before real automation is enabled.

## Verification Commands

Run after each implementation milestone:

```bash
npm run lint
npm run check
npm run build
```
