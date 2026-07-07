# Common Skies — Build Brief v2

**One-liner:** An interactive site that teaches one of the biggest open fights in economics — "do index funds make your plane tickets more expensive?" — and lets you judge it yourself on a decade of real airline data, closing with a pre-registered, difference-in-differences prediction about the natural experiment that began May 2, 2026, when Spirit Airlines went out of business.

**Project shape:** an exploration-and-understanding tool. One core interaction — *put the contested assumptions on the interface and let the user be the judge* — presented through three views. Fully self-contained: static site, bundled data, no keys, no backend, nothing external at demo time.

---

## The thesis

In 2018, Azar, Schmalz, and Tecu ("AST") argued in the *Journal of Finance* that common ownership — Vanguard, BlackRock, and State Street owning large stakes in *every* major airline simultaneously — softens competition and raises fares. Rebuttals (notably Dennis, Gerardi & Schenone, *JF* 2022) argue the effect vanishes under different assumptions; AST counter-rebutted; the fight remains unresolved and the stakes touch anyone with a 401(k).

Every existing explainer picks a side. This tool doesn't. The disputed choices become the interface: the user flips them and watches the answer change. What it ultimately teaches is bigger than airline economics — *contested empirical claims are contested at specific, findable joints, and a good tool shows you the joints instead of laundering a verdict.*

## What the reviewer experiences (first 3 minutes)

Sixty seconds in the toy model: two imaginary airlines, drag a slider that raises how much of both is held by the same funds. HHI doesn't move; MHHI climbs. The mechanism lands.

Then a route they've actually flown: SFO–JFK, 2014–2025 by quarter — carriers, shares, average fare, HHI, MHHI delta — with real events annotated (COVID, Buffett's 2020 exit, Alaska–Hawaiian 2024, Spirit's bankruptcies).

Then the trial: run the Spirit-shutdown scenario. The predicted fare change appears *split into channels* — ordinary concentration vs. common ownership — and swings from "fares jump" to "barely anything" as they flip the regime toggle between AST's coefficient and the critics'. Last screen: the pre-registered prediction and the date reality reports back.

## The interface: one interaction, two toggles, three views

**The two toggles (the product's core):**

1. **Assumption toggle — how MHHI delta is *constructed*.** The critics' sharpest attacks target the construction itself, not just the fare regression. Ship two precomputed variants: (a) AST baseline — proportional control by all reported holders; (b) "passive index" — the Big Three exert no control, so their cross-holdings don't count. The pipeline computes both series offline; the toggle swaps columns. This is the deepest disputed joint in the literature, made flippable.
2. **Regime toggle — how much a unit of MHHI delta *moves fares*.** AST's published coefficient, the critics' near-zero estimate, or a custom value — pulled from the papers' tables at build time (verify exact values then), cited next to every number.

**View 1 — Learn (toy model).** Two airlines, ownership sliders, HHI vs. MHHI side by side. Collapses into tooltips if time runs short.

**View 2 — Explore (real history).** Route picker over the top ~20 busiest US city-pair markets (cut from 50 — see budget), quarterly 2014–2025. Both toggles live here too: flip "passive index" and watch a decade of MHHI delta deflate.

**View 3 — Simulate (the trial).** Scenarios: **Spirit shutdown** (the flagship) and **"Big Three divest all airline stock"** (the thesis-clean case) ship in v1; United–JetBlue and the monopoly teaching case (MHHI delta → 0, only HHI remains) are stretch. Each recomputes HHI and MHHI delta and shows the channel-split fare prediction under the current toggle settings.

**The Spirit wrinkle — now a feature.** After emerging from its first bankruptcy in March 2025, Spirit's equity went to former creditors, not index funds — by shutdown, Spirit had largely *left* the common-ownership pool. So its exit moves concentration a lot and the common-ownership term comparatively little, and the app says so: "the index funds had already lost this one." Ownership snapshots must encode this (verify against Spirit's post-emergence filings during curation). A naive 2019-ownership treatment here would be wrong; the correct treatment is the best teaching beat in the app.

## The closer: a pre-registered natural experiment, done honestly

Spirit's collapse was precipitated partly by the Iran-war jet-fuel spike — which raises fares on *all* routes. A naive before/after on ex-Spirit routes conflates fuel with exit. So the registered prediction is a **difference-in-differences**:

- **Treatment:** the busiest routes where Spirit held ≥15% share in the last full pre-shutdown quarter.
- **Control:** routes matched on distance bucket and passenger volume with zero Spirit share for the trailing four quarters.
- **Registered quantity:** the treatment-minus-control fare spread, Q3 2026 vs. a Q1 2026 baseline, predicted under each toggle configuration.
- **Commitment mechanism:** predictions live in a dated repo artifact; the site footer shows the commit hash. "Pre-registered" is verifiable, not asserted.

