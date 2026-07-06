# Common Skies

*Do index funds make your plane tickets more expensive?*

An interactive site about one of the biggest open fights in economics — whether **common ownership** (Vanguard, BlackRock, and State Street holding large stakes in every major U.S. airline at once) softens competition and raises fares. Economists have fought about it since 2018 (Azar, Schmalz & Tecu, *J. Finance* 2018 vs. Dennis, Gerardi & Schenone, *J. Finance* 2022). Nobody has won.

This site doesn't pick a side. The disputed assumptions become the interface: you flip them and watch the answer change, on a decade of real airline data — closing with a pre-registered difference-in-differences prediction about the natural experiment that began May 2, 2026, when Spirit Airlines shut down.

## Layout

```
pipeline/     Offline Python + DuckDB pipeline: BTS/DOT data → one JSON bundle
data/
  raw/        Cached downloads (gitignored; pipeline re-fetches)
  curated/    Hand-curated inputs: ownership snapshots, coefficients, events, airport crosswalk
  bundle/     The built artifact the app loads (checked in — you never need to run the pipeline)
app/          Static React front end; all interaction client-side, no backend, no keys
docs/
  plans/      Build plans and phase subplans
  prereg/     The dated pre-registration artifact (the site footer cites its commit hash)
```

## Run it locally

```bash
cd app
npm install
npm run dev        # http://localhost:5173
```

The data bundle is checked in — no pipeline run, keys, or backend needed. To
rebuild the bundle from raw government data anyway:

```bash
cd pipeline
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python fetch_fares.py   # DOT Table 6 via Socrata (~140MB cache)
.venv/bin/python fetch_t100.py    # BTS T-100 yearly zips via TranStats
.venv/bin/python build_bundle.py  # deterministic; asserts its own coherence
.venv/bin/python -m pytest tests/
```

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`: install → test
(including the golden-vector parity suite) → build → GitHub Pages. Enable
Pages in repo settings with source "GitHub Actions" once.

## Pre-registration

The Spirit-shutdown difference-in-differences predictions are frozen in
[docs/prereg/2026-07-06-spirit-shutdown-did.md](docs/prereg/2026-07-06-spirit-shutdown-did.md);
the site footer cites the freezing commit's hash. Reality grades them ~Q1 2027.

See [docs/plans/01-high-level-plan.md](docs/plans/01-high-level-plan.md) for
the build plan and phase subplans.
