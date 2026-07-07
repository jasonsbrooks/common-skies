import { Term } from "../components/Term";
import { shortCity } from "../lib/bundle";
import { useAppState } from "../state";
import prereg from "../prereg-commit.json";

const TIMELINE = [
  { date: "Apr 2026", label: "Jet-fuel spike", note: "raises fares everywhere — the confound" },
  { date: "May 2, 2026", label: "Spirit stops flying", note: "the experiment begins" },
  { date: "May 15, 2026", label: "Buffett's return revealed", note: "a filing shows Berkshire bought 6.1% of Delta in Q1 — before the shutdown" },
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
          No scientist would ever be allowed to shut down an airline just to
          see what happens to ticket prices — but on May 2, 2026, reality
          did it for us. There's a trap in reading the result, though: jet
          fuel got expensive at the same time, which pushed fares up on{" "}
          <em>every</em> route in America. A simple before-and-after would
          mix the two stories together. So instead, we watch{" "}
          <strong>two groups of routes</strong>: the routes where Spirit was
          big, and a matching set of look-alike routes Spirit never flew.
          The fuel spike hits both groups. Losing Spirit only hits the
          first. So whatever <em>gap</em> opens up between the two groups
          this year is Spirit's doing — economists call this trick a{" "}
          <Term t="difference-in-differences" />.
        </p>

        <div className="did-design">
          <div className="did-fact">
            <strong>Group 1 · lost Spirit ({pairs.length} routes)</strong> —
            routes where Spirit carried at least 15% of passengers in its
            final full quarter. For example{" "}
            {pairs
              .slice(0, 3)
              .map((p) => p.treatmentCities.map(shortCity).join("–"))
              .join(", ")}
            …
          </div>
          <div className="did-fact">
            <strong>Group 2 · the comparison ({pairs.length} routes)</strong>{" "}
            — for each Group 1 route, a look-alike (similar distance,
            similar traffic) that Spirit hadn't touched in a year. For
            example{" "}
            {pairs
              .slice(0, 3)
              .map((p) => p.controlCities.map(shortCity).join("–"))
              .join(", ")}
            …
          </div>
          <div className="did-fact">
            <strong>The bet on record</strong> — how much more Group 1's
            fares rise than Group 2's, comparing the summer after the
            shutdown (Q3 2026) against the start of the year (Q1 2026).
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
          <strong>What a result can settle — honestly:</strong> if the gap
          lands near +3.2%, the critics' way of measuring looks right. If it
          lands near +4.5%, AST's does. But one number can't tell the two
          causes apart, because "one fewer competitor" and "more shared
          ownership" both push fares up here. So treat this as a referee
          choosing between the two camps' complete methods — not a final
          verdict on <em>why</em> fares moved. (Why does shared ownership
          add to the rise at all? Because Spirit's owners were its former
          lenders, outside the web — so when Spirit vanished, its
          passengers landed on airlines that <em>do</em> share owners.
          That's the surprise from step ③.) And if the gap lands far
          outside the +3-to-+5 range entirely, it means both camps are
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
          How you know we're not cheating: these predictions were published
          with a tamper-proof timestamp on {prereg.frozen}, before any
          post-shutdown fare data existed. So when the real numbers arrive,
          we can't quietly rewrite what we predicted — the original is
          frozen in public, like a letter mailed to ourselves through a
          notary.{" "}
          <span className="prereg-tech">
            (For the technically minded: the frozen record is{" "}
            <a
              href={`https://github.com/jasonsbrooks/common-skies/blob/${prereg.commit}/${prereg.path}`}
              target="_blank"
              rel="noreferrer"
            >
              here
            </a>
            .)
          </span>
        </p>
      </div>
    </section>
  );
}
