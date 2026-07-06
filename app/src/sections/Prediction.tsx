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
          Scientists would never be allowed to shut down an airline just to
          see what happens to prices — but reality just ran that experiment
          for us. There's a trap, though: fuel prices spiked at the same
          time, raising fares on <em>every</em> route, so simply comparing
          before and after would mix the two stories together. The fix is a{" "}
          <Term t="difference-in-differences" />: compare the routes Spirit
          left against near-identical routes it never flew. The fuel spike
          hits both groups equally — subtract one from the other and it
          cancels out, leaving only Spirit's fingerprint.
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
                      +{p.concentrationChannelPct.toFixed(1)}% fewer rivals ·{" "}
                      <span style={{ color: r === "ast" ? "var(--ast)" : "var(--dgs)" }}>
                        +{p.commonOwnershipChannelPct.toFixed(1)}% shared owners
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
          <strong>What a result can settle — honestly:</strong> if fares land
          near +3.2%, the critics' way of measuring looks right; near +4.5%,
          AST's does. What one number <em>can't</em> do is tell the two
          causes apart — "fewer rivals" and "shared owners" both push fares
          the same direction here, so this experiment referees between the
          two camps' full playbooks rather than isolating the mechanism.
          (Why do shared owners <em>add</em> to the rise? Because
          creditor-owned Spirit sat outside the ownership web — when it
          vanished, passengers flowed toward the commonly-owned airlines.
          That's the surprise from step ③.) And if the result lands far
          outside the whole +3-to-+5 range, both camps' shared playbook is
          missing something big.
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
          How you know we're not cheating: these predictions were locked into
          this site's public code history on {prereg.frozen} — before any
          post-shutdown fare data existed — in commit{" "}
          <code>{prereg.commit.slice(0, 12)}</code> (a commit is a
          tamper-evident snapshot; think of it as a notarized timestamp
          anyone can inspect at <code>{prereg.path}</code>). When the real
          numbers arrive, we can't quietly rewrite what we predicted.
        </p>
      </div>
    </section>
  );
}
