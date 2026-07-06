import { Term } from "./Term";

export function Hero() {
  return (
    <header className="hero">
      <div className="wrap">
        <div className="hero-kicker">An interactive inquiry · 2014–2026</div>
        <h1>Do index funds make your plane tickets more expensive?</h1>
        <p className="hero-standfirst">
          Three investment firms — Vanguard, BlackRock, and State Street — run
          the <Term t="index fund">index funds</Term> most retirement savings
          sit in. Along the way, they became large owners of{" "}
          <em>every major U.S. airline at the same time</em>. In 2018, a team
          of economists argued this quiet overlap —{" "}
          <Term t="common ownership" /> — softens competition and pushes fares
          up. Another team said: measure it properly and the effect vanishes.{" "}
          <span className="subtle">
            Eight years, four rebuttals, and one <em>Journal of Finance</em>{" "}
            fight later, nobody has won.
          </span>
        </p>

        <div className="camp-cards">
          <div className="camp-card" style={{ "--camp": "var(--ast)" } as React.CSSProperties}>
            <div className="camp-side">The claim</div>
            <h3>“Common ownership raises fares 3–7%.”</h3>
            <p>
              When the same funds own all the airlines on a route, each airline
              has less reason to fight for its rivals' passengers — the profits
              land in the same shareholders' pockets either way.
            </p>
            <cite>Azar, Schmalz &amp; Tecu — Journal of Finance, 2018</cite>
          </div>
          <div className="camp-card" style={{ "--camp": "var(--dgs)" } as React.CSSProperties}>
            <div className="camp-side">The rebuttal</div>
            <h3>“Measured properly, the effect is zero.”</h3>
            <p>
              The correlation comes from how the measurement is built, not from
              ownership. Fix the assumptions — who really controls what, how
              market share enters the math — and it disappears.
            </p>
            <cite>Dennis, Gerardi &amp; Schenone — Journal of Finance, 2022</cite>
          </div>
        </div>

        <p className="hero-verdict">
          This site doesn't pick a side. It hands you the exact levers the two
          camps fought over, on a decade of real government data — and ends
          with a prediction that reality itself will grade. You be the judge.
        </p>
      </div>
    </header>
  );
}
