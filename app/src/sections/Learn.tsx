import { useState } from "react";
import { OwnershipWeb } from "../components/OwnershipWeb";
import { hhi, mhhiDelta, type OwnershipStake } from "../lib/market-math";

const TOY_NAMES = { BLU: "Blue Air", RED: "Red Jet" };
const FOUNDER_STAKE = 0.2;

/** Reference points on the 0–10,000 concentration scale. */
const SCALE_MARKS = [
  { at: 1000, label: "ten equal rivals", detail: "10 airlines × 10% each" },
  { at: 2500, label: "regulators worry", detail: "mergers above this line get scrutiny" },
  { at: 5000, label: "two equal rivals", detail: "2 airlines × 50% each" },
  { at: 10000, label: "monopoly", detail: "one airline, all passengers" },
];

function ScaleStrip() {
  return (
    <div className="scale-strip" aria-label="The 0 to 10,000 concentration scale">
      <div className="scale-track">
        {SCALE_MARKS.map((m) => (
          <div key={m.at} className="scale-mark" style={{ left: `${(m.at / 10000) * 100}%` }}>
            <div className="scale-tick" />
            <div className="scale-at">{m.at.toLocaleString()}</div>
            <div className="scale-label">{m.label}</div>
            <div className="scale-detail">{m.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The sixty-second toy: two airlines, one fund, two sliders. The official
 * score can't see the fund; the ownership-aware score can. Same math core
 * as the rest of the site. */
export function Learn() {
  const [bluStake, setBluStake] = useState(0);
  const [redStake, setRedStake] = useState(0);

  const shares = { BLU: 0.5, RED: 0.5 };
  // FundCo rows are always present (even at 0) so its node keeps its slot
  // in the web while dragging — the math core ignores zero-beta stakes.
  const stakes: OwnershipStake[] = [
    { owner: "Blue's founder", carrier: "BLU", beta: FOUNDER_STAKE },
    { owner: "Red's founder", carrier: "RED", beta: FOUNDER_STAKE },
    { owner: "FundCo", carrier: "BLU", beta: bluStake },
    { owner: "FundCo", carrier: "RED", beta: redStake },
  ];
  const h = Math.round(hhi(shares) * 10000);
  const delta = Math.round(mhhiDelta(shares, stakes, "proportional") * 10000);

  return (
    <section className="section" id="learn">
      <div className="wrap">
        <div className="section-kicker">① Learn the mechanism</div>
        <h2>First, how do you put a number on competition?</h2>
        <p className="section-lede">
          Before anyone can argue about whether shared owners kill
          competition, you need a way to <em>score</em> how competitive a
          market is. Economists have a standard one — and this whole fight is
          about what that score fails to count.
        </p>

        <div className="primer">
          <p>
            The official score is called <strong>HHI</strong> (initials of
            the economists who invented it). The recipe is simple:{" "}
            <em>
              take each company's percent of the market, square it, and add
              the squares up.
            </em>{" "}
            Squaring makes dominant companies count extra. The scale runs
            from near 0 (countless tiny competitors) to 10,000 (one
            monopolist with 100%: 100² = 10,000):
          </p>
          <ScaleStrip />
          <p>
            Regulators use HHI to decide which mergers to challenge. But
            notice what the recipe is made of: <em>market shares and nothing
            else</em>. HHI has no idea who <em>owns</em> the companies. Two
            fierce independent rivals and two "rivals" owned by the same
            person score exactly the same. That blind spot is where our story
            lives — so economists built an extended score,{" "}
            <strong>MHHI</strong>, that starts from HHI and adds points when
            competitors share owners. How many points to add — and whether to
            add any at all — is the fight.
          </p>
        </div>

        <h3 className="toy-title">Try it: give two rivals the same owner</h3>
        <p className="toy-setup">
          Below is an imaginary route flown by <strong>Blue Air</strong> and{" "}
          <strong>Red Jet</strong>, each carrying half the passengers, each
          20%-owned by its own founder. Two equal rivals: HHI scores it{" "}
          <strong>5,000</strong> (50² + 50²), and since no merger ever
          happens here, that score is frozen. Now let an investment fund —{" "}
          <strong>FundCo</strong> — buy stock in <em>both</em> airlines, and
          watch the two scoreboards below.
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
                <div className="toy-score-label">HHI · the official score</div>
                <div className="toy-score-value">{h.toLocaleString()}</div>
                <div className="toy-score-note">
                  sees only market shares — still two equal rivals, so it
                  cannot move
                </div>
              </div>
              <div className="toy-score">
                <div className="toy-score-label" style={{ color: "var(--mhhi)" }}>
                  MHHI · ownership counted
                </div>
                <div className="toy-score-value" style={{ color: "var(--mhhi)" }}>
                  {(h + delta).toLocaleString()}
                  <span className="toy-delta">
                    {delta > 0 ? ` (+${delta.toLocaleString()})` : ""}
                  </span>
                </div>
                <div className="toy-score-note">
                  {delta === 0
                    ? "no shared owner yet, so it agrees with HHI exactly"
                    : delta < 800
                      ? "adding points: each airline's shareholders now win a little even when it loses"
                      : "to this score the market is drifting toward monopoly — no merger, nothing for regulators to block"}
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
              ownerOrder={["Blue's founder", "FundCo", "Red's founder"]}
              maxOwners={3}
              height={200}
            />
            <p className="web-caption">
              Every line is an ownership stake. HHI sees only the bottom row —
              two separate airlines. MHHI also sees the lines. The extra
              points it adds (the gap between the two scoreboards) are called{" "}
              <strong>MHHI delta</strong> — remember that name, because the
              rest of this site is a fight over how big it is and whether it
              costs you money.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
