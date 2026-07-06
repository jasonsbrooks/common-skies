# Phase 4 Subplan — App Shell + Explore View

## Design decisions (proposed)

- **Charts are hand-rolled SVG React components** with only `d3-scale` + `d3-shape` as helpers (~10KB). Rationale: event annotations, the toggle morph animation, and the ownership web all need pixel-level control a chart lib fights us on; for this assignment, chart craft is part of the demo. Series morphs use a small `useAnimatedSeries` hook (rAF lerp between the two precomputed series — both have identical quarter grids, so interpolation is index-wise and trivial).
- **Single-page scroll with a sticky story rail.** Sections: Hero → ① Learn → ② Explore → ③ Simulate → ④ The Prediction, with `#anchors` for deep links and the rail highlighting the active section. Matches the "first 3 minutes" narrative; no router needed.
- **Global toggle state in one React context**: `{assumption, regimeId, customCoef, selectedRouteId}`. The two toggles render in a sticky control bar that appears once the user scrolls past Learn (they apply to Explore + Simulate + Prediction). Camp theming: AST = coral, DGS/critics = teal, applied to the regime toggle, series accents, and the receipt's disputed line.
- **Bundle loads via `fetch('bundle.json')`** at app start (330KB, gzips to ~travel-size); a skeleton state until loaded.

## Components

```
src/
  App.tsx              shell: hero, story rail, sections, footer (commit hash placeholder until Phase 7)
  state.tsx            TogglesProvider + useToggles()
  lib/bundle.ts        types + loader for bundle.json
  lib/market-math/     (exists)
  components/
    Hero.tsx           headline question, 2-sentence setup, camp cards (AST/DGS with citations)
    StoryRail.tsx      numbered sticky nav
    ControlBar.tsx     assumption toggle, regime toggle (+custom slider), camp-colored
    RoutePicker.tsx    searchable top-50 list (city pair + pax/day)
    FareChart.tsx      quarterly avg fare + event annotations
    ConcentrationChart.tsx  HHI + MHHIΔ lines; MHHIΔ morphs on assumption flip
    EventMarkers.tsx   shared annotation layer (from bundle events)
    OwnershipWeb.tsx   funds→carriers network; edge width = stake; passive greys Big Three;
                       props: {ownership, carriers, weights?, interactive?} (Learn reuses it)
  sections/
    Learn.tsx          (Phase 6 — placeholder this phase)
    Explore.tsx        route picker + charts + compact ownership web
    Simulate.tsx       (Phase 5 — placeholder)
    Prediction.tsx     (Phase 7 — placeholder)
```

## Commits

1. `docs:` this subplan
2. `app: Vite+React scaffold, bundle loader, hero + story rail + section shell`
3. `app: Explore — route picker, fare + concentration charts with event annotations`
4. `app: global toggles with camp theming + animated series morph`
5. `app: ownership web component, compact instance in Explore`

## Verification

Dev server + preview screenshots at each commit; vitest stays green; typecheck clean; bundle fetch works from `public/` copy (build step symlinks/copies `data/bundle/bundle.json` → `app/public/bundle.json` — one `cp` in a `prebuild`/`predev` npm script so the repo keeps a single source of truth).
