import { useAppState } from "../state";

function Item({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="fine-item">
      <summary>{title}</summary>
      <div className="fine-body">{children}</div>
    </details>
  );
}

export function Methods() {
  const { bundle } = useAppState();
  const ast = bundle.regimes.find((r) => r.id === "ast")!;
  const dgs = bundle.regimes.find((r) => r.id === "dgs")!;

  return (
    <section className="section fine" id="methods">
      <div className="wrap">
        <div className="section-kicker">The fine print</div>
        <h2>Both camps at full strength, and every corner we cut</h2>
        <p className="section-lede">
          A tool that refuses to pick a side owes you two things: each camp's
          argument at its strongest, and an honest list of its own
          simplifications.
        </p>

        <Item title="The case that common ownership raises fares (AST, at full strength)">
          <p>
            Azar, Schmalz &amp; Tecu (2018, <em>J. Finance</em> 73:1513) show
            that within a route, quarters with more common-ownership
            concentration have higher fares — coefficient {ast.coefMhhiDelta}{" "}
            (SE {ast.coefMhhiDeltaSE}) on MHHI delta, implying fares 3–7%
            higher than under separate ownership. The mechanism doesn't
            require conspiracies: shareholders who own every airline gain
            nothing from fare wars, and management is paid — and re-elected —
            by those shareholders. They buttress causality with the 2009
            BlackRock–BGI merger as a shock to ownership. The "passive
            investors are passive" objection cuts the other way, they argue:
            index funds can't exit (they must hold the index), so voice is
            their only tool, and their governance teams demonstrably use it.
          </p>
        </Item>

        <Item title="The case that the effect is zero (DGS, at full strength)">
          <p>
            Dennis, Gerardi &amp; Schenone (2022, <em>J. Finance</em>{" "}
            77:2765) first <strong>replicate AST almost exactly</strong>{" "}
            (0.196 vs 0.202) — then show the correlation lives in the
            measure's construction, not in ownership. MHHI delta is built
            from market shares times ownership overlap; feed it placebo
            ownership with true market shares and the "effect" survives
            (0.212), feed it true ownership with placebo shares and it dies
            (−0.144). Their preferred estimate — {dgs.coefMhhiDelta} (SE{" "}
            {dgs.coefMhhiDeltaSE}), using an instrumental-variable technique
            built to break the feedback loop between prices and market
            shares — is statistically zero. Treat bankrupt carriers'
            shareholders as having lost control and the correlation
            attenuates to insignificance. AST published a refutation (SSRN
            4158149); DGS a surrebuttal (SSRN 4307814). The fight is open —
            which is why this site's dials exist.
          </p>
        </Item>

        <Item title="Simplifications we made on purpose (and disclose)">
          <ul>
            <li>
              <strong>Segment vs. market passengers:</strong> market shares
              come from T-100 segment counts (nonstop passengers), while
              fares are ticket-market averages. AST used DB1B ticket samples;
              DB1C is its successor. Directionally similar, not identical.
            </li>
            <li>
              <strong>Operating carriers:</strong> regionals (SkyWest, Envoy,
              Republic…) appear as themselves — T-100 can't attribute their
              passengers to the majors that sell the tickets. They carry no
              ownership rows, so they contribute zero common-ownership terms
              (the conservative treatment; the hollow dots in the web).
            </li>
            <li>
              <strong>Ownership is snapshotted,</strong> not continuous: four
              registers (2016Q4 from AST's own Table 1; 2019/2022/2025 from
              proxies and 13Gs), with boundaries snapped to events (Buffett's
              exit, Spirit's creditor takeover). Cells we could not verify in
              a primary filing are labeled approximate in data/curated/ —
              mostly State Street stakes sitting under the 5% disclosure line.
            </li>
            <li>
              <strong>Roster sizes differ across snapshots</strong> (AST's
              table lists top-10 holders; proxies only disclose &gt;5%), so
              part of any step at a snapshot boundary is composition artifact.
              The Buffett step survives this — Berkshire is a named, verified
              ~10% holder disappearing — but treat 2016→2019 level shifts
              gently.
            </li>
            <li>
              <strong>Top-~8 holders per carrier;</strong> the long tail of
              small institutions is excluded (it enters MHHI's denominator,
              so our MHHI delta runs slightly high).
            </li>
            <li>
              <strong>Scenario reallocation is proportional:</strong> when
              Spirit exits, its passengers redistribute pro-rata. Reality
              favors overlapping-route carriers.
            </li>
            <li>
              <strong>Coefficients travel in time:</strong> both camps
              estimated on 2001–2014 data; we apply them to 2014–2026.
            </li>
            <li>
              <strong>City-market aggregation:</strong> routes are BTS
              city-market pairs (NYC = JFK+LGA+EWR), the same grouping the
              fare data uses.
            </li>
          </ul>
        </Item>

        <Item title="Sources, citations, and how to re-run everything">
          <ul>
            <li>
              Fares: DOT Consumer Airfare Report Table 6, dataset{" "}
              <code>yj5y-b2ir</code> on data.transportation.gov (2014Q1–2025Q4).
            </li>
            <li>
              Market shares: BTS T-100 Domestic Segment (TranStats table 259),
              2014–2026Q1.
            </li>
            <li>
              Ownership: SEC DEF 14A &gt;5% tables and SC 13Gs via EDGAR; AST
              (2018) Table 1 for 2016Q4; per-cell source strings in{" "}
              <code>data/curated/ownership.csv</code>.
            </li>
            <li>
              Coefficients: AST (2018) Table 3 col. (6); DGS (2022) Table V
              Panel B col. (4). Framework: O'Brien &amp; Salop (2000),{" "}
              <em>Antitrust L.J.</em> 67:559. Continuations: SSRN 4158149,
              4307814.
            </li>
            <li>
              The pipeline (<code>pipeline/build_bundle.py</code>) is
              deterministic — same inputs, byte-identical bundle — and its
              coherence checks (the Buffett step, the Spirit channel split)
              fail the build rather than the reader. The math core is
              implemented twice (TypeScript for this page, Python for the
              pipeline) and locked together by golden-vector tests.
            </li>
          </ul>
        </Item>
      </div>
    </section>
  );
}
