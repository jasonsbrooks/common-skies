import type { Regime } from "./types";

export interface ConcentrationState {
  /** HHI on the 0–1 scale. */
  hhi: number;
  /** MHHI delta on the 0–1 scale. */
  mhhiDelta: number;
}

export interface FarePrediction {
  /** β_HHI · ΔHHI, in log points. */
  concentrationChannel: number;
  /** β_MHHIΔ · ΔMHHIΔ, in log points — the disputed line item. */
  commonOwnershipChannel: number;
  /** Sum of both channels, in log points. */
  totalLogChange: number;
  /** exp(total) − 1, e.g. 0.042 = fares predicted 4.2% higher. */
  pctChange: number;
}

/**
 * Channel-split fare prediction for a scenario moving concentration from
 * `before` to `after`, under a regime's published log-fare coefficients.
 * Linear in the deltas, so custom coefficients are free.
 */
export function farePrediction(
  before: ConcentrationState,
  after: ConcentrationState,
  regime: Pick<Regime, "coefHhi" | "coefMhhiDelta">,
): FarePrediction {
  const concentrationChannel = regime.coefHhi * (after.hhi - before.hhi);
  const commonOwnershipChannel =
    regime.coefMhhiDelta * (after.mhhiDelta - before.mhhiDelta);
  const totalLogChange = concentrationChannel + commonOwnershipChannel;
  return {
    concentrationChannel,
    commonOwnershipChannel,
    totalLogChange,
    pctChange: Math.exp(totalLogChange) - 1,
  };
}
