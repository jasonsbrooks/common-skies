/** Types for data/bundle/bundle.json (built by pipeline/build_bundle.py). */

export interface RouteSeries {
  quarters: string[];
  fare: (number | null)[];
  shares: (Record<string, number> | null)[];
  hhi: (number | null)[];
  mhhiDeltaAst: (number | null)[];
  mhhiDeltaPassive: (number | null)[];
}

export interface Route {
  id: string;
  city1: string;
  city2: string;
  miles: number;
  meanDailyPax: number;
  series: RouteSeries;
}

export interface Regime {
  id: string;
  label: string;
  coefMhhiDelta: number;
  coefMhhiDeltaSE: number;
  coefHhi: number;
  coefHhiSE: number;
  citation: string;
}

export interface BundleEvent {
  id: string;
  quarter: string;
  date: string;
  label: string;
  detail: string;
  source: string;
  beyond_series?: boolean;
}

export interface OwnershipRow {
  owner: string;
  carrier: string;
  pct: number;
}

export interface DidPair {
  treatment: string;
  control: string;
  treatmentCities: [string, string];
  controlCities: [string, string];
  spiritShare: number;
  dHhiPoints: number;
  dMhhiAstPoints: number;
  dMhhiPassivePoints: number;
}

export interface DidPrediction {
  assumption: "proportional" | "passive-index";
  regime: string;
  meanDHhiPoints: number;
  meanDMhhiPoints: number;
  concentrationChannelPct: number;
  commonOwnershipChannelPct: number;
  predictedSpreadPct: number;
}

export interface Bundle {
  meta: {
    window: [string, string];
    sources: Record<string, string>;
    routeCount: number;
    qaPassedRoutes: number;
    treatmentQuarter: string;
  };
  carrierNames: Record<string, string>;
  regimes: Regime[];
  regimeContext: Record<string, unknown>;
  events: BundleEvent[];
  ownershipSnapshots: Record<string, OwnershipRow[]>;
  snapshotRanges: { snapshot: string; from: string; to: string }[];
  routes: Route[];
  did: {
    design: string;
    pairs: DidPair[];
    predictions: DidPrediction[];
  };
}

export async function loadBundle(): Promise<Bundle> {
  const res = await fetch(`${import.meta.env.BASE_URL}bundle.json`);
  if (!res.ok) throw new Error(`bundle fetch failed: ${res.status}`);
  return (await res.json()) as Bundle;
}

/** Shorten "San Francisco, CA (Metropolitan Area)" -> "San Francisco". */
export function shortCity(city: string): string {
  return city.split(",")[0] ?? city;
}

export function routeLabel(route: Route): string {
  return `${shortCity(route.city1)} ↔ ${shortCity(route.city2)}`;
}
