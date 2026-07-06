# Hour-Zero Verifications

Verified 2026-07-05. Everything downstream (pipeline, coefficients, prereg dates) depends on these five facts. Each was checked live, not assumed.

## 1. Fares: DOT Consumer Airfare Report Table 6 — ✅ works, through 2025 Q4

- Socrata API on data.transportation.gov, dataset `yj5y-b2ir` ("Consumer Airfare Report: Table 6 — Contiguous State City-Pair Markets ≥10 Passengers/Day"). No key needed.
- **Latest published quarter: 2025 Q4** (6,611 markets). The DB1B→DB1C transition did *not* stall it. Full history available for our 2014–2025 window.
- Schema (verified from live rows): `year, quarter, city1, city2, citymarketid_1, citymarketid_2, nsmiles` (market distance), `passengers` (avg daily), `fare` (market avg), `carrier_lg`/`large_ms`/`fare_lg` (largest carrier, its share, its fare), `carrier_low`/`lf_ms`/`fare_low`.
- Note: Table 6 is **market-level** (one row per city-pair-quarter). Per-carrier shares come from T-100 (below). `citymarketid` handles airport→city aggregation on the fare side; we still need the crosswalk for T-100 airports.
- Q1 2026 fares (the prereg baseline quarter) should publish roughly late summer 2026 given the historical ~5–6 month lag.

Source: https://data.transportation.gov/Aviation/Consumer-Airfare-Report-Table-6-Contiguous-State-C/yj5y-b2ir

## 2. T-100 Domestic Segment download — ✅ works end-to-end, scripted

