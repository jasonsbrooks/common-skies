# Curated inputs

Hand-curated data with per-cell sourcing. Everything else in the bundle is computed from BTS/DOT raw data.

## ownership.csv

`snapshot, owner, carrier, pct, verified, source` — top institutional holders (≥ ~top-8 or the proxy's >5% table) per carrier per snapshot. `pct` is percent of shares outstanding (the pipeline divides by 100). `verified=true` means the number was read directly from the cited primary source (AST 2018 Table 1, a DEF 14A >5% beneficial-ownership table, or an SC 13G); `verified=false` means a 13F-derived approximation, mostly State Street stakes sitting just under proxy disclosure thresholds — labeled here and disclosed in the app's methods panel.

Owner names are canonical and must match the app's `BIG_THREE` list for the passive-index toggle: `Vanguard`, `BlackRock`, `State Street`.

### Snapshots and effective ranges

Chosen so that known events produce visible, honest steps in the MHHI delta series. Boundaries snap to the events, not to midpoints:

| Snapshot | As-of | Applied to quarters | Boundary rationale |
|---|---|---|---|
| `2016Q4` | 2016Q4 (Capital IQ via AST Table 1) | 2014Q1–2018Q2 | Extended backward; Berkshire's late-2016 entry is inside it (disclosed simplification for 2014–15) |
| `2019Q4` | 2019Q4–2020Q1 (2020 proxies + Berkshire 13F) | 2018Q3–2020Q1 | Ends at Buffett's April 2020 exit |
| `2022Q1` | early-2022 proxies (post-exit) | 2020Q2–2025Q1 | Starts at the Buffett exit so the MHHIΔ step lands on the annotated event |
| `2025Q3` | 2025 proxies + Spirit post-emergence 13Gs | 2025Q2–end | Starts at Spirit's creditor takeover (Mar 2025) |

The brief called the third snapshot "~2021"; it is labeled `2022Q1` here because the verifying proxies' record dates are early 2022.

Carriers with no rows in a snapshot (e.g. regionals like SkyWest, Allegiant, and Hawaiian after its 2024 absorption) contribute zero common-ownership pair terms by the owner-less convention — the conservative treatment, disclosed in the methods panel.

Notable, fully verified: Spirit's `2025Q3` register is nine credit/hedge funds (Citadel, PIMCO, Arena, AllianceBernstein, Cyrus, Ares, M&G, Rokos — each from its SC 13G) and **no Big Three holder above 5%**. Spirit left the common-ownership pool before it stopped flying.

## events.json

Chart annotations with dates and one-line teaching notes; `beyond_series: true` marks events after the bundled series ends (2025Q4) — shown on the prediction screen instead of the charts.

## coefficients.json

The two shipped regimes with SEs and full citations, plus context (DGS's replication-then-divergence, the decomposition results, the refutation/surrebuttal trail). Values verified against the papers' tables — see docs/plans/02-hour-zero-verifications.md.
