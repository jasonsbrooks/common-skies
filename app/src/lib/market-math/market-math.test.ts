import { describe, expect, it } from "vitest";
import {
  BIG_THREE,
  divestOwners,
  farePrediction,
  hhi,
  mhhiDelta,
  normalizeShares,
  removeCarrier,
  type OwnershipStake,
} from "./index";

describe("hhi", () => {
  it("is 1.0 (10,000 points) for a monopoly", () => {
    expect(hhi({ AA: 1 })).toBe(1);
  });

  it("is 0.5 (5,000 points) for a symmetric duopoly", () => {
    expect(hhi({ AA: 0.5, DL: 0.5 })).toBe(0.5);
  });

  it("normalizes raw counts: 300/100 passengers → 0.75² + 0.25² = 0.625", () => {
    expect(hhi({ AA: 300, DL: 100 })).toBeCloseTo(0.625, 12);
  });

  it("drops non-positive shares", () => {
    expect(normalizeShares({ AA: 2, DL: 0, NK: -1 })).toEqual({ AA: 1 });
  });
});

describe("mhhiDelta", () => {
  it("is 0 with fewer than two carriers", () => {
    expect(mhhiDelta({ AA: 1 }, [], "proportional")).toBe(0);
  });

  it("is 0 under separate ownership", () => {
    // Owner X holds only AA, owner Y holds only DL: no one internalizes
    // the rival's profits.
    const ownership: OwnershipStake[] = [
      { owner: "X", carrier: "AA", beta: 0.3 },
      { owner: "Y", carrier: "DL", beta: 0.3 },
    ];
    expect(mhhiDelta({ AA: 0.5, DL: 0.5 }, ownership, "proportional")).toBe(0);
  });

  it("equals 0.5 for a symmetric duopoly with one common owner (merger-equivalent)", () => {
    // Profit weight AA↔DL = (β·β)/(β²) = 1, so
    // MHHIΔ = 2 · 0.5 · 0.5 · 1 = 0.5 and MHHI = HHI + MHHIΔ = 1.0,
    // the monopoly value — O'Brien & Salop's headline case.
    const ownership: OwnershipStake[] = [
      { owner: "Fund", carrier: "AA", beta: 1 },
      { owner: "Fund", carrier: "DL", beta: 1 },
    ];
    expect(
      mhhiDelta({ AA: 0.5, DL: 0.5 }, ownership, "proportional"),
    ).toBeCloseTo(0.5, 12);
  });

  it("is invariant to the sole owner's stake size (profit weights are ratios)", () => {
    const small: OwnershipStake[] = [
      { owner: "Fund", carrier: "AA", beta: 0.1 },
      { owner: "Fund", carrier: "DL", beta: 0.1 },
    ];
    expect(
      mhhiDelta({ AA: 0.5, DL: 0.5 }, small, "proportional"),
    ).toBeCloseTo(0.5, 12);
  });

  it("matches the hand-worked asymmetric example under both assumptions", () => {
    // Market: A 60%, B 40%. Owners (β):
    //   Vanguard     A .10  B .08   (Big Three)
    //   BlackRock    A .06  B .07   (Big Three)
    //   Berkshire    A .04  B .05   (diversified, NOT Big Three)
    //   HedgeCo      A .05          (undiversified)
    //   UndivCo             B .20   (undiversified)
    //
    // Proportional (γ = β):
    //   pw(A→B) = (.10·.08 + .06·.07 + .04·.05) / (.10² + .06² + .04² + .05²)
    //           = .0142 / .0177 = 0.80226
    //   pw(B→A) = .0142 / (.08² + .07² + .05² + .20²)
    //           = .0142 / .0538 = 0.26394
    //   MHHIΔ = .6·.4·(pw(A→B) + pw(B→A)) = .24 · 1.06620 = 0.25589
    //
    // Passive-index (Vanguard & BlackRock γ = 0; Berkshire keeps control):
    //   pw(A→B) = (.04·.05) / (.05² + .04²) = .002 / .0041 = 0.48780
    //   pw(B→A) = .002 / (.20² + .05²)      = .002 / .0425 = 0.04706
    //   MHHIΔ = .24 · 0.53486 = 0.12837
    const shares = { A: 0.6, B: 0.4 };
    const ownership: OwnershipStake[] = [
      { owner: "Vanguard", carrier: "A", beta: 0.1 },
      { owner: "Vanguard", carrier: "B", beta: 0.08 },
      { owner: "BlackRock", carrier: "A", beta: 0.06 },
      { owner: "BlackRock", carrier: "B", beta: 0.07 },
      { owner: "Berkshire", carrier: "A", beta: 0.04 },
      { owner: "Berkshire", carrier: "B", beta: 0.05 },
      { owner: "HedgeCo", carrier: "A", beta: 0.05 },
      { owner: "UndivCo", carrier: "B", beta: 0.2 },
    ];
    expect(mhhiDelta(shares, ownership, "proportional")).toBeCloseTo(
      0.25588809778841914,
      12,
    );
    expect(mhhiDelta(shares, ownership, "passive-index")).toBeCloseTo(
      0.12836728837876616,
      12,
    );
  });

  it("collapses to 0 under passive-index when only the Big Three cross-hold", () => {
    const ownership: OwnershipStake[] = [
      { owner: "Vanguard", carrier: "AA", beta: 0.1 },
      { owner: "Vanguard", carrier: "DL", beta: 0.1 },
      { owner: "State Street", carrier: "AA", beta: 0.05 },
      { owner: "State Street", carrier: "DL", beta: 0.05 },
      { owner: "Solo", carrier: "AA", beta: 0.2 }, // undiversified
    ];
    const shares = { AA: 0.5, DL: 0.5 };
    // pw(AA→DL) = .0125/.0525 = 5/21 (Solo dilutes AA's holder base);
    // pw(DL→AA) = .0125/.0125 = 1 (all of DL's holders hold AA alike);
    // MHHIΔ = .25 · (5/21 + 1) = 13/42.
    expect(mhhiDelta(shares, ownership, "proportional")).toBeCloseTo(13 / 42, 12);
    expect(mhhiDelta(shares, ownership, "passive-index")).toBe(0);
  });

  it("gives an owner-less carrier zero pair terms, without NaN", () => {
    // C has no reported holders → its denominator is 0 → its terms are 0.
    const ownership: OwnershipStake[] = [
      { owner: "Fund", carrier: "A", beta: 0.1 },
      { owner: "Fund", carrier: "B", beta: 0.1 },
    ];
    const delta = mhhiDelta({ A: 0.4, B: 0.4, C: 0.2 }, ownership, "proportional");
    // Only the A↔B pair contributes: 2 · 0.4 · 0.4 · 1 = 0.32.
    expect(delta).toBeCloseTo(0.32, 12);
  });

  it("ignores ownership rows for carriers not in the market", () => {
    const base: OwnershipStake[] = [
      { owner: "Fund", carrier: "A", beta: 0.1 },
      { owner: "Fund", carrier: "B", beta: 0.1 },
    ];
    const withStray = [...base, { owner: "Fund", carrier: "ZZ", beta: 0.5 }];
    const shares = { A: 0.5, B: 0.5 };
    expect(mhhiDelta(shares, withStray, "proportional")).toBe(
      mhhiDelta(shares, base, "proportional"),
    );
  });
});

