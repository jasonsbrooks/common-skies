import type { MarketShares } from "./types";

/**
 * Normalize shares to sum to 1. Carriers with non-positive share are
 * dropped. Returns {} when nothing positive remains.
 */
export function normalizeShares(shares: MarketShares): MarketShares {
  const entries = Object.entries(shares).filter(([, s]) => s > 0);
  const total = entries.reduce((acc, [, s]) => acc + s, 0);
  if (total <= 0) return {};
  return Object.fromEntries(entries.map(([c, s]) => [c, s / total]));
}

/**
 * Herfindahl–Hirschman Index on the 0–1 scale (multiply by 10,000 for
 * points). Input shares are normalized first, so callers may pass raw
 * passenger counts.
 */
export function hhi(shares: MarketShares): number {
  const normalized = normalizeShares(shares);
  return Object.values(normalized).reduce((acc, s) => acc + s * s, 0);
}
