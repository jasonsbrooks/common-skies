"""Build the app bundle from cached raw data + curated inputs.

Reads:  data/raw/fares.jsonl, data/raw/t100_*.zip, data/curated/*
Writes: data/bundle/bundle.json  (the only file the app loads)
        app/src/lib/market-math/golden-vectors.json  (TS parity fixtures)

Deterministic: same inputs -> byte-identical outputs (sorted keys,
fixed float rounding).
"""

import csv
import io
import json
import zipfile
from collections import defaultdict
from pathlib import Path

import duckdb

from mhhi import hhi, mhhi_delta
from paths import BUNDLE_DIR, CURATED_DIR, FIRST_YEAR, GOLDEN_VECTORS_PATH, LAST_YEAR, RAW_DIR

ROUTE_TARGET = 50
MIN_FARE_QUARTERS = 46  # of 48
TREATMENT_MIN_SPIRIT_SHARE = 0.15
TREATMENT_QUARTER = (2026, 1)  # last full pre-shutdown quarter
CONTROL_CLEAN_QUARTERS = [(2025, 2), (2025, 3), (2025, 4), (2026, 1)]
DISTANCE_BUCKET_MILES = 500

CARRIER_NAMES = {
    "AA": "American", "DL": "Delta", "UA": "United", "WN": "Southwest",
    "AS": "Alaska", "B6": "JetBlue", "NK": "Spirit", "F9": "Frontier",
    "HA": "Hawaiian", "G4": "Allegiant", "SY": "Sun Country",
    "OO": "SkyWest (regional)", "MQ": "Envoy (regional)", "YX": "Republic (regional)",
    "9E": "Endeavor (regional)", "OH": "PSA (regional)", "YV": "Mesa (regional)",
    "QX": "Horizon (regional)", "ZW": "Air Wisconsin (regional)", "PT": "Piedmont (regional)",
    "VX": "Virgin America", "C5": "CommuteAir (regional)", "G7": "GoJet (regional)",
    "EV": "ExpressJet (regional)", "AX": "Trans States (regional)", "EM": "Empire (regional)",
    "CP": "Compass (regional)", "S5": "Shuttle America (regional)", "KS": "PenAir",
    "9K": "Cape Air", "MX": "Breeze", "XP": "Avelo",
}

SNAPSHOT_RANGES = [
    # (snapshot, first quarter index it applies to, last quarter index)
    ("2016Q4", (2014, 1), (2018, 2)),
    ("2019Q4", (2018, 3), (2020, 1)),
    ("2022Q1", (2020, 2), (2025, 1)),
    ("2025Q3", (2025, 2), (2099, 4)),
]


def qi(year: int, q: int) -> int:
    return year * 4 + (q - 1)


def snapshot_for(year: int, q: int) -> str:
    for name, lo, hi in SNAPSHOT_RANGES:
        if qi(*lo) <= qi(year, q) <= qi(*hi):
            return name
    raise ValueError(f"no snapshot for {year}Q{q}")


def load_ownership() -> dict[str, list[tuple[str, str, float]]]:
    snapshots: dict[str, list[tuple[str, str, float]]] = defaultdict(list)
    with (CURATED_DIR / "ownership.csv").open() as f:
        for row in csv.DictReader(f):
            snapshots[row["snapshot"]].append(
                (row["owner"], row["carrier"], float(row["pct"]) / 100.0)
            )
    return dict(snapshots)


def extract_t100_csvs() -> Path:
    out = RAW_DIR / "t100_csv"
    out.mkdir(exist_ok=True)
    for zpath in sorted(RAW_DIR.glob("t100_*.zip")):
        dest = out / (zpath.stem + ".csv")
        if dest.exists():
            continue
        with zipfile.ZipFile(zpath) as zf:
            name = [n for n in zf.namelist() if n.endswith(".csv")][0]
            dest.write_bytes(zf.read(name))
    return out


def quarters_range() -> list[tuple[int, int]]:
    return [(y, q) for y in range(FIRST_YEAR, LAST_YEAR + 1) for q in (1, 2, 3, 4)]


