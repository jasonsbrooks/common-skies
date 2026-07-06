# Phase 3 Subplan — Pipeline

Offline Python → one JSON bundle in `data/bundle/`. Reviewers never run it; it's checked in, deterministic, and rerunnable.

## Key simplification found in verification

T-100 lets us request `ORIGIN_CITY_MARKET_ID` / `DEST_CITY_MARKET_ID` — BTS's own city-market grouping, the same ID space as Table 6's `citymarketid_1/2` (NYC = one market, etc.). **No hand-built airport→city crosswalk needed.** The route key everywhere is the unordered city-market-ID pair.

## Environment

`pipeline/.venv` (Python 3.13), deps: `duckdb`, `pytest` only; stdlib `urllib` for downloads (already proven against TranStats). `pipeline/requirements.txt` pins them.

## Steps

**3a. `fetch_fares.py`** — Socrata `yj5y-b2ir` paginated JSON → `data/raw/fares.jsonl` (cache; skip if present). Window 2014Q1–2025Q4.

**3b. `fetch_t100.py`** — TranStats form postback (method from verification doc), one request per year 2014–2026, `cboPeriod=All`, fields: `YEAR, MONTH, UNIQUE_CARRIER, ORIGIN_CITY_MARKET_ID, DEST_CITY_MARKET_ID, PASSENGERS` → `data/raw/t100_<year>.zip` (cache; polite 5s sleep between requests). 2026 included: T-100's ~40-day lag means 2026 Q1 shares exist — needed for the DiD treatment definition ("last full pre-shutdown quarter" = 2026Q1, since Spirit flew until May 2, 2026).

**3c. Curated inputs** (the ~1.5h research chunk) — `data/curated/`:
- `ownership.csv`: `snapshot, owner, carrier, beta, source` — top ~8 holders × carriers (AA DL UA WN AS B6 NK F9; HA until its 2024 absorption) × 4 snapshots (2016, 2019, 2021, 2025) from DEF 14A/13F/10-K data. 2025 snapshot encodes Spirit-as-creditor-owned (Citadel/PIMCO-led) and Frontier-under-Indigo.
- `coefficients.json`: the AST/DGS pairs + citations (already verified).
- `events.json`: annotated events with dates (COVID, Buffett exit, Alaska–Hawaiian close, Spirit Ch11 ×2, emergence, shutdown, DB1B→DB1C).
- Carriers absent from ownership.csv contribute zero MHHIΔ pair terms (owner-less convention, disclosed in methods).

**3d. `mhhi.py` + `build_bundle.py` compute** — DuckDB over raw files:
- Quarterly carrier passengers per unordered city-market pair (sum both directions, both as origin); shares within route-quarter.
- HHI per route-quarter; MHHIΔ under both control assumptions using the ownership snapshot in effect (step function: snapshot applies until the next one).
- Operating-carrier caveat: T-100 reports operating carrier (regionals like OO appear as themselves; AST used ticketing carrier). Keep as reported; methods-panel disclosure. Regional carriers have no rows in ownership.csv → they contribute no common-ownership terms, which is the conservative treatment.
- **Golden vectors**: dump ~20 real (shares, ownership, assumption) → MHHIΔ cases to `app/src/lib/market-math/golden-vectors.json`; vitest parity test asserts the TS core reproduces them (1e-12).
- **Chart-story coherence test (pytest)**: Buffett's 2020 exit visibly steps MHHIΔ down between the 2019 and 2021 snapshots on major routes; the 2025 snapshot moves Spirit-heavy routes' MHHIΔ less than HHI-share would suggest.

**3e. Route selection + DiD + emit**:
- QA gates per route: fare rows present ≥46/48 quarters; share sum sanity; T-100/Table-6 join succeeds; fare within sane bounds. Rank by mean daily passengers; take top 50 passing.
- DiD sets (route universe = all QA-passing routes, not just top 50): treatment = Spirit share ≥15% in 2026Q1 (T-100); control = zero Spirit share for trailing 4 quarters, matched on distance bucket (500-mile bins) + closest passenger volume, one control per treatment route.
- `data/bundle/bundle.json`: routes (names, ids, per-quarter series under both assumptions), events, ownership snapshots (for the ownership web), regimes, DiD sets + per-regime predicted spread change, build metadata (dates, source URLs).

## Tests (pytest, `pipeline/tests/`)

Python MHHIΔ mirrors the TS hand-worked cases (same numbers — cross-language agreement on the exact arithmetic *before* the golden vectors formalize it); QA-gate logic on synthetic rows; coherence test above.

## Commits

1. `docs: pipeline subplan` (this file)
2. `pipeline: fetchers for Table 6 fares + T-100 shares (cached, scripted)`
3. `data: curated ownership snapshots, events, coefficients` (research chunk)
4. `pipeline: HHI/MHHIΔ compute, golden vectors, coherence tests`
5. `pipeline: QA gates, top-50 selection, DiD sets, bundle emit`