- No prezip exists for T-100 (the "Prezipped File" option is hidden on its form) and the geodata.bts.gov copy is useless for us (airport-level annual totals, no carrier, max year 2024).
- **Working method (tested today):** GET the TranStats form page `https://www.transtats.bts.gov/DL_SelectFields.aspx?gnoyr_VQ=FIM` (FIM = table 259, T-100 Domestic Segment, U.S. carriers — the `gnoyr_VQ` value encodes digits as letters, digit d → chr(ord('D')+d)), scrape `__VIEWSTATE`/`__VIEWSTATEGENERATOR`/`__EVENTVALIDATION`, POST them back with `cboGeography=All`, `cboYear`, `cboPeriod`, field checkboxes (`YEAR, MONTH, UNIQUE_CARRIER, ORIGIN, DEST, PASSENGERS, DISTANCE`), `btnDownload=Download`. Response is a zip with one CSV.
- Test pull (Oct 2025): 302 KB zip, 38,420 rows, all expected carriers present incl. NK (Spirit) and F9 (Frontier). CSV column order follows the form's field order, header row included, TLS cert needs `-k`/no-verify.
- Year dropdown offers 1990–2026. `cboPeriod=All` gives a full year in one request → ~12 requests for 2014–2025. Cache each zip in `data/raw/`.
- Fallback if the form breaks: trim year range (brief's mitigation) or fetch month-by-month.

## 3. Spirit post-emergence ownership — ✅ confirmed, the wrinkle is real

- March 2025 Chapter 11 emergence: **prior common stock cancelled, shareholders wiped out, NYSE delisted**; ~$795M of senior secured notes converted to equity. New owners are former creditors — SC 13G filings (Aug 2025) confirm **Citadel Advisors** and **PIMCO** as major holders; index funds hold at most small residual positions (~25.9M shares outstanding).
- Second Chapter 11 filed **August 2025**; ceased operations May 2026.
- So by shutdown, Spirit had largely left the common-ownership pool → its exit moves HHI a lot, MHHIΔ comparatively little. The "index funds had already lost this one" teaching beat is factually supported.
- Bonus support: DGS's own Table VIII shows the AST correlation attenuates to insignificance (0.038–0.069) under bankruptcy-sensitive control assumptions — treating bankrupt/creditor-owned carriers carefully is a *literature-recognized* joint, not our invention.
- Phase 3c still needs the exact holder list/percentages from the 8-K/13G filings for the 2025 snapshot.

Sources: SEC 8-K exhibits (CIK 1498710, 2025), aerotime.aero, elevenflo.com summaries.

## 4. Coefficients — ✅ exact values pulled from the papers' tables

Both papers regress **log(average fare)** on MHHIΔ (DGS call it HHIΔ — same object) and HHI, both scaled 0–1 (10,000 points = 1.0). We use the **market-level specifications with full controls** — our data is market-level, so this is the apples-to-apples pair:

| Regime | Coefficient on MHHIΔ | Coefficient on HHI | Source |
|---|---|---|---|
| **AST baseline** | **0.202*** (SE 0.0356) | 0.255*** (SE 0.0244) | AST 2018, Table 3, col (6): market-level, full controls, 2001Q1–2014Q4 |
| AST market-level range | 0.325 / 0.311 / 0.202 | 0.365 / 0.357 / 0.255 | AST 2018, Table 3, cols (4)–(6) |
| **DGS / critics** | **0.063 (SE 0.088) — statistically zero** | 0.225*** (SE 0.053) | DGS WP (2021) Table V, Panel B col (4): IV specification, market level |
| DGS decomposition | placebo-ownership+true-shares: 0.212***; true-ownership+placebo-shares: **−0.144** | — | DGS Tables III–IV: the correlation lives in the *market-share* component, not ownership |
| DGS bankruptcy treatment | 0.038–0.069 (insignificant) | — | DGS Table VIII: holders of bankrupt carriers lose control |

- DGS replicate AST's numbers nearly exactly first (their Table II: 0.196 vs 0.202) — the fight is genuinely about *assumptions*, not data errors. Great for the methods panel.
- Sanity check on AST magnitude: mean MHHIΔ ≈ 2,200 points ≈ 0.22 × 0.202 ≈ 4.5% higher fares — consistent with their published 3–7% headline range.
- Named simplification for the app: these coefficients were estimated on 2001–2014 DB1B data; we apply them to 2014–2025 Table-6/T-100 data.
- MHHI framework citation: O'Brien & Salop (2000), *Antitrust Law Journal* 67:559.

Full citations:
- Azar, Schmalz & Tecu (2018), "Anticompetitive Effects of Common Ownership," *J. Finance* 73(4):1513–1565. (Table verified in IESE WP-1169-E copy, Table 3.)
- Dennis, Gerardi & Schenone (2022), "Common Ownership Does Not Have Anticompetitive Effects in the Airline Industry," *J. Finance* 77(5):2765–2798. (Tables verified in FRB Atlanta WP 2019-15, Sept 2021 revision.)
- AST, "A Refutation of…" (SSRN 4158149, 2022); DGS, "A Surrebuttal…" (SSRN 4307814, 2022) — cite in methods panel as the ongoing state of the fight.

## 5. DB1C schedule → check-back dates — ✅ derived

- DB1B retired after Q2 2025; **DB1C (OD-40)** effective July 2025: monthly reporting, 40% ticket sample.
- First release (Jul–Sep 2025) landed **February 2026**. As of June 2026, data through ~Feb 2026 published → effective lag ≈ **4 months** after the reporting month.
- **Spirit shutdown (May 2026) monthly data: expect ~Sep–Oct 2026.** Full Q3 2026 (the registered quantity's quarter): ~**Jan–Feb 2027**. Consumer Airfare Report Q3 2026 (our fare source): ~Q1–Q2 2027 given its ~5–6 month lag.
- The site will display: "First post-shutdown data expected ~Oct 2026; the registered Q3 2026 verdict expected ~Q1 2027."

Sources: bts.gov OD-40 pages, BTS newsroom "First Quarter of OD40 Data is Live," Cirium DB1B→DB1C transition FAQ.

## Implications locked into the pipeline plan

1. Fares via Socrata API (paginated JSON, cache to `data/raw/`); shares via scripted TranStats postback (annual zips, cached).
2. Route universe: Table 6 city-pairs joined to T-100 shares through the airport→city crosswalk keyed to match `citymarketid` groupings.
3. The regime toggle ships with AST = 0.202 and DGS/critics = 0.063 (both market-level, log-fare, with the HHI channel at 0.255 / 0.225 respectively), plus a custom slider. Every number cited to its table.
4. 2025 ownership snapshot: Spirit → creditor-owned (Citadel/PIMCO-led, near-zero Big Three), pending exact percentages from filings in Phase 3c.
