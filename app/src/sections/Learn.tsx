import { useState } from "react";
import { OwnershipWeb } from "../components/OwnershipWeb";
import { hhi, mhhiDelta, type OwnershipStake } from "../lib/market-math";

const TOY_NAMES = { BLU: "Blue Air", RED: "Red Jet" };
const FOUNDER_STAKE = 0.2;

/** The sixty-second toy: two airlines, one fund, two sliders. HHI can't
 * see the fund; MHHI delta can. Same math core as everything else. */
export function Learn() {
  const [bluStake, setBluStake] = useState(0);
  const [redStake, setRedStake] = useState(0);

  const shares = { BLU: 0.5, RED: 0.5 };
  const stakes: OwnershipStake[] = [
    { owner: "Blue's founder", carrier: "BLU", beta: FOUNDER_STAKE },
    { owner: "Red's founder", carrier: "RED", beta: FOUNDER_STAKE },
    ...(bluStake > 0 ? [{ owner: "FundCo", carrier: "BLU", beta: bluStake }] : []),
    ...(redStake > 0 ? [{ owner: "FundCo", carrier: "RED", beta: redStake }] : []),
  ];
  const h = Math.round(hhi(shares) * 10000);
  const delta = Math.round(mhhiDelta(shares, stakes, "proportional") * 10000);

  return (
    <section className="section" id="learn">
      <div className="wrap">
        <div className="section-kicker">① Learn the mechanism</div>
        <h2>Two airlines, one fund — sixty seconds</h2>
        <p className="section-lede">
          Imagine a route flown by exactly two airlines, splitting passengers
          50/50. Each has a founder who owns 20%. Now a fund — call it FundCo
          — starts buying stock in <em>both</em>. Drag its stakes up and watch
          which score notices.
        </p>

        <div className="toy-grid">
          <div className="toy-controls">
            <label className="toy-slider">
              <span>
                FundCo owns <strong>{Math.round(bluStake * 100)}%</strong> of{" "}
                {TOY_NAMES.BLU}
              </span>
              <input
                type="range"
                min="0"
                max="0.3"
                step="0.01"
                value={bluStake}
                onChange={(e) => setBluStake(Number(e.target.value))}
              />
            </label>
            <label className="toy-slider">
              <span>
                FundCo owns <strong>{Math.round(redStake * 100)}%</strong> of{" "}
                {TOY_NAMES.RED}
              </span>
              <input
                type="range"
                min="0"
                max="0.3"
                step="0.01"
                value={redStake}
                onChange={(e) => setRedStake(Number(e.target.value))}
              />
            </label>

            <div className="toy-scores">
              <div className="toy-score">
                <div className="toy-score-label">
                  HHI — what regulators score
                </div>
                <div className="toy-score-value">{h.toLocaleString()}</div>
                <div className="toy-score-note">
                  never moves: no merger happened, no market share changed
                </div>
              </div>
              <div className="toy-score">
                <div className="toy-score-label" style={{ color: "var(--mhhi)" }}>
                  MHHI — ownership counted
                </div>
                <div className="toy-score-value" style={{ color: "var(--mhhi)" }}>
                  {(h + delta).toLocaleString()}
                  <span className="toy-delta">
                    {delta > 0 ? ` (+${delta.toLocaleString()})` : ""}
                  </span>
                </div>
                <div className="toy-score-note">
                  {delta === 0
                    ? "identical to HHI while FundCo owns nothing"
                    : delta < 800
                      ? "climbing — each airline now profits a little when its rival wins"
                      : "a merger-sized jump, and no merger anyone could block"}
                </div>
              </div>
            </div>
          </div>

          <div className="toy-web">
            <OwnershipWeb
              stakes={stakes.map((s) => ({ owner: s.owner, carrier: s.carrier, pct: s.beta * 100 }))}
              carriers={["BLU", "RED"]}
              carrierNames={TOY_NAMES}
              assumption="proportional"
              weights={shares}
              maxOwners={3}
              height={200}
            />
            <p className="web-caption">
              This is the entire dispute in one picture: do FundCo's wires
              change how hard Blue and Red compete? AST says yes and measures
              it; the critics say the Big Three's wires, at least, are dead
              weight. That's Dial 1, coming next.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
