import { useSelectedRoute } from "./RoutePicker";
import { routeLabel } from "../lib/bundle";
import { useAppState } from "../state";

function lastNonNull(values: (number | null)[]): { v: number; i: number } | null {
  for (let i = values.length - 1; i >= 0; i--) {
    const v = values[i];
    if (v !== null && v !== undefined) return { v, i };
  }
  return null;
}

function useTranslation() {
  const { assumption, regimeId, activeCoef } = useAppState();
  const route = useSelectedRoute();
  const s = route.series;
  const mhhiSeries = assumption === "proportional" ? s.mhhiDeltaAst : s.mhhiDeltaPassive;
  const fare = lastNonNull(s.fare);
  const mhhi = lastNonNull(mhhiSeries);
  if (!fare || !mhhi) return null;
  // Counterfactual under the active coefficient: today's fare vs. the same
  // fare with the common-ownership term switched off.
  const without = fare.v * Math.exp(-activeCoef * (mhhi.v / 10000));
  return {
    premium: fare.v - without,
    fare: fare.v,
    quarter: s.quarters[fare.i]!,
    route: routeLabel(route),
    regimeName:
      regimeId === "ast" ? "AST's estimate" : regimeId === "dgs" ? "the critics' estimate" : "your custom estimate",
    passive: assumption === "passive-index",
  };
}

function AssumptionToggle() {
  const { assumption, setAssumption } = useAppState();
  return (
    <div className="seg">
      <button
        className={`seg-btn ast${assumption === "proportional" ? " on" : ""}`}
        onClick={() => setAssumption("proportional")}
      >
        count every big owner
      </button>
      <button
        className={`seg-btn dgs${assumption === "passive-index" ? " on" : ""}`}
        onClick={() => setAssumption("passive-index")}
      >
        don't count the Big Three
      </button>
    </div>
  );
}

function RegimeToggle() {
  const { regimeId, setRegimeId, customCoef, setCustomCoef, bundle } = useAppState();
  const ast = bundle.regimes.find((r) => r.id === "ast")!;
  const dgs = bundle.regimes.find((r) => r.id === "dgs")!;
  return (
    <>
      <div className="seg">
        <button
          className={`seg-btn ast${regimeId === "ast" ? " on" : ""}`}
          onClick={() => setRegimeId("ast")}
          title={ast.citation}
        >
          AST: fares rise
        </button>
        <button
          className={`seg-btn dgs${regimeId === "dgs" ? " on" : ""}`}
          onClick={() => setRegimeId("dgs")}
          title={dgs.citation}
        >
          critics: ≈ zero
        </button>
        <button
          className={`seg-btn${regimeId === "custom" ? " on" : ""}`}
          onClick={() => setRegimeId("custom")}
        >
          you decide
        </button>
      </div>
      {regimeId === "custom" && (
        <label className="custom-coef">
          <input
            type="range"
            min="0"
            max="0.35"
            step="0.001"
            value={customCoef}
            onChange={(e) => setCustomCoef(Number(e.target.value))}
          />
          <span>
            {customCoef.toFixed(3)}{" "}
            <span className="coef-anchor">
              (critics {dgs.coefMhhiDelta} · AST {ast.coefMhhiDelta})
            </span>
          </span>
        </label>
      )}
    </>
  );
}

/** The full, explained introduction of the dials — lives inside Explore,
 * before any chart. The sticky bar appears only after this scrolls away. */
export function DialsIntro() {
  const t = useTranslation();
  return (
    <div className="dials-intro" id="dials-intro">
      <div className="dials-intro-header">
        The two disputed dials
        <span>
          {" "}
          — these two settings are the economists' entire fight. Every chart
          and dollar figure below recalculates when you change them.
        </span>
      </div>
      <div className="dial-cards" id="dial-cards">
        <div className="dial-card">
          <div className="dial-num">Dial 1 · how the score is measured</div>
          <h3>Whose stock counts as influence?</h3>
          <p>
            <strong>What this dial changes:</strong> it changes how the
            purple MHHI-delta line — the "extra points for shared owners"
            score from ① — gets calculated on real routes. Specifically, it
            decides <em>which investors' stakes are allowed to add
            points</em>.
          </p>
          <p>
            <strong style={{ color: "var(--ast)" }}>AST's setting counts
            every big shareholder</strong>, on the logic that a big stake
            always buys influence. <strong style={{ color: "var(--dgs)" }}>
            The critics' setting doesn't count the Big Three</strong>{" "}
            (Vanguard, BlackRock, and State Street), on the logic that they
            merely hold stock for millions of savers and never tell airlines
            how to compete.
          </p>
          <AssumptionToggle />
          <p className="dial-effect">
            When you flip this, a decade of purple line, the ownership webs,
            and every prediction on the page are recomputed under the other
            side's rule.
          </p>
        </div>
        <div className="dial-card">
          <div className="dial-num">Dial 2 · what the score costs you</div>
          <h3>How strongly do points become dollars?</h3>
          <p>
            <strong>What this dial changes:</strong> it sets the exchange
            rate between score points and ticket prices. It doesn't touch
            the purple line itself — it decides how much each point of MHHI
            delta actually raises your fare.
          </p>
          <p>
            Both camps measured this exchange rate on the same government
            data and got different answers.{" "}
            <strong style={{ color: "var(--ast)" }}>AST's measurement says
            the effect is real</strong> — big enough to make fares 3–7%
            higher on a typical route.{" "}
            <strong style={{ color: "var(--dgs)" }}>The critics'
            measurement says the effect is zero</strong> once the math is
            done their way. You can also drag your own value anywhere in
            between.
          </p>
          <RegimeToggle />
          <p className="dial-effect">
            When you flip this, the dashed "fare without the shared-owner
            effect" line on the chart below and every dollar figure in ③
            and ④ are recomputed.
          </p>
        </div>
      </div>
      {t && (
        <p className="translation">
          With today's settings: common ownership is baked into about{" "}
          <strong>${t.premium.toFixed(0)}</strong> of the average{" "}
          <strong>${t.fare.toFixed(0)}</strong> ticket on {t.route} ({t.quarter},
          under {t.regimeName}
          {t.passive ? ", Big Three passive" : ""}). Flip the dials and watch
          this number.
        </p>
      )}
    </div>
  );
}

/** Condensed sticky bar — appears only after DialsIntro scrolls out. */
export function StickyDials({ visible }: { visible: boolean }) {
  const t = useTranslation();
  if (!visible) return null;
  return (
    <div className="controlbar">
      <div className="wrap controlbar-inner">
        <div className="dial">
          <div className="dial-label">Dial 1 · whose holdings count?</div>
          <AssumptionToggle />
        </div>
        <div className="dial">
          <div className="dial-label">Dial 2 · effect on fares</div>
          <RegimeToggle />
        </div>
        {t && (
          <p className="translation compact">
            ≈ <strong>${t.premium.toFixed(0)}</strong> of the{" "}
            <strong>${t.fare.toFixed(0)}</strong> avg. ticket on {t.route} is
            common ownership, with these settings.
          </p>
        )}
      </div>
    </div>
  );
}
