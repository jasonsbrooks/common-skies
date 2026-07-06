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

/** The always-visible consequence of the regime dial: what the current
 * settings say common ownership adds to today's fare on this route. */
function TranslationSentence() {
  const { assumption, regimeId, activeCoef, bundle } = useAppState();
  const route = useSelectedRoute();
  const s = route.series;
  const mhhiSeries = assumption === "proportional" ? s.mhhiDeltaAst : s.mhhiDeltaPassive;
  const fare = lastNonNull(s.fare);
  const mhhi = lastNonNull(mhhiSeries);
  if (!fare || !mhhi) return null;

  // Counterfactual: log(fare) - coef * MHHIΔ  →  fare without the
  // common-ownership term, under the selected coefficient.
  const without = fare.v * Math.exp(-activeCoef * (mhhi.v / 10000));
  const premium = fare.v - without;
  const regimeName =
    regimeId === "ast" ? "AST's estimate" : regimeId === "dgs" ? "the critics' estimate" : "your custom estimate";

  return (
    <p className="translation">
      With these settings, common ownership is baked into about{" "}
      <strong>${premium.toFixed(0)}</strong> of the average{" "}
      <strong>${fare.v.toFixed(0)}</strong> ticket on {routeLabel(route)} (
      {s.quarters[fare.i]}, under {regimeName}
      {assumption === "passive-index" ? ", with the Big Three counted as passive" : ""}
      ). Flip the dials and watch this number.
    </p>
  );
}

export function ControlBar() {
  const {
    assumption,
    setAssumption,
    regimeId,
    setRegimeId,
    customCoef,
    setCustomCoef,
    bundle,
  } = useAppState();
  const ast = bundle.regimes.find((r) => r.id === "ast")!;
  const dgs = bundle.regimes.find((r) => r.id === "dgs")!;

  return (
    <div className="controlbar">
      <div className="wrap controlbar-inner">
        <div className="dial">
          <div className="dial-label">
            Dial 1 · Who really exerts control?
          </div>
          <div className="seg">
            <button
              className={`seg-btn ast${assumption === "proportional" ? " on" : ""}`}
              onClick={() => setAssumption("proportional")}
              title="AST's construction: every reported shareholder influences management in proportion to their stake."
            >
              every big owner
            </button>
            <button
              className={`seg-btn dgs${assumption === "passive-index" ? " on" : ""}`}
              onClick={() => setAssumption("passive-index")}
              title="The critics' sharpest attack: Vanguard, BlackRock and State Street just hold — they don't steer. Their cross-holdings stop counting."
            >
              not the Big Three
            </button>
          </div>
        </div>

        <div className="dial">
          <div className="dial-label">
            Dial 2 · How strongly does it move fares?
          </div>
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
              title="Pick your own coefficient — the arithmetic is linear, so the tool doesn't care who you side with."
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
        </div>

        <TranslationSentence />
      </div>
    </div>
  );
}