describe("farePrediction", () => {
  it("splits the channels and converts log points to a % change", () => {
    const before = { hhi: 0.24, mhhiDelta: 0.2 };
    const after = { hhi: 0.3, mhhiDelta: 0.15 };
    const regime = { coefHhi: 0.255, coefMhhiDelta: 0.202 };
    const p = farePrediction(before, after, regime);
    expect(p.concentrationChannel).toBeCloseTo(0.255 * 0.06, 12);
    expect(p.commonOwnershipChannel).toBeCloseTo(0.202 * -0.05, 12);
    expect(p.totalLogChange).toBeCloseTo(0.0153 - 0.0101, 12);
    expect(p.pctChange).toBeCloseTo(Math.exp(0.0052) - 1, 12);
  });

  it("zeroes only the disputed channel when the MHHIΔ coefficient is 0", () => {
    const p = farePrediction(
      { hhi: 0.2, mhhiDelta: 0.1 },
      { hhi: 0.3, mhhiDelta: 0.3 },
      { coefHhi: 0.255, coefMhhiDelta: 0 },
    );
    expect(p.commonOwnershipChannel).toBe(0);
    expect(p.concentrationChannel).toBeGreaterThan(0);
  });
});

describe("scenario helpers", () => {
  it("removeCarrier renormalizes the survivors proportionally", () => {
    const survivors = removeCarrier({ AA: 0.5, DL: 0.3, NK: 0.2 }, "NK");
    expect(Object.keys(survivors).sort()).toEqual(["AA", "DL"]);
    expect(survivors.AA).toBeCloseTo(0.625, 12);
    expect(survivors.DL).toBeCloseTo(0.375, 12);
  });

  it("divestOwners drops exactly the named owners' stakes", () => {
    const ownership: OwnershipStake[] = [
      { owner: "Vanguard", carrier: "AA", beta: 0.1 },
      { owner: "Berkshire", carrier: "AA", beta: 0.04 },
      { owner: "BlackRock", carrier: "DL", beta: 0.06 },
    ];
    expect(divestOwners(ownership, BIG_THREE)).toEqual([
      { owner: "Berkshire", carrier: "AA", beta: 0.04 },
    ]);
  });
});
