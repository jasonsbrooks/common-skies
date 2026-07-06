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
        <span> — the economists' fight, reduced to settings. Everything below obeys them.</span>
      </div>
      <div className="dial-cards">
        <div className="dial-card">
          <div className="dial-num">Dial 1 · the measurement</div>
          <h3>Whose stock-holdings count as influence?</h3>
          <p>
            The purple line below measures <em>hidden</em> concentration — it
            only exists if owning a rival's stock makes an airline compete
            less hard. But whose holdings count?{" "}
            <strong style={{ color: "var(--ast)" }}>AST counted every big
            shareholder</strong>, influence in proportion to stake.{" "}
            <strong style={{ color: "var(--dgs)" }}>The critics object</strong>:
            Vanguard, BlackRock &amp; State Street are <em>passive</em> — they
            hold, they don't steer — so their stakes shouldn't count at all.
          </p>
          <AssumptionToggle />
          <p className="dial-effect">
            Flipping this recomputes a decade of history: the purple line, the
            ownership web, and every prediction.
          </p>
        </div>
        <div className="dial-card">
          <div className="dial-num">Dial 2 · the damage</div>
          <h3>How hard does hidden concentration hit fares?</h3>
          <p>
            Both camps measured what one point of hidden concentration does to
            ticket prices — and published different answers.{" "}
            <strong style={{ color: "var(--ast)" }}>AST: fares rise
            noticeably</strong> (3–7% on the average route).{" "}
            <strong style={{ color: "var(--dgs)" }}>The critics: no
            measurable effect</strong> — statistically zero. Or drag your own
            multiplier between them.
          </p>
          <RegimeToggle />
          <p className="dial-effect">
            This sets the multiplier behind the dollar figure below and the
            fare predictions in steps ③ and ④.
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
