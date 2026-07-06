/**
 * Cross-language parity: the pipeline (pipeline/mhhi.py) emits real
 * route-quarter inputs with its computed outputs; this suite asserts the
 * TS core reproduces them exactly. If the two implementations ever
 * drift, this fails before any chart lies.
 *
 * Regenerate with: pipeline/.venv/bin/python pipeline/build_bundle.py
 */
import { describe, expect, it } from "vitest";
import { hhi, mhhiDelta, type OwnershipStake } from "./index";
import golden from "./golden-vectors.json";

interface Vector {
  label: string;
  shares: Record<string, number>;
  ownership: OwnershipStake[];
  assumption: "proportional" | "passive-index";
  expectedHhi: number;
  expectedMhhiDelta: number;
}

describe("golden-vector parity with the Python pipeline", () => {
  const vectors = (golden as unknown as { vectors: Vector[] }).vectors;

  it("has vectors covering both assumptions and multiple snapshots", () => {
    expect(vectors.length).toBeGreaterThanOrEqual(12);
    expect(new Set(vectors.map((v) => v.assumption)).size).toBe(2);
  });

  for (const v of vectors) {
    it(v.label, () => {
      expect(hhi(v.shares)).toBeCloseTo(v.expectedHhi, 12);
      expect(mhhiDelta(v.shares, v.ownership, v.assumption)).toBeCloseTo(
        v.expectedMhhiDelta,
        12,
      );
    });
  }
});
