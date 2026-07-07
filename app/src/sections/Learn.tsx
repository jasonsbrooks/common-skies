import { arc, pie } from "d3-shape";
import { useState } from "react";
import { OwnershipWeb } from "../components/OwnershipWeb";
import { hhi, mhhiDelta, type OwnershipStake } from "../lib/market-math";

const TOY_NAMES = { BLU: "Blue Air", RED: "Red Jet" };
const FOUNDER_STAKE = 0.2;

/* ------------------------------------------------------------------ */
/* The 0–10,000 scale, with labels alternating above and below the     */
/* track so neighbors can never collide, and an optional needle for    */
/* "your market scores here."                                          */
/* ------------------------------------------------------------------ */

const SCALE_MARKS = [
  { at: 1000, label: "ten equal rivals", detail: "10 airlines × 10% each", side: "up" },
  { at: 1800, label: "regulators worry", detail: "the merger-review line", side: "down" },
  { at: 5000, label: "two equal rivals", detail: "2 airlines × 50% each", side: "up" },
  { at: 10000, label: "monopoly", detail: "one airline, all passengers", side: "down" },
] as const;

function ScaleStrip({ marker }: { marker?: number }) {
  return (
    <div className="scale-strip" aria-label="The 0 to 10,000 concentration scale">
      <div className="scale-track" />
      {SCALE_MARKS.map((m) => (
        <div
          key={m.at}
          className={`scale-mark ${m.side}${m.at === 10000 ? " edge-r" : ""}`}
          style={{ left: `${(m.at / 10000) * 100}%` }}
        >
          <div className="scale-at">{m.at.toLocaleString()}</div>
          <div className="scale-label">{m.label}</div>
          <div className="scale-detail">{m.detail}</div>
        </div>
      ))}
      {SCALE_MARKS.map((m) => (
        <div
          key={`tick-${m.at}`}
          className={`scale-tick ${m.side}`}
          style={{ left: `${(m.at / 10000) * 100}%` }}
        />
      ))}
      {marker !== undefined && (
        <div
          className="scale-needle"
          style={{ left: `${Math.min(100, (marker / 10000) * 100)}%` }}
          aria-label={`Your market scores ${Math.round(marker).toLocaleString()}`}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HHI playground: build a market, drag sizes, watch the score.        */
/* ------------------------------------------------------------------ */

const PIE_COLORS = ["#3d5a80", "#b8431d", "#0e6e56", "#c9a227", "#7a4bd6", "#8b5f4d", "#6b8e23", "#9a948a"];
const AIRLINE_NAMES = ["Airline A", "Airline B", "Airline C", "Airline D", "Airline E", "Airline F", "Airline G", "Airline H"];

function HhiPlayground() {
  const [sizes, setSizes] = useState<number[]>([50, 30, 20]);
  const total = sizes.reduce((a, b) => a + b, 0);
  const shares = sizes.map((s) => s / total);
  const score = Math.round(shares.reduce((acc, s) => acc + s * s, 0) * 10000);

  const setSize = (i: number, v: number) =>
    setSizes((prev) => prev.map((s, idx) => (idx === i ? v : s)));
  const addAirline = () => setSizes((prev) => [...prev, 15]);
  const removeAirline = (i: number) => setSizes((prev) => prev.filter((_, idx) => idx !== i));
  const equalize = () => setSizes((prev) => prev.map(() => 30));

  const pieGen = pie<number>().sort(null).value((d) => d);
  const arcGen = arc<{ startAngle: number; endAngle: number }>().innerRadius(34).outerRadius(80);
  const arcs = pieGen(sizes);

  const verdict =
    score >= 9000
      ? "That is basically a monopoly."
      : score >= 5000
        ? "Extremely concentrated — one or two players hold nearly everything."
        : score >= 1800
          ? "Regulators officially call this 'highly concentrated' — most mergers here would be challenged."
          : score >= 1000
            ? "Moderately concentrated, in regulators' terms."
            : "This market looks genuinely competitive.";

  return (
    <div className="playground">
      <div className="playground-controls">
        {sizes.map((size, i) => (
          <div key={i} className="pg-row">
            <span className="pg-swatch" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
            <span className="pg-name">
              {AIRLINE_NAMES[i]} <em>{Math.round(shares[i]! * 100)}%</em>
            </span>
            <input
              type="range"
              min="5"
              max="100"
              value={size}
              onChange={(e) => setSize(i, Number(e.target.value))}
              aria-label={`${AIRLINE_NAMES[i]} size`}
            />
            {sizes.length > 2 && (
              <button className="pg-remove" onClick={() => removeAirline(i)} aria-label={`Remove ${AIRLINE_NAMES[i]}`}>
                ×
              </button>
            )}
          </div>
        ))}
        <div className="pg-actions">
          {sizes.length < 8 && (
            <button className="pg-btn" onClick={addAirline}>
              + add an airline
            </button>
          )}
          <button className="pg-btn" onClick={equalize}>
            make them equal
          </button>
        </div>
      </div>
      <div className="playground-readout">
        <svg viewBox="0 0 180 180" className="pg-pie" role="img" aria-label="Market share pie chart">
          <g transform="translate(90,90)">
            {arcs.map((a, i) => (
              <path
                key={i}
                d={arcGen(a) ?? undefined}
                fill={PIE_COLORS[i % PIE_COLORS.length]}
                stroke="var(--paper-raised)"
                strokeWidth="2"
              />
            ))}
          </g>
        </svg>
        <div>
          <div className="toy-score-label">This market's HHI</div>
          <div className="toy-score-value">{score.toLocaleString()}</div>
          <div className="toy-score-note">{verdict}</div>
        </div>
      </div>
      <div className="playground-strip">
        <ScaleStrip marker={score} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Part two: the FundCo toy — what HHI cannot see.                     */
/* ------------------------------------------------------------------ */

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
          Before anyone can argue about whether shared owners weaken
          competition, we need a way to <em>score</em> how competitive a
          market is. Economists have a standard score, and this whole fight
          is about one thing that score fails to count.
        </p>

        <div className="primer">
          <p>
            The official score is called <strong>HHI</strong> (the
            Herfindahl–Hirschman Index, named after the two economists who
            invented it). The recipe is simple:{" "}
            <em>
              take each company's percent of the market, square it, and add
              the squares up.
            </em>{" "}
            Squaring makes dominant companies count extra. One monopolist
            with 100% of the market scores the maximum: 100² = 10,000. Try
            the recipe yourself — drag the airlines' sizes, add rivals,
            and watch the score move along the scale:
          </p>
          <HhiPlayground />
          <p>
            Regulators use exactly this score to decide which mergers to
            challenge. But notice what the recipe is made of:{" "}
            <em>market shares and nothing else</em>. HHI has no idea who{" "}
            <em>owns</em> the companies. Two fiercely independent rivals
            score exactly the same as two "rivals" that answer to the same
            owner. That blind spot is where our story lives. So economists
            built an extended score, <strong>MHHI</strong>, which starts
            from HHI and adds points when competitors share owners. How many
            points it should add — and whether it should add any at all —
            is the fight.
          </p>
        </div>

        <h3 className="toy-title">Now watch what HHI can't see</h3>
        <p className="toy-setup">
          Here is an imaginary route flown by <strong>Blue Air</strong> and{" "}
          <strong>Red Jet</strong>. Each carries half the passengers, and
          each is 20%-owned by its own founder. Two equal rivals means HHI
          scores this market <strong>5,000</strong> (50² + 50²), and because
          no merger ever happens here, that score is frozen no matter what
          you do. Now let an investment fund — <strong>FundCo</strong> — buy
          stock in <em>both</em> airlines, and watch the two scoreboards.
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
                  This score sees only market shares, and the shares haven't
                  changed — so it cannot move.
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
                    ? "FundCo owns nothing yet, so this score agrees with HHI exactly."
                    : delta < 800
                      ? "The score is climbing: each airline's shareholders now make money even when it loses a customer to its rival."
                      : "To this score, the market now looks closer to a monopoly — even though no merger happened, and the official score never blinked."}
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
              Every line in this picture is an ownership stake. HHI sees only
              the bottom row — two separate airlines. MHHI also sees the
              lines. The extra points it adds (the gap between the two
              scoreboards) are called <strong>MHHI delta</strong>. Remember
              that name: the rest of this site is a fight about how big that
              number really is, and whether it costs you money.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
