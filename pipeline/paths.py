"""Shared paths for the pipeline. Everything is relative to the repo root
so scripts work no matter where they're invoked from."""

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = REPO_ROOT / "data" / "raw"
CURATED_DIR = REPO_ROOT / "data" / "curated"
BUNDLE_DIR = REPO_ROOT / "data" / "bundle"
GOLDEN_VECTORS_PATH = (
    REPO_ROOT / "app" / "src" / "lib" / "market-math" / "golden-vectors.json"
)

# Analysis window (inclusive). T-100 additionally fetches 2026 for the
# DiD treatment quarter (2026Q1, the last full pre-shutdown quarter).
FIRST_YEAR = 2014
LAST_YEAR = 2025
T100_EXTRA_YEARS = [2026]
