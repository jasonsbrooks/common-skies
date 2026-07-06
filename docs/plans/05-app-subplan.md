# Phase 4 Subplan — App Shell + Explore View

## Decisions locked with Jason (2026-07-06)

- **Editorial aesthetic** (data-journalism: serif display, off-white, restrained palette). Revisit at the end if it reads plain.
- **Default route = a classic major-vs-major market**, with preset "highlight route" chips for one-click swaps (SFO↔LAX, a Spirit-heavy route, etc.).
- **Route locator arc**: small US-outline map with the route's arc, subtle draw-in animation on route change. Editorial locator-map style, not a map *view*. First to cut inside Phase 4 if it looks cheap or runs long.
- **Both toggles global + the translation sentence** ships (upgraded from stretch): the regime toggle always has a visible consequence, e.g. "Under AST's estimate, common ownership adds ~$12 to the average fare on this route."
- **Resume state in localStorage**: active section, selected route, toggle settings persist across refresh. On return, a small "Welcome back — jump back to ② Explore · or start over" banner (no auto-scroll; less disorienting).
- **Desktop-first**; mobile just has to not look broken (charts scale via viewBox, panels stack).
- **Plain-language rule (site-wide):** no unexplained jargon anywhere. Every technical term (market share, HHI, MHHI delta, common ownership, index fund, coefficient, difference-in-differences) gets an inline plain-English definition or a dotted-underline tooltip (`<Term>` component). Hero written for a reader with zero background. MHHIΔ displayed in points (0–10,000) with a one-time scale explainer.

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
