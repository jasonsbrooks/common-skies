import { Term } from "../components/Term";
import { shortCity } from "../lib/bundle";
import { useAppState } from "../state";
import prereg from "../prereg-commit.json";

const TIMELINE = [
  { date: "Apr 2026", label: "Jet-fuel spike", note: "raises fares everywhere — the confound" },
  { date: "May 2, 2026", label: "Spirit stops flying", note: "the experiment begins" },
  { date: "May 15, 2026", label: "Buffett returns", note: "Berkshire takes 6.1% of Delta" },
  { date: "~Oct 2026", label: "First post-shutdown data", note: "DB1C monthly, ~4-month lag" },
  { date: "~Q1 2027", label: "The verdict", note: "full Q3 2026 fares publish; this page gets graded" },
];

export function Prediction() {
  const { bundle, assumption, regimeId, activeCoef, activeCoefHhi } = useAppState();
  const preds = bundle.did.predictions;
  const cellFor = (a: string, r: string) =>
    preds.find((p) => p.assumption === a && p.regime === r)!;

  const isCustom = regimeId === "custom";
  const customPred = (() => {
    const base = cellFor(assumption, "ast");
    const dHhi = base.meanDHhiPoints / 10000;
    const dMhhi = base.meanDMhhiPoints / 10000;
    return (Math.exp(activeCoefHhi * dHhi + activeCoef * dMhhi) - 1) * 100;
  })();

  const pairs = bundle.did.pairs;

  return (
    <section className="section" id="prediction">
      <div className="wrap">
        <div className="section-kicker">④ The prediction</div>
        <h2>Reality grades this page in early 2027</h2>
        <p className="section-lede">
          Spirit's shutdown is a natural experiment — but a naive before/after
          would be poisoned by the 2026 fuel spike, which raised fares on{" "}
          <em>every</em> route. So the registered test is a{" "}
          <Term t="difference-in-differences" />: compare the routes Spirit
          left against near-identical routes it never flew. The fuel spike
          hits both groups; subtracting one from the other cancels it.
        </p>

        <div className="did-design">
          <div className="did-fact">
            <strong>{pairs.length} treatment routes</strong> — Spirit carried
            ≥15% of passengers in 2026Q1, its last full quarter. E.g.{" "}
            {pairs
              .slice(0, 3)
              .map((p) => p.treatmentCities.map(shortCity).join("–"))
              .join(", ")}
            …
          </div>
          <div className="did-fact">
            <strong>{pairs.length} matched controls</strong> — same distance
            bucket, closest traffic, zero Spirit for the trailing year. E.g.{" "}
            {pairs
              .slice(0, 3)
              .map((p) => p.controlCities.map(shortCity).join("–"))
              .join(", ")}
            …
          </div>
          <div className="did-fact">
            <strong>The registered number</strong> — how much more
            treatment-route fares rise than control-route fares, Q3 2026 vs
            the Q1 2026 baseline.
          </div>
        </div>

        <h3 className="pred-grid-title">
          The four registered predictions — one per dial combination
        </h3>
        <div className="pred-grid">
          <div className="pred-corner" />
          <div className="pred-col" style={{ color: "var(--ast)" }}>
            AST's coefficient
          </div>
          <div className="pred-col" style={{ color: "var(--dgs)" }}>
            critics' coefficient
          </div>
          {(["proportional", "passive-index"] as const).map((a) => (
            <>
              <div key={`${a}-row`} className="pred-row">
                {a === "proportional" ? "every big owner counts" : "Big Three passive"}
              </div>
              {(["ast", "dgs"] as const).map((r) => {
                const p = cellFor(a, r);
                const active = !isCustom && assumption === a && regimeId === r;
                return (
                  <div key={`${a}-${r}`} className={`pred-cell${active ? " active" : ""}`}>
                    <div className="pred-total">
                      {p.predictedSpreadPct >= 0 ? "+" : ""}
                      {p.predictedSpreadPct.toFixed(1)}%
                    </div>
                    <div className="pred-split">
                      {p.concentrationChannelPct.toFixed(1)}% concentration ·{" "}
                      <span style={{ color: r === "ast" ? "var(--ast)" : "var(--dgs)" }}>
                        {p.commonOwnershipChannelPct.toFixed(1)}% disputed
                      </span>
                    </div>
                    {active && <div className="pred-yours">your settings</div>}
                  </div>
                );
              })}
            </>
          ))}
        </div>
        {isCustom && (
          <p className="pred-custom">
            Your custom coefficient predicts{" "}
            <strong>
              {customPred >= 0 ? "+" : ""}
              {customPred.toFixed(1)}%
            </strong>{" "}
            under the current Dial-1 assumption.
          </p>
        )}

        <p className="pred-referee">
          <strong>What a result can settle — honestly:</strong> a spread near
          +3.2% vindicates the critics' package of assumptions; near +4.5%,
          AST's. The two channels can't be separately observed in one number —
          this experiment is a referee between packages, not a judge of the
          mechanism. (And note the disputed channel <em>adds</em> to the
          spread here: creditor-owned Spirit sat outside the ownership web, so
          its passengers flow toward commonly-held carriers — the sign flip
          from step ③.) A result far outside the whole range would indict
          both camps' shared framework.
        </p>

        <div className="timeline">
          {TIMELINE.map((t) => (
            <div key={t.label} className="timeline-item">
              <div className="timeline-date">{t.date}</div>
              <div className="timeline-label">{t.label}</div>
              <div className="timeline-note">{t.note}</div>
            </div>
          ))}
        </div>

        <p className="prereg-chip">
          Pre-registered, verifiably: the predictions above were frozen in
          commit <code>{prereg.commit.slice(0, 12)}</code> on {prereg.frozen} —{" "}
          <code>{prereg.path}</code> in this site's repository, committed
          before any post-shutdown fare data existed. Whichever dial setting
          reality vindicates, this page said so first.
        </p>
      </div>
    </section>
  );
}
