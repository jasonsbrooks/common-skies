"""Fetch BTS T-100 Domestic Segment (U.S. carriers) yearly extracts from
TranStats into data/raw/t100_<year>.zip.

TranStats has no prezip for T-100; the working method (verified
2026-07-05, see docs/plans/02-hour-zero-verifications.md) is to load the
download form, scrape the ASP.NET state fields, and POST them back with
the field checkboxes. `gnoyr_VQ=FIM` encodes Table_ID 259 (digit d ->
chr(ord('D')+d)). The TranStats TLS chain doesn't verify on macOS, so
verification is disabled for this host.

Idempotent: skips any year whose zip is already cached. Polite: sleeps
between requests.
"""

import re
import ssl
import sys
import time
import urllib.parse
import urllib.request
import zipfile
from http.cookiejar import CookieJar

from paths import FIRST_YEAR, LAST_YEAR, RAW_DIR, T100_EXTRA_YEARS

FORM_URL = (
    "https://www.transtats.bts.gov/DL_SelectFields.aspx"
    "?gnoyr_VQ=FIM&QO_fu146_anzr=Nv4+Pn44vr45"
)
FIELDS = [
    "YEAR",
    "MONTH",
    "UNIQUE_CARRIER",
    "ORIGIN_CITY_MARKET_ID",
    "DEST_CITY_MARKET_ID",
    "PASSENGERS",
    "DISTANCE",
]
SLEEP_SECONDS = 5


def build_opener() -> urllib.request.OpenerDirector:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    opener = urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(CookieJar()),
        urllib.request.HTTPSHandler(context=ctx),
    )
    opener.addheaders = [("User-Agent", "Mozilla/5.0"), ("Referer", FORM_URL)]
    return opener


def hidden_value(html: str, name: str) -> str:
    m = re.search(rf'name="{name}"[^>]*value="([^"]*)"', html)
    if not m:
        raise RuntimeError(f"TranStats form changed: hidden field {name} missing")
    return m.group(1)


def fetch_year(opener: urllib.request.OpenerDirector, year: int) -> None:
    out = RAW_DIR / f"t100_{year}.zip"
    if out.exists():
        print(f"cached: {out.name}")
        return
    html = opener.open(FORM_URL, timeout=120).read().decode("utf-8", "ignore")
    data = [
        ("__EVENTTARGET", ""),
        ("__EVENTARGUMENT", ""),
        ("__VIEWSTATE", hidden_value(html, "__VIEWSTATE")),
        ("__VIEWSTATEGENERATOR", hidden_value(html, "__VIEWSTATEGENERATOR")),
        ("__EVENTVALIDATION", hidden_value(html, "__EVENTVALIDATION")),
        ("txtSearch", ""),
        ("cboGeography", "All"),
        ("cboYear", str(year)),
        ("cboPeriod", "All"),
        ("btnDownload", "Download"),
    ] + [(f, "on") for f in FIELDS]
    req = urllib.request.Request(FORM_URL, data=urllib.parse.urlencode(data).encode())
    resp = opener.open(req, timeout=1800)
    content_type = resp.headers.get("Content-Type", "")
    payload = resp.read()
    if "zip" not in content_type:
        raise RuntimeError(
            f"{year}: expected a zip, got {content_type} ({len(payload)} bytes)"
        )
    tmp = out.with_suffix(".zip.partial")
    tmp.write_bytes(payload)
    with zipfile.ZipFile(tmp) as zf:  # validate before committing to cache
        names = zf.namelist()
        if not any(n.endswith(".csv") for n in names):
            raise RuntimeError(f"{year}: zip contains no CSV: {names}")
    tmp.rename(out)
    print(f"wrote {out.name} ({len(payload):,} bytes)")


def main() -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    years = list(range(FIRST_YEAR, LAST_YEAR + 1)) + T100_EXTRA_YEARS
    opener = build_opener()
    for i, year in enumerate(years):
        try:
            fetch_year(opener, year)
        except Exception as exc:  # noqa: BLE001 - report and continue
            print(f"FAILED {year}: {exc}", file=sys.stderr)
        if i < len(years) - 1:
            time.sleep(SLEEP_SECONDS)


if __name__ == "__main__":
    main()
