/**
 * Core types for the market-math module.
 *
 * Scale conventions: market shares and ownership stakes live on 0–1.
 * HHI and MHHI delta are computed on 0–1 and displayed ×10,000 "points"
 * (the papers report points but run regressions on 0–1, matching the
 * coefficient pairs below).
 */

/** Market shares by carrier code, e.g. { AA: 0.4, DL: 0.6 }. */
export type MarketShares = Record<string, number>;

/** One owner's cash-flow stake (beta) in one carrier, on 0–1. */
export interface OwnershipStake {
  owner: string;
  carrier: string;
  beta: number;
}

/**
 * The assumption toggle — how control (gamma) is assigned when
 * constructing MHHI delta:
 * - "proportional": gamma = beta for every reported holder (AST baseline).
 * - "passive-index": passive owners (the Big Three) exert no control;
 *   their gamma is 0, everyone else keeps gamma = beta.
 */
export type ControlAssumption = "proportional" | "passive-index";

/** Owners treated as control-less under "passive-index". */
export const BIG_THREE = ["Vanguard", "BlackRock", "State Street"] as const;

/**
 * A regime: coefficients from a published log-fare regression.
 * Both on the 0–1 concentration scale.
 */
export interface Regime {
  id: string;
  label: string;
  /** Coefficient on MHHI delta in log(avg fare). */
  coefMhhiDelta: number;
  /** Coefficient on HHI in log(avg fare). */
  coefHhi: number;
  citation: string;
}

/** AST 2018, Table 3, column (6): market-level, full controls. */
export const REGIME_AST: Regime = {
  id: "ast",
  label: "AST (2018)",
  coefMhhiDelta: 0.202,
  coefHhi: 0.255,
  citation:
    "Azar, Schmalz & Tecu (2018), J. Finance 73(4), Table 3 col. (6), market-level",
};

/** DGS Table V, Panel B, column (4): IV specification, market-level. */
export const REGIME_DGS: Regime = {
  id: "dgs",
  label: "DGS (2022)",
  coefMhhiDelta: 0.063,
  coefHhi: 0.225,
  citation:
    "Dennis, Gerardi & Schenone (2022), J. Finance 77(5), Table V Panel B col. (4), IV, market-level (statistically indistinguishable from zero)",
};
