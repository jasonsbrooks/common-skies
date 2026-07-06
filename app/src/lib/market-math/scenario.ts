import { normalizeShares } from "./hhi";
import type { MarketShares, OwnershipStake } from "./types";

/**
 * Carrier-exit scenario (e.g. Spirit shutdown): remove the carrier and
 * renormalize the remaining shares proportionally. Proportional
 * reallocation is a disclosed simplification — real reallocation favors
 * overlapping-route carriers.
 */
export function removeCarrier(
  shares: MarketShares,
  carrier: string,
): MarketShares {
  const { [carrier]: _removed, ...rest } = shares;
  return normalizeShares(rest);
}

/**
 * Divestiture scenario (e.g. "the Big Three sell all airline stock"):
 * drop every stake held by the named owners. The remaining holders'
 * stakes are left as-is — MHHIΔ's profit weights renormalize by
 * construction (each carrier's denominator only sums its own holders).
 */
export function divestOwners(
  ownership: OwnershipStake[],
  owners: readonly string[],
): OwnershipStake[] {
  const gone = new Set(owners);
  return ownership.filter((stake) => !gone.has(stake.owner));
}
