import { Term } from "./Term";

export function Hero() {
  return (
    <header className="hero">
      <div className="wrap">
        <div className="hero-kicker">An interactive inquiry · 2014–2026</div>
        <h1>Do index funds make your plane tickets more expensive?</h1>

        <div className="hero-standfirst">
          <p>
            Competition is what keeps prices down. When ten airlines fight
            over the same passengers, you get fare sales and price wars.
            When one airline has no rivals, it charges whatever it likes —
            which is why antitrust laws exist to stop markets from ending up
            that way.
          </p>
          <p>
            Now the stranger version. Suppose the airlines stay legally
            separate — different names, different planes, different CEOs —
            but the <em>same few investors</em> own a big piece of all of
            them at once. Do those companies still have a reason to fight?
            Every dollar American wins from Delta in a price war comes out of
            shareholders' left pocket and goes into their right.
          </p>
          <p>
            This stopped being a thought experiment because of{" "}
            <Term t="index fund">index funds</Term>. An index fund doesn't
            try to pick winning stocks — it automatically buys a small slice
            of <em>every</em> big company. That turned out to be a cheap,
            sensible way to invest, and a huge share of retirement money
            (your 401(k), probably) now sits in them. Three firms — Vanguard,
            BlackRock, and State Street — manage most of it. And if your
            strategy is "buy everything," you end up owning everything:
            together, those three hold roughly 15–25% of nearly every major
            U.S. airline. Simultaneously. (And of nearly every major U.S.{" "}
            <em>anything</em> — hold that thought.)
          </p>
          <p>
            In 2018, a team of economists published a controversial claim in
            one of finance's top journals: this quiet overlap — they call it{" "}
            <Term t="common ownership" /> — really does soften competition,
            and airline fares run <strong>3–7% higher</strong> because of it.
            If that's true for airlines, it's probably true for banks,
            pharmacies, and groceries too — meaning the index funds your
            retirement rides on may be nudging up the price of almost
            everything you buy. Another team answered: measure it properly
            and the effect <strong>disappears</strong>.{" "}
            <span className="subtle">
              Eight years and a volley of rebuttals later, nobody has won.
            </span>
          </p>
        </div>

        <div className="camp-cards">
          <div className="camp-card" style={{ "--camp": "var(--ast)" } as React.CSSProperties}>
            <div className="camp-side">The claim · 2018</div>
            <h3>“Same owners, softer competition, higher fares.”</h3>
            <p>
              When one fund owns a chunk of every airline on a route, a price
              war stops making sense <em>for the owners</em>: whatever
              American wins, the same shareholders lose through their Delta
              and United stakes. No conspiracy required — the incentive
              arrives through boards, executive pay, and whose votes elect
              management. Comparing thousands of routes over fourteen years,
              they found fares 3–7% higher where this shared ownership ran
              thickest.
            </p>
            <cite>
              Azar, Schmalz &amp; Tecu — Journal of Finance, 2018. This site
              calls them “AST,” their initials.
            </cite>
          </div>
          <div className="camp-card" style={{ "--camp": "var(--dgs)" } as React.CSSProperties}>
            <div className="camp-side">The rebuttal · 2022</div>
            <h3>“Your measuring stick invented the effect.”</h3>
            <p>
              The score used to detect the problem isn't built from ownership
              alone — it's ownership <em>multiplied by market shares</em>,
              and market shares move with prices for ordinary reasons that
              have nothing to do with who owns whom. Their test: feed the
              formula <em>fake</em> ownership data but real market shares,
              and the "effect" is still there. Use <em>real</em> ownership
              but neutralize the market shares, and it vanishes. Conclusion:
              the discovery was an artifact of how it was measured, not a
              fact about the world.
            </p>
            <cite>
              Dennis, Gerardi &amp; Schenone — Journal of Finance, 2022. This
              site calls them “the critics.”
            </cite>
          </div>
        </div>

        <p className="hero-verdict">
          Both sides can't be right. This site doesn't pick a winner — it
          hands you the exact levers the two camps fought over, on a decade
          of real government data, and ends with a prediction that reality
          itself will grade. You be the judge.
        </p>
      </div>
    </header>
  );
}