**Check-back date, derived not vibed:** DB1B retired July 2025; its replacement DB1C is a monthly 40% ticket sample whose first release (Jul–Sep 2025) landed February 2026 — a ~5-month lag. So May–June 2026 monthly data arrives ~late 2026, and the full Q3 2026 verdict ~Q1 2027. The site displays the actual expected dates (verify the schedule at build time). Because the tool never picks a side, the closer is outcome-proof: any result vindicates one regime setting, and the tool's neutrality is what makes that true.

## Design commitments

- **Neutrality as architecture.** The tool never declares a winner. Both camps' numbers appear with citations; the methods panel steelmans both.
- **Citations on every number.** Coefficients, ownership stakes, event dates — sourced inline.
- **Named simplifications, in-app.** Methods panel discloses: T-100 gives *segment* passengers while fares are *market*-level (AST used DB1B ticket samples; DB1C is the successor); ownership is snapshotted, not continuous; holders below the top ~8 are excluded; city-pairs aggregate airports via a published crosswalk (NYC = JFK+LGA+EWR, etc.).
- **Unit-tested math core.** HHI, MHHI delta under both control assumptions, and the prediction arithmetic live in one small tested module — the file a reviewer reads first.

## Data plan (corrected)

1. **DOT Consumer Airfare Report (Table 6)** — quarterly average fares per city-pair market. Small, clean CSV/API. *Hour-zero check: confirm latest published quarter (the DB1B→DB1C transition may have shifted its cadence).*
2. **BTS T-100 Domestic Segment** — monthly passengers by carrier per segment → quarterly route shares. Requires the airport→city crosswalk.
3. **Hand-curated ownership table** — top ~8 institutional holders × 8 carriers (AA, DL, UA, WN, AS, B6, NK, F9) × **four snapshots (~2016, 2019, 2021, 2025)** chosen so annotated events produce visible steps in the MHHI line: Berkshire's entry era, pre-exit peak, post-Buffett-exit, and Spirit-as-creditor-owned / Frontier-under-Indigo (a second nice wrinkle: not every airline is index-owned alike). ~250 rows from DEF 14A/10-K filings. Budget 1.5h; it's research time, not code time.
4. **Published coefficients** — AST and DGS estimates from the papers' tables (verify at build). MHHI framework citation: O'Brien & Salop (2000).

## Pipeline & architecture

Offline Python/DuckDB script → one small parquet/JSON bundle: per-route-per-quarter fares, shares, HHI, and MHHI delta **precomputed under both control assumptions**, plus the diff-in-diff route sets. Static React front end loads the bundle; all interaction client-side; toggles swap precomputed columns, so every knob responds instantly. Deploy: GitHub Pages/Vercel. Repo ships pipeline, data, app, tests — reviewers *can* rerun the pipeline, never need to.

## Build plan (~8–9h total effort, honest)

- **Hour 0 (–0.5h): verifications.** Latest fare-table quarter; T-100 download works end-to-end; Spirit post-emergence holders; coefficient values. Everything downstream depends on these.
- **0.5–2.5h: pipeline.** Fares + shares + crosswalk + HHI/MHHI(×2) + diff-in-diff sets → bundle.
- **2.5–4h: ownership curation + math module with tests.**
- **4–6.5h: UI.** Explore view first (it's the spine), then Simulate, then Learn.
- **6.5–7.5h: scenario engine, toggles, pre-registration screen, deploy.**
- **7.5–9h: video (~5 min, scripted, one retake) + written rationale + transcript curation.**

**Pre-committed cut order if over budget:** monopoly + merger scenarios → Learn view collapses to tooltips → routes 20 → 12 → assumption toggle becomes a methods-panel note (keep the regime toggle at all costs). The diff-in-diff closer and citations never get cut — they're the thesis.

## Risks & mitigations

- **Transtats/DOT download friction** → hour-zero check; fallback to prezipped annual files; worst case, trim year range to 2016–2025.
- **Ownership curation overruns** → four snapshots can shrink to three (2019, 2021, 2025) without losing the Buffett or Spirit beats.
- **Chart-story coherence** → snapshot dates chosen so annotated events visibly move the MHHI line; test this in the pipeline, not the UI.
- **Scope creep** → the cut order above, decided now, exercised without renegotiation.

## Why this wins

No public interactive tool exists for the common-ownership fight; every explainer picks a side, and the refusal to pick one *is* the product. It is a simulation, an explainer, and a dataset explorer at once. The natural experiment started nine weeks ago and the site displays the date reality will grade its predictions — with the fuel confound handled the way an economist would handle it. And the build history shows the work that matters: catching real errors (the Spirit ownership wrinkle, the fuel confound, the double-toggle distinction), verifying load-bearing facts, and cutting scope on purpose.

## With more time (rationale doc)

Paper-faithful DB1C market shares for a handful of routes; continuous 13F-based ownership series; more scenarios (the rumored tie-ups); a "run the check yourself" mode that ingests the post-shutdown data when it publishes and grades the registered predictions in-app.

## Open decisions

1. Route count at launch: 20 (recommended) vs. push for 50.
2. Assumption toggle in v1 (recommended — it's precomputed columns) vs. methods-note only.
3. Whether the Learn view is a full section or an onboarding overlay on Explore.
