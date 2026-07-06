# Common Skies — High-Level Project Plan

## Context

Building **Common Skies** (name TBD): an interactive static site teaching the common-ownership fight in airline economics — "do index funds make plane tickets more expensive?" — per the brief at `~/Downloads/common-skies-brief-v2.md`. Target: Anthropic SWE take-home, Theme 1 (Exploration & Understanding). Deliverables: deployed prototype, GitHub repo, ~5min video + written rationale, AI transcripts.

The core product idea: the disputed joints of the AST-vs-critics literature become UI toggles — the user flips assumptions and watches the answer change. Closer: a pre-registered difference-in-differences prediction about Spirit Airlines' May 2, 2026 shutdown.

**Working style (Jason's ground rules):**
- Small concrete chunks as a **Sapling stack** (`sl commit` / `sl amend` / `sl absorb`), local only — **no push to GitHub until Jason says so**; PRs happen at the end.
- This high-level plan first, then a **subplan per phase** before implementing it (subplans live in-repo at `docs/plans/` — they're part of the judgment trail graders want).
- Brainstorm openly; ask rather than assume on genuinely open questions.

**Decisions locked with Jason (2026-07-05):**
- **50 routes**, via pull-everything + automated QA gates (completeness, share-sum sanity, fare outliers); rank by passenger volume, ship top 50 that pass. Fall back to 20 only if gates show hand-inspection is unavoidable.
- **Assumption toggle ships in v1** (AST proportional control vs. passive-index MHHI construction — both precomputed by the pipeline).
- **Learn view is a full section** (toy two-airline model), with the cut-to-tooltips fallback preserved.
- Local Sapling stack; push/PRs deferred until end.
- **Intro = hero + story rail.** Headline is the research question ("Do index funds make your plane tickets more expensive?"), two-sentence setup, and the two camps introduced as named/color-coded characters (AST 2018 vs. DGS 2022 cards) — because the toggles literally are the camps. Nav is a numbered progression: ① Learn → ② Explore → ③ Simulate → ④ The Prediction, with free play at each station.
- **Toggle-companion visuals (committed): the ownership web + the fare receipt.**
  - *Ownership web:* persistent fund→airline network graphic — carriers on the bottom row, institutional holders above, edges weighted by stake. HHI sees only the bottom row; MHHI sees the wiring. Assumption toggle visibly greys out the Big Three's edges. The slider-driven toy version of this same component **is** the Learn view; compact versions accompany Explore and Simulate. One React component, three uses.
  - *Fare receipt:* Simulate's prediction rendered as an itemized airline-style receipt — base fare, concentration line, and a "common-ownership premium — disputed" line item that grows/collapses with the regime toggle.
  - Camp color-theming throughout; toggle flips animate (series morph, not snap) since both variants are precomputed. Plain-English translation sentence under the toggles is a stretch nice-to-have, not committed.

**Budget tension to manage:** the brief's honest estimate is 8–9h; the assignment's hard cap is 8h. The pre-committed cut order absorbs the overage. Track time per phase.

## Environment facts

- Empty dir at `/Users/jason/Documents/Code 2.0/common-skies` (only `.claude/`). Not yet a repo — Phase 1 runs `sl init --git .` (Sapling 0.2.x, git-backed).
- Node v26, Python 3.13, no duckdb CLI (use the Python `duckdb` package in a venv or `uv`).

## Repo layout

```
common-skies/
  pipeline/            # Python: download → transform → compute → emit bundle
  data/
    raw/               # cached BTS/DOT downloads (gitignore if large)
    curated/           # hand-curated: ownership snapshots, coefficients, events, airport→city crosswalk
    bundle/            # built JSON artifact the app loads (checked in — reviewers never rerun)
  app/                 # Vite + React + TS static site; all interaction client-side
    src/lib/market-math/   # THE math core: HHI, MHHIΔ (×2 control assumptions), prediction arithmetic
  docs/
    plans/             # this plan + per-phase subplans
    prereg/            # dated pre-registration artifact (footer shows its commit hash)
    rationale.md       # written deliverable
```

## Architecture spine

- **Pipeline (Python + DuckDB), offline, idempotent.** Emits one JSON bundle: per-route-per-quarter `{carriers, shares, avg fare, HHI, MHHIΔ_ast, MHHIΔ_passive}`, event annotations, ownership snapshots, cited coefficients, DiD treatment/control route sets, and scenario inputs.
- **Math core lives in TypeScript** (`app/src/lib/market-math/`) — it's what the Simulate view recomputes client-side, and it's "the file a reviewer reads first." The Python pipeline implements the same formulas for the historical series; **parity is enforced by golden test vectors**: the pipeline emits input/output vectors as JSON, and vitest asserts the TS core reproduces them exactly. Two implementations, one tested truth.
- **Toggles are cheap by construction:** assumption toggle swaps precomputed columns; regime toggle is linear arithmetic on MHHIΔ (AST coefficient / critics' near-zero / custom slider).
- **Deploy:** GitHub Pages from the same repo (static, no keys, no backend). Deferred until push time.

## Phases → stack outline

Each phase = subplan doc first, then 1–4 small `sl` commits. Rough time from the brief's budget.

**Phase 0 — Hour-zero verifications (~0.5h)** — everything downstream depends on these; findings recorded in `docs/plans/00-verifications.md` (first real commit after scaffold):
1. Latest published DOT Consumer Airfare Report (Table 6) quarter — did the DB1B→DB1C transition shift cadence?
2. T-100 Domestic Segment download works end-to-end today.
3. Spirit's post-March-2025 emergence ownership (creditor-owned, out of the index pool) — confirm against filings.
4. AST and DGS coefficient values from the papers' tables; O'Brien & Salop citation.
5. DB1C release schedule → derive the actual check-back dates the site displays.

**Phase 1 — Scaffold (~0.25h):** `sl init --git .`, README stub, `.gitignore`, directory skeleton, copy this plan into `docs/plans/`.

**Phase 2 — Math core + tests (~1h, TS):** HHI; MHHIΔ under (a) proportional control by all holders, (b) passive-index (Big Three exert no control); channel-split fare prediction (ΔHHI vs ΔMHHI terms × regime coefficient). Unit tests from hand-computed and literature examples. No UI yet.

**Phase 3 — Pipeline (~2h, Python):**
- 3a. Fares ingestion (Consumer Airfare Report city-pair quarterly averages).
- 3b. T-100 segment passengers → quarterly route shares, via airport→city crosswalk (NYC = JFK+LGA+EWR, etc.).
- 3c. Curated inputs land as CSVs: ownership snapshots (~8 holders × 8 carriers × 4 snapshots ~2016/2019/2021/2025), coefficients, events. **This is the ~1.5h research chunk** — includes the Spirit-as-creditor-owned and Frontier-under-Indigo wrinkles.
- 3d. Compute HHI + MHHIΔ (both assumptions) per route-quarter; emit **golden vectors**; add TS parity test. Pipeline-side test: annotated events visibly move the MHHI line (chart-story coherence checked in data, not eyeballs).
- 3e. Route QA gates + top-50 selection; DiD treatment set (Spirit ≥15% share, last full pre-shutdown quarter) and matched controls (distance bucket + volume, zero Spirit share trailing 4q); emit bundle.

**Phase 4 — App: Explore view + shell (~2h)** — the spine:
- 4a. Vite + React + TS scaffold; bundle loading; hero + story-rail shell (headline question, camp cards, numbered nav); route picker.
- 4b. Per-route charts: fare, shares, HHI, MHHIΔ with event annotations (COVID, Buffett exit 2020, Alaska–Hawaiian 2024, Spirit bankruptcies). Toggle flips morph the series (animate between precomputed variants), never snap.
- 4c. Both toggles wired globally (column swap + coefficient select/custom), camp-themed.
- 4d. **Ownership-web component** (fund→airline network, edge weight = stake, assumption toggle greys the Big Three's edges); compact instance beside the Explore charts.

**Phase 5 — Simulate view + scenario engine (~1.25h):** Spirit shutdown (flagship — including the "index funds had already lost this one" beat) and Big Three divest. Recomputes via the TS math core; channel-split prediction rendered as the **fare receipt** (itemized, with the disputed common-ownership line reacting to the regime toggle); compact ownership web shows the scenario's before/after. Stretch (first to cut): United–JetBlue merger, monopoly teaching case, translation sentence.

**Phase 6 — Learn view (~0.5h):** the slider-driven toy instance of the ownership-web component — two imaginary airlines, drag common-ownership stakes, HHI vs MHHI side-by-side (HHI flat, MHHI climbs). Mostly reuses 4d. Cut-to-tooltips fallback if behind.

**Phase 7 — Pre-registration + methods panel (~0.75h):** dated prereg artifact in `docs/prereg/` (DiD quantity under each toggle config); site footer shows its commit hash; methods panel with steelmanned both-camps summary + named simplifications (segment-vs-market passengers, snapshotted ownership, top-8 holders, airport aggregation); citations-on-every-number pass.

**Phase 8 — Ship (~1.5h):** on Jason's go — push stack as PRs, GitHub Pages deploy, ~5min scripted video (one retake), `docs/rationale.md`, transcript curation.

## Pre-committed cut order (never renegotiated)

monopoly + merger scenarios → fare receipt reverts to a plain channel-split bar → Learn view collapses to tooltips → routes 50 → 20 → 12 → assumption toggle becomes methods-panel note. The ownership web is cut last among visuals (it *is* the Learn view and the mechanism explainer). **Never cut:** the DiD closer, citations, the regime toggle.

## Verification

- **Pipeline:** `pytest`; rerun is deterministic (same inputs → byte-identical bundle); chart-story coherence test (events move MHHI).
- **Math parity:** vitest golden-vector suite (TS core == Python pipeline outputs).
- **App:** vitest for math core; local dev-server walkthrough of all three views + both toggles (I can drive/screenshot via preview tools); fresh-clone check: `pipeline` rerun + `npm run build` both pass from scratch.
- **Deploy (Phase 8):** live URL loads with no network calls beyond the static bundle.

## Open items to brainstorm as we go

- Final name ("Common Skies" is working title).
- Charting approach (lean: hand-rolled SVG + d3-scale for full annotation control vs. a chart lib) — decide in Phase 4 subplan.
- Exact split of scenario math: precompute scenario outputs in pipeline vs. recompute client-side in math core (leaning client-side — it makes the math core load-bearing and the custom coefficient free).