def main() -> None:
    con = duckdb.connect()
    t100_dir = extract_t100_csvs()

    fares = con.sql(
        f"""
        SELECT CAST(year AS INT) AS year, CAST(quarter AS INT) AS q,
               LEAST(CAST(citymarketid_1 AS INT), CAST(citymarketid_2 AS INT)) AS mkt1,
               GREATEST(CAST(citymarketid_1 AS INT), CAST(citymarketid_2 AS INT)) AS mkt2,
               CASE WHEN CAST(citymarketid_1 AS INT) <= CAST(citymarketid_2 AS INT)
                    THEN city1 ELSE city2 END AS city1,
               CASE WHEN CAST(citymarketid_1 AS INT) <= CAST(citymarketid_2 AS INT)
                    THEN city2 ELSE city1 END AS city2,
               CAST(nsmiles AS DOUBLE) AS miles,
               CAST(passengers AS DOUBLE) AS daily_pax,
               CAST(fare AS DOUBLE) AS fare
        FROM read_json_auto('{RAW_DIR / "fares.jsonl"}', format='newline_delimited')
        ORDER BY 1, 2, 3, 4
        """
    ).fetchall()

    seg = con.sql(
        f"""
        SELECT CAST(YEAR AS INT) AS year,
               CAST((MONTH - 1) // 3 + 1 AS INT) AS q,
               LEAST(CAST(ORIGIN_CITY_MARKET_ID AS INT), CAST(DEST_CITY_MARKET_ID AS INT)) AS mkt1,
               GREATEST(CAST(ORIGIN_CITY_MARKET_ID AS INT), CAST(DEST_CITY_MARKET_ID AS INT)) AS mkt2,
               -- TranStats suffixes reused codes with " (2)" etc. to disambiguate
               -- historic carriers; strip so codes match the curated tables.
               regexp_replace(UNIQUE_CARRIER, ' \\(\\d+\\)$', '') AS carrier,
               SUM(CAST(PASSENGERS AS DOUBLE)) AS pax
        FROM read_csv_auto('{t100_dir}/*.csv', union_by_name=true)
        WHERE ORIGIN_CITY_MARKET_ID != DEST_CITY_MARKET_ID AND PASSENGERS > 0
        GROUP BY 1, 2, 3, 4, 5
        ORDER BY 1, 2, 3, 4, 5
        """
    ).fetchall()

    ownership = load_ownership()

    fare_by_rq: dict[tuple, dict] = {}
    route_meta: dict[tuple, dict] = {}
    for year, q, mkt1, mkt2, city1, city2, miles, daily_pax, fare in fares:
        route = (mkt1, mkt2)
        fare_by_rq[(route, year, q)] = {"fare": fare, "daily_pax": daily_pax}
        route_meta.setdefault(route, {"city1": city1, "city2": city2, "miles": miles})

    shares_by_rq: dict[tuple, dict[str, float]] = defaultdict(dict)
    for year, q, mkt1, mkt2, carrier, pax in seg:
        shares_by_rq[((mkt1, mkt2), year, q)][carrier] = pax

    window = quarters_range()

    # ---- QA gates + ranking ------------------------------------------------
    per_route_quarters: dict[tuple, list] = defaultdict(list)
    for (route, year, q), rec in fare_by_rq.items():
        if FIRST_YEAR <= year <= LAST_YEAR:
            per_route_quarters[route].append((year, q, rec))

    qa_pass: list[tuple] = []
    qa_stats: dict[tuple, dict] = {}
    for route, rows in per_route_quarters.items():
        fare_quarters = {(y, q) for y, q, _ in rows}
        covered = sum(
            1 for (y, q) in fare_quarters if shares_by_rq.get((route, y, q))
        )
        fares_ok = all(25 <= r["fare"] <= 2500 for _, _, r in rows)
        mean_pax = sum(r["daily_pax"] for _, _, r in rows) / len(rows)
        qa_stats[route] = {
            "fare_quarters": len(fare_quarters),
            "covered_quarters": covered,
            "fares_in_bounds": fares_ok,
            "mean_daily_pax": mean_pax,
        }
        if len(fare_quarters) >= MIN_FARE_QUARTERS and covered >= MIN_FARE_QUARTERS and fares_ok:
            qa_pass.append(route)

    qa_pass.sort(key=lambda r: -qa_stats[r]["mean_daily_pax"])
    selected = qa_pass[:ROUTE_TARGET]

    # ---- per-route series --------------------------------------------------
    def series_for(route: tuple) -> dict:
        quarters, fare_s, hhi_s, mhhi_ast, mhhi_passive, shares_s = [], [], [], [], [], []
        for year, q in window:
            quarters.append(f"{year}Q{q}")
            rec = fare_by_rq.get((route, year, q))
            fare_s.append(round(rec["fare"], 2) if rec else None)
            raw = shares_by_rq.get((route, year, q))
            if not raw:
                hhi_s.append(None); mhhi_ast.append(None); mhhi_passive.append(None)
                shares_s.append(None)
                continue
            own = ownership[snapshot_for(year, q)]
            total = sum(raw.values())
            norm = {c: p / total for c, p in raw.items()}
            top = dict(sorted(norm.items(), key=lambda kv: -kv[1])[:8])
            shares_s.append({c: round(s, 4) for c, s in top.items()})
            hhi_s.append(round(hhi(raw) * 10000))
            mhhi_ast.append(round(mhhi_delta(raw, own, "proportional") * 10000))
            mhhi_passive.append(round(mhhi_delta(raw, own, "passive-index") * 10000))
        return {
            "quarters": quarters, "fare": fare_s, "shares": shares_s,
            "hhi": hhi_s, "mhhiDeltaAst": mhhi_ast, "mhhiDeltaPassive": mhhi_passive,
        }

    routes_out = []
    latest_y, latest_q = TREATMENT_QUARTER
    for route in selected:
        meta = route_meta[route]
        # 2026Q1 shares — the honest "before" state for the Spirit scenario
        # (last full pre-shutdown quarter; the bundled series ends 2025Q4).
        raw_latest = shares_by_rq.get((route, latest_y, latest_q))
        latest_shares = None
        if raw_latest:
            total = sum(raw_latest.values())
            latest_shares = {
                c: round(p / total, 4)
                for c, p in sorted(raw_latest.items(), key=lambda kv: -kv[1])[:8]
            }
        routes_out.append({
            "id": f"{route[0]}-{route[1]}",
            "city1": meta["city1"], "city2": meta["city2"],
            "miles": meta["miles"],
            "meanDailyPax": round(qa_stats[route]["mean_daily_pax"], 1),
            "latestShares": latest_shares,
            "latestSharesQuarter": f"{latest_y}Q{latest_q}",
            "series": series_for(route),
        })

    # ---- coherence checks (fail the build, not the eyeball) ----------------
    def mean_step(key: str, y_pre: int, q_pre: int, y_post: int, q_post: int) -> float:
        idx_pre = window.index((y_pre, q_pre))
        idx_post = window.index((y_post, q_post))
        diffs = []
        for r in routes_out:
            s = r["series"][key]
            if s[idx_pre] is not None and s[idx_post] is not None:
                diffs.append(s[idx_post] - s[idx_pre])
        return sum(diffs) / len(diffs)

    buffett_step = mean_step("mhhiDeltaAst", 2020, 1, 2020, 2)
    spirit_step_mhhi = mean_step("mhhiDeltaAst", 2025, 1, 2025, 2)
    assert buffett_step < 0, f"Buffett exit must step MHHI delta down, got {buffett_step:+.0f}"
    print(f"coherence: Buffett-exit step (2020Q1->Q2, mean over routes): {buffett_step:+.0f} points")
    print(f"coherence: Spirit-emergence step (2025Q1->Q2):              {spirit_step_mhhi:+.0f} points")

    # ---- DiD sets + registered predictions ---------------------------------
    ty, tq = TREATMENT_QUARTER
    coefficients = json.loads((CURATED_DIR / "coefficients.json").read_text())

    def spirit_share(route: tuple, year: int, q: int) -> float:
        raw = shares_by_rq.get((route, year, q))
        if not raw:
            return 0.0
        return raw.get("NK", 0.0) / sum(raw.values())

    treatment, controls_pool = [], []
    for route in qa_pass:
        s_nk = spirit_share(route, ty, tq)
        if s_nk >= TREATMENT_MIN_SPIRIT_SHARE:
            treatment.append(route)
        elif all(
            (shares_by_rq.get((route, y, q)) or {}).get("NK", 0.0) == 0.0
            for y, q in CONTROL_CLEAN_QUARTERS
        ):
            controls_pool.append(route)

    def bucket(route: tuple) -> int:
        return int(route_meta[route]["miles"] // DISTANCE_BUCKET_MILES)

    used_controls: set = set()
    did_pairs = []
    for t in sorted(treatment, key=lambda r: -qa_stats[r]["mean_daily_pax"]):
        candidates = [
            c for c in controls_pool
            if bucket(c) == bucket(t) and c not in used_controls
        ]
        if not candidates:
            candidates = [c for c in controls_pool if c not in used_controls]
        best = min(
            candidates,
            key=lambda c: abs(
                qa_stats[c]["mean_daily_pax"] - qa_stats[t]["mean_daily_pax"]
            ),
        )
        used_controls.add(best)
        did_pairs.append((t, best))

    predictions = []
    own_t = ownership[snapshot_for(ty, tq)]
    per_assumption_deltas: dict[str, dict[str, list[float]]] = {
        "proportional": {"dHhi": [], "dMhhi": []},
        "passive-index": {"dHhi": [], "dMhhi": []},
    }
    treatment_detail = []
    for t, c in did_pairs:
        raw = shares_by_rq[(t, ty, tq)]
        after = {carrier: pax for carrier, pax in raw.items() if carrier != "NK"}
        d_hhi = hhi(after) - hhi(raw)
        row = {
            "treatment": f"{t[0]}-{t[1]}",
            "control": f"{c[0]}-{c[1]}",
            "treatmentCities": [route_meta[t]["city1"], route_meta[t]["city2"]],
            "controlCities": [route_meta[c]["city1"], route_meta[c]["city2"]],
            "spiritShare": round(spirit_share(t, ty, tq), 4),
            "dHhiPoints": round(d_hhi * 10000),
        }
        for assumption, key in (("proportional", "dMhhiAstPoints"), ("passive-index", "dMhhiPassivePoints")):
            d_mhhi = mhhi_delta(after, own_t, assumption) - mhhi_delta(raw, own_t, assumption)
            row[key] = round(d_mhhi * 10000)
            per_assumption_deltas[assumption]["dHhi"].append(d_hhi)
            per_assumption_deltas[assumption]["dMhhi"].append(d_mhhi)
        treatment_detail.append(row)

    for assumption, deltas in per_assumption_deltas.items():
        n = len(deltas["dHhi"])
        mean_dhhi = sum(deltas["dHhi"]) / n
        mean_dmhhi = sum(deltas["dMhhi"]) / n
        for regime in coefficients["regimes"]:
            log_change = regime["coefHhi"] * mean_dhhi + regime["coefMhhiDelta"] * mean_dmhhi
            predictions.append({
                "assumption": assumption,
                "regime": regime["id"],
                "meanDHhiPoints": round(mean_dhhi * 10000),
                "meanDMhhiPoints": round(mean_dmhhi * 10000),
                "concentrationChannelPct": round((2.718281828459045 ** (regime["coefHhi"] * mean_dhhi) - 1) * 100, 2),
                "commonOwnershipChannelPct": round((2.718281828459045 ** (regime["coefMhhiDelta"] * mean_dmhhi) - 1) * 100, 2),
                "predictedSpreadPct": round((2.718281828459045 ** log_change - 1) * 100, 2),
            })

    spirit_avg_dhhi = sum(per_assumption_deltas["proportional"]["dHhi"]) / len(did_pairs) * 10000
    spirit_avg_dmhhi = sum(per_assumption_deltas["proportional"]["dMhhi"]) / len(did_pairs) * 10000
    assert abs(spirit_avg_dmhhi) < spirit_avg_dhhi, (
        "Spirit exit should move concentration more than common ownership "
        f"(creditor-owned): dHHI {spirit_avg_dhhi:+.0f} vs dMHHI {spirit_avg_dmhhi:+.0f}"
    )
    print(f"coherence: Spirit exit dHHI {spirit_avg_dhhi:+.0f} vs dMHHI(AST) {spirit_avg_dmhhi:+.0f} points")

    # ---- golden vectors ----------------------------------------------------
    vectors = []
    for r_idx in (0, len(selected) // 2, len(selected) - 1):
        route = selected[r_idx]
        for year, q in ((2016, 4), (2019, 3), (2021, 2), (2025, 3)):
            raw = shares_by_rq.get((route, year, q))
            if not raw:
                continue
            own = ownership[snapshot_for(year, q)]
            carriers_here = set(raw)
            own_subset = [
                {"owner": o, "carrier": c, "beta": b}
                for o, c, b in own if c in carriers_here
            ]
            for assumption in ("proportional", "passive-index"):
                vectors.append({
                    "label": f"{route[0]}-{route[1]} {year}Q{q} {assumption}",
                    "shares": {c: p for c, p in sorted(raw.items())},
                    "ownership": own_subset,
                    "assumption": assumption,
                    "expectedHhi": hhi(raw),
                    "expectedMhhiDelta": mhhi_delta(raw, own, assumption),
                })
    GOLDEN_VECTORS_PATH.write_text(json.dumps({"vectors": vectors}, indent=1, sort_keys=True) + "\n")

    # ---- bundle ------------------------------------------------------------
    events = json.loads((CURATED_DIR / "events.json").read_text())["events"]
    ownership_out = {
        snap: [
            {"owner": o, "carrier": c, "pct": round(b * 100, 2)}
            for o, c, b in rows
        ]
        for snap, rows in ownership.items()
    }
    bundle = {
        "meta": {
            "generated": "deterministic — see pipeline/build_bundle.py",
            "window": [f"{FIRST_YEAR}Q1", f"{LAST_YEAR}Q4"],
            "sources": {
                "fares": "DOT Consumer Airfare Report Table 6 (Socrata yj5y-b2ir)",
                "shares": "BTS T-100 Domestic Segment (TranStats table 259)",
                "ownership": "data/curated/ownership.csv (per-cell sourcing)",
            },
            "routeCount": len(routes_out),
            "qaPassedRoutes": len(qa_pass),
            "treatmentQuarter": f"{ty}Q{tq}",
        },
        "carrierNames": CARRIER_NAMES,
        "regimes": coefficients["regimes"],
        "regimeContext": coefficients["context"],
        "events": events,
        "ownershipSnapshots": ownership_out,
        "snapshotRanges": [
            {"snapshot": s, "from": f"{lo[0]}Q{lo[1]}", "to": f"{hi[0]}Q{hi[1]}"}
            for s, lo, hi in SNAPSHOT_RANGES
        ],
        "routes": routes_out,
        "did": {
            "design": "Treatment: QA-passing routes with Spirit share >= 15% in 2026Q1 (last full pre-shutdown quarter). Control: matched on 500-mile distance bucket + closest mean daily passengers, zero Spirit share 2025Q2-2026Q1. Registered quantity: treatment-minus-control fare spread, Q3 2026 vs Q1 2026 baseline.",
            "pairs": treatment_detail,
            "predictions": predictions,
        },
    }
    BUNDLE_DIR.mkdir(parents=True, exist_ok=True)
    (BUNDLE_DIR / "bundle.json").write_text(
        json.dumps(bundle, indent=None, sort_keys=True, separators=(",", ":")) + "\n"
    )

    print(f"\nroutes: {len(routes_out)} selected of {len(qa_pass)} QA-passing "
          f"({len(per_route_quarters)} in fare data)")
    print(f"DiD: {len(did_pairs)} treatment/control pairs")
    print(f"bundle: {(BUNDLE_DIR / 'bundle.json').stat().st_size:,} bytes")
    print(f"golden vectors: {len(vectors)}")


if __name__ == "__main__":
    main()
