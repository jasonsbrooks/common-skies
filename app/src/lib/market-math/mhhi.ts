import { normalizeShares } from "./hhi";
import type { ControlAssumption, MarketShares, OwnershipStake } from "./types";
import { BIG_THREE } from "./types";

/**
 * MHHI delta — the increase in effective concentration due solely to
 * common ownership (O'Brien & Salop 2000; AST 2018 §I):
 *
 *   MHHIΔ = Σ_j Σ_{k≠j} s_j · s_k · (Σ_i γ_ij · β_ik) / (Σ_i γ_ij · β_ij)
 *
 * where β_ik is owner i's cash-flow stake in carrier k and γ_ij is owner
 * i's control weight over carrier j. The fraction is carrier j's "profit
 * weight" on rival k: how much j's controlling shareholders care about
 * k's profits relative to j's own.
 *
 * Control assumptions (the assumption toggle):
 * - "proportional": γ = β for all reported holders (AST baseline).
 * - "passive-index": owners named in `passiveOwners` get γ = 0 — their
 *   cross-holdings exert no control and drop from every term. Their β
 *   also never enters, because β only appears multiplied by some γ of
 *   the same owner.
 *
 * A carrier whose holder list is empty under the active assumption has a
 * zero denominator; its pair terms contribute 0 (an owner-less firm has
 * no one to internalize rivals' profits for). Carriers absent from the
 * market shares contribute nothing regardless of ownership rows.
 *
 * Returns the 0–1 scale (×10,000 for points).
 */
export function mhhiDelta(
  shares: MarketShares,
  ownership: OwnershipStake[],
  assumption: ControlAssumption,
  passiveOwners: readonly string[] = BIG_THREE,
): number {
  const s = normalizeShares(shares);
  const carriers = Object.keys(s);
  if (carriers.length < 2) return 0;

  const passive = new Set<string>(
    assumption === "passive-index" ? passiveOwners : [],
  );

  // beta[owner][carrier], restricted to carriers in this market and
  // owners with control (gamma = beta for everyone kept).
  const beta = new Map<string, Map<string, number>>();
  for (const { owner, carrier, beta: b } of ownership) {
    if (b <= 0 || passive.has(owner) || !(carrier in s)) continue;
    let row = beta.get(owner);
    if (!row) beta.set(owner, (row = new Map()));
    row.set(carrier, (row.get(carrier) ?? 0) + b);
  }

  // profitWeight(j, k) = Σ_i γ_ij β_ik / Σ_i γ_ij β_ij with γ = β.
  const profitWeight = (j: string, k: string): number => {
    let numerator = 0;
    let denominator = 0;
    for (const row of beta.values()) {
      const gammaJ = row.get(j) ?? 0;
      if (gammaJ === 0) continue;
      numerator += gammaJ * (row.get(k) ?? 0);
      denominator += gammaJ * gammaJ;
    }
    return denominator > 0 ? numerator / denominator : 0;
  };

  let delta = 0;
  for (const j of carriers) {
    for (const k of carriers) {
      if (j === k) continue;
      delta += s[j]! * s[k]! * profitWeight(j, k);
    }
  }
  return delta;
}
