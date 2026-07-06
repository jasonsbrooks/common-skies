"""Fetch DOT Consumer Airfare Report Table 6 (quarterly city-pair market
fares) from the Socrata API into data/raw/fares.jsonl.

Dataset: https://data.transportation.gov/Aviation/Consumer-Airfare-Report-Table-6-Contiguous-State-C/yj5y-b2ir
No API key required. Idempotent: skips if the cache file already exists.
"""

import json
import sys
import urllib.parse
import urllib.request

from paths import FIRST_YEAR, LAST_YEAR, RAW_DIR

BASE = "https://data.transportation.gov/resource/yj5y-b2ir.json"
PAGE_SIZE = 50_000
OUT = RAW_DIR / "fares.jsonl"


def fetch_page(offset: int) -> list[dict]:
    params = {
        "$where": f"year >= {FIRST_YEAR} AND year <= {LAST_YEAR}",
        "$order": "tbl6pk",
        "$limit": PAGE_SIZE,
        "$offset": offset,
    }
    url = f"{BASE}?{urllib.parse.urlencode(params)}"
    with urllib.request.urlopen(url, timeout=300) as resp:
        return json.load(resp)


def main() -> None:
    if OUT.exists():
        print(f"cached: {OUT} exists, skipping fetch")
        return
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    tmp = OUT.with_suffix(".jsonl.partial")
    rows = 0
    with tmp.open("w") as f:
        offset = 0
        while True:
            page = fetch_page(offset)
            if not page:
                break
            for row in page:
                f.write(json.dumps(row, sort_keys=True) + "\n")
            rows += len(page)
            print(f"  fetched {rows} rows...", file=sys.stderr)
            offset += PAGE_SIZE
    tmp.rename(OUT)
    print(f"wrote {rows} rows to {OUT}")


if __name__ == "__main__":
    main()
