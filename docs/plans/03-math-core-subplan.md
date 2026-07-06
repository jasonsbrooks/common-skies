# Phase 2 Subplan — Math Core

The one small tested module a reviewer reads first. TypeScript, in `app/src/lib/market-math/`, because the Simulate view recomputes scenarios client-side. The Python pipeline reimplements the same formulas for the historical series; parity is enforced later (Phase 3d) by golden test vectors emitted by the pipeline and asserted here.

## Formulas (O'Brien & Salop 2000; AST 2018 §I)

Shares `s` are within-market, normalized to sum to 1. β_ik = ownership (cash-flow) share of owner *i* in carrier *k*; γ_ij = control share of owner *i* over carrier *j*.

- `HHI = Σ_j s_j²`
- `MHHIΔ = Σ_j Σ_{k≠j} s_j s_k · (Σ_i γ_ij β_ik) / (Σ_i γ_ij β_ij)`

Control assumptions (the assumption toggle):
- **proportional** (AST baseline): γ = β for all reported holders.
- **passive-index** (critics' sharpest construction attack): the Big Three (Vanguard, BlackRock, State Street) exert no control — their γ ≡ 0, so every term they appear in drops; other holders keep γ = β.

Conventions:
- Internal scale 0–1; display scale ×10,000 points (matches how the papers report; regressions use 0–1 — same as our coefficients).
- If carrier *j* has no reported holders under the active assumption (denominator 0), its pair terms contribute 0 (no common-ownership channel through an owner-less firm — the correct treatment for creditor-owned Spirit if its holders fell outside the table, and for the divestiture scenario).

## Prediction arithmetic (regime toggle)

Both papers: `log(fare)` on MHHIΔ and HHI (0–1 scale). For a scenario moving (HHI, MHHIΔ) → (HHI′, MHHIΔ′) under coefficients (β_HHI, β_MHHI):

- concentration channel = β_HHI · ΔHHI (log points)
- common-ownership channel = β_MHHI · ΔMHHIΔ (log points)
- total % fare change = exp(sum) − 1

Shipped coefficient pairs (from docs/plans/02-hour-zero-verifications.md): AST (0.202, HHI 0.255); DGS/critics (0.063, HHI 0.225); custom slider for β_MHHI.

## Scenario helpers

Included here (they're pure arithmetic and make Phase 5 trivial):
- `removeCarrier(shares, carrier)` — exit scenario; remaining shares renormalized proportionally (assumption disclosed in methods panel).
- `divestOwners(ownership, owners)` — drop given owners' stakes (Big-Three-divest scenario).

## Files

```
app/src/lib/market-math/
  types.ts       MarketShares, OwnershipStake, ControlAssumption, coefficient pairs
  hhi.ts         hhi()
  mhhi.ts        mhhiDelta()
  predict.ts     farePrediction() with channel split
  scenario.ts    removeCarrier(), divestOwners()
  index.ts       re-exports
  *.test.ts      vitest
```

`app/` gets a minimal hand-written `package.json` (typescript + vitest only); Phase 4 adds Vite/React to the same package rather than re-scaffolding.

## Tests (hand-computed cases in comments)

1. HHI: monopoly = 10,000; symmetric duopoly = 5,000; shares auto-normalized.
2. MHHIΔ symmetric duopoly, one owner holds 100% of both: profit weights 1 → MHHIΔ = 5,000 (merger-equivalent). Same with two identical diversified owners.
3. Separate ownership (owner A holds only firm 1, owner B only firm 2) → MHHIΔ = 0.
4. Asymmetric hand-worked example (worked arithmetic in the test comment, ~4 owners × 2 carriers).
5. Assumption toggle: Big-Three-only cross-holdings → MHHIΔ large under proportional, 0 under passive-index; a non-Big-Three overlapping holder keeps it > 0 under passive-index.
6. Zero-denominator carrier contributes 0 pair terms (no NaN).
7. Prediction: known deltas → exact channel log-points and % change; zero-coefficient regime zeroes only the common-ownership channel.
8. Scenario helpers: removal renormalizes to 1; divest drops the right stakes.

## Commits

1. `docs: math core subplan` (this file)
2. `math: HHI/MHHIΔ core with both control assumptions + prediction arithmetic, tested`
