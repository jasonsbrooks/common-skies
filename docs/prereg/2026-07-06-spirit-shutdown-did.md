# Pre-Registered Prediction — The Spirit Shutdown Natural Experiment

**Frozen:** 2026-07-06. This document is committed to the repository before any post-shutdown fare data exists; the site footer cites this commit's hash. Nothing here may be edited after this commit — amendments, if ever needed, must be new dated documents that reference this one.

## The event

Spirit Airlines ceased operations on May 2, 2026, exiting every route it flew. Its collapse was precipitated in part by the 2026 jet-fuel price spike — which raises fares on **all** routes, so a naive before/after comparison of ex-Spirit routes would conflate fuel costs with Spirit's exit. The design below removes that confound.

## Registered design (difference-in-differences)

- **Treatment routes:** QA-passing city-pair markets where Spirit (NK) carried **≥ 15%** of T-100 segment passengers in **2026Q1**, Spirit's last full quarter. N = 52.
- **Control routes:** for each treatment route, the unused QA-passing route in the same 500-mile distance bucket with the closest mean daily passengers, and **zero** Spirit share in every quarter 2025Q2–2026Q1. One control per treatment, matched greedily in descending treatment-route size.
- **Registered quantity:** the treatment-minus-control change in average fare (DOT Consumer Airfare Report Table 6, or its DB1C-based successor), **Q3 2026 vs the Q1 2026 baseline**, averaged across pairs weighted equally:

  `S = mean_i[(fare_T_i(2026Q3) − fare_T_i(2026Q1))/fare_T_i(2026Q1)] − mean_i[(fare_C_i(2026Q3) − fare_C_i(2026Q1))/fare_C_i(2026Q1)]`

- **Grading data:** DOT Consumer Airfare Report Table 6 (data.transportation.gov, dataset yj5y-b2ir) when 2026Q3 publishes (~Q1–Q2 2027 given its historical lag); cross-checkable against BTS DB1C monthly releases (first post-shutdown month ~Sep–Oct 2026).

## Registered predictions

Mechanical predictions from the concentration shock alone: remove NK from each treatment route's 2026Q1 shares (proportional reallocation), recompute HHI and MHHI delta under each control assumption with the 2025 ownership snapshot, and apply each camp's published log-fare coefficients. Controls are predicted unchanged (zero Spirit share; the fuel shock cancels in S by design).

| Assumption \\ Coefficient | AST (2018): MHHIΔ 0.202, HHI 0.255 | DGS (2022, IV): MHHIΔ 0.063, HHI 0.225 |
|---|---|---|
| Proportional control (AST's construction) | **+4.48%** (concentration +3.48% · common-ownership +0.97%) | **+3.38%** (concentration +3.07% · common-ownership +0.30%) |
| Passive index (Big Three exert no control) | **+4.00%** (concentration +3.48% · common-ownership +0.50%) | **+3.23%** (concentration +3.07% · common-ownership +0.16%) |

Mean concentration shock across pairs: ΔHHI +1,342 points; ΔMHHIΔ +478 points (proportional) / +248 (passive). Note MHHIΔ **rises** on Spirit's exit: creditor-owned Spirit was outside the common-ownership pool, so its share flows to commonly-held carriers.

**What a result can and cannot settle:** a realized spread near the critics' ≈ +3.2–3.4% is consistent with their package of assumptions; near +4.0–4.5%, with AST's. The channels are not separately observable in S — this experiment referees the packages, not the mechanism in isolation. A spread far outside this range indicts the shared concentration framework itself.

## Treatment/control pairs (route ids are BTS city-market-id pairs)

| # | Treatment | Spirit 2026Q1 share | Control |
|---|---|---|---|
| 1 | Chicago – Miami (`30977-32467`) | 17.8% | Phoenix – Chicago (`30466-30977`) |
| 2 | Boston – Miami (`30721-32467`) | 15.4% | Denver – Washington (`30325-30852`) |
| 3 | Detroit – New York City (`31295-31703`) | 26.8% | Dallas/Fort Worth – Denver (`30194-30325`) |
| 4 | Miami – Philadelphia (`32467-34100`) | 18.3% | Phoenix – Seattle (`30466-30559`) |
| 5 | Detroit – Miami (`31295-32467`) | 28.3% | Minneapolis/St. Paul – New York City (`31650-31703`) |
| 6 | Detroit – Orlando (`31295-31454`) | 25.5% | Chicago – Philadelphia (`30977-34100`) |
| 7 | Houston – Miami (`31453-32467`) | 20.4% | Denver – Minneapolis/St. Paul (`30325-31650`) |
| 8 | Detroit – Los Angeles (`31295-32575`) | 19.1% | Denver – Miami (`30325-32467`) |
| 9 | Detroit – Las Vegas (`31295-32211`) | 20.2% | Houston – San Francisco (`31453-32457`) |
| 10 | Houston – Orlando (`31453-31454`) | 15.6% | Denver – San Diego (`30325-33570`) |
| 11 | Atlanta – Detroit (`30397-31295`) | 15.8% | Boston – Raleigh/Durham (`30721-34492`) |
| 12 | Detroit – Tampa (`31295-33195`) | 19.6% | Dallas/Fort Worth – Minneapolis/St. Paul (`30194-31650`) |
| 13 | Nashville – Miami (`30693-32467`) | 16.3% | Washington – St. Louis (`30852-31123`) |
| 14 | Pittsburgh – Orlando (`30198-31454`) | 24.9% | Washington – Jacksonville (`30852-31136`) |
| 15 | Orlando – Indianapolis (`31454-32337`) | 21.0% | Seattle – Salt Lake City (`30559-34614`) |
| 16 | Detroit – Fort Myers (`31295-31714`) | 22.9% | Seattle – Minneapolis/St. Paul (`30559-31650`) |
| 17 | Charlotte – Miami (`31057-32467`) | 16.6% | Dallas/Fort Worth – Salt Lake City (`30194-34614`) |
| 18 | Nashville – Orlando (`30693-31454`) | 25.1% | Denver – Kansas City (`30325-33198`) |
| 19 | Las Vegas – Reno (`32211-34570`) | 19.0% | Cleveland – Chicago (`30647-30977`) |
| 20 | Miami – New Orleans (`32467-33495`) | 24.2% | Atlanta – Cleveland (`30397-30647`) |
| 21 | Columbus – Orlando (`31066-31454`) | 17.0% | New York City – Milwaukee (`31703-33342`) |
| 22 | Detroit – Houston (`31295-31453`) | 19.1% | Chicago – Salt Lake City (`30977-34614`) |
| 23 | Austin – Miami (`30423-32467`) | 16.0% | Houston – San Diego (`31453-33570`) |
| 24 | Orlando – Kansas City (`31454-33198`) | 18.4% | Denver – Charlotte (`30325-31057`) |
| 25 | Pittsburgh – Miami (`30198-32467`) | 30.2% | Denver – New Orleans (`30325-33495`) |
| 26 | Indianapolis – Miami (`32337-32467`) | 21.6% | Phoenix – Kansas City (`30466-33198`) |
| 27 | Las Vegas – Kansas City (`32211-33198`) | 16.8% | Chicago – San Antonio (`30977-33214`) |
| 28 | Orlando – New Orleans (`31454-33495`) | 24.8% | Orlando – Cincinnati (`31454-33105`) |
| 29 | Miami – Tampa (`32467-33195`) | 23.9% | Seattle – Boise (`30559-30713`) |
| 30 | Myrtle Beach – New York City (`31135-31703`) | 54.9% | Denver – Milwaukee (`30325-33342`) |
| 31 | Columbus – Miami (`31066-32467`) | 29.9% | Miami – Cincinnati (`32467-33105`) |
| 32 | Orlando – San Antonio (`31454-33214`) | 27.6% | Pittsburgh – Houston (`30198-31453`) |
| 33 | Miami – Kansas City (`32467-33198`) | 15.1% | New Orleans – Philadelphia (`33495-34100`) |
| 34 | Orlando – Richmond (`31454-34524`) | 20.4% | Phoenix – San Antonio (`30466-33214`) |
| 35 | Orlando – Miami (`31454-32467`) | 19.4% | New York City – Greensboro/High Point (`31703-31995`) |
| 36 | Miami – Richmond (`32467-34524`) | 21.6% | Dallas/Fort Worth – Jacksonville (`30194-31136`) |
| 37 | Orlando – Memphis (`31454-33244`) | 44.5% | Phoenix – Boise (`30466-30713`) |
| 38 | Tampa – New Orleans (`33195-33495`) | 26.3% | Buffalo – Washington (`30792-30852`) |
| 39 | Detroit – New Orleans (`31295-33495`) | 20.8% | Bellingham – Las Vegas (`30666-32211`) |
| 40 | Orlando – Norfolk (`31454-33667`) | 25.6% | Seattle – Reno (`30559-34570`) |
| 41 | Miami – San Antonio (`32467-33214`) | 37.9% | Austin – Salt Lake City (`30423-34614`) |
| 42 | Atlantic City – Orlando (`30158-31454`) | 100.0% | Las Vegas – Oklahoma City (`32211-33851`) |
| 43 | Miami – Norfolk (`32467-33667`) | 26.2% | Atlanta – Buffalo (`30397-30792`) |
| 44 | Boston – Myrtle Beach (`30721-31135`) | 52.4% | New York City – Knoxville (`31703-35412`) |
| 45 | Charleston – Miami (`30994-32467`) | 17.6% | Minneapolis/St. Paul – Milwaukee (`31650-33342`) |
| 46 | Atlantic City – Miami (`30158-32467`) | 75.1% | New York City – Madison (`31703-33485`) |
| 47 | Miami – Louisville (`32467-33044`) | 23.8% | Dallas/Fort Worth – Charleston (`30194-30994`) |
| 48 | Atlantic City – Fort Myers (`30158-31714`) | 100.0% | Washington – Valparaiso (`30852-31504`) |
| 49 | Miami – Pensacola (`32467-33728`) | 35.5% | Washington – Jackson/Vicksburg (`30852-32448`) |
| 50 | Orlando – Latrobe (`31454-32898`) | 100.0% | Dallas/Fort Worth – Dayton (`30194-31267`) |
| 51 | Atlantic City – Tampa (`30158-33195`) | 87.9% | Houston – Greenville/Spartanburg (`31453-31871`) |
| 52 | Myrtle Beach – Miami (`31135-32467`) | 71.4% | Wichita – Houston (`30928-31453`) |

## Provenance

Inputs, code, and the deterministic pipeline that produced these numbers live in this repository (pipeline/build_bundle.py; data/curated/ with per-cell sourcing). Coefficients: Azar, Schmalz & Tecu (2018) J. Finance 73(4) Table 3 col. (6); Dennis, Gerardi & Schenone (2022) J. Finance 77(5) Table V Panel B col. (4). Framework: O'Brien & Salop (2000).
