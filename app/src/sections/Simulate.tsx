import { useMemo, useState } from "react";
import { OwnershipWeb } from "../components/OwnershipWeb";
import { Receipt } from "../components/Receipt";
import { useSelectedRoute } from "../components/RoutePicker";
import { Term } from "../components/Term";
import { routeLabel, snapshotForQuarter, type OwnershipRow } from "../lib/bundle";
import {
  BIG_THREE,
  divestOwners,
  farePrediction,
  hhi,
  mhhiDelta,
  removeCarrier,
  type OwnershipStake,
} from "../lib/market-math";
import { useAppState } from "../state";

type ScenarioId = "spirit" | "divest";

function lastNonNull(values: (number | null)[]): { v: number; i: number } | null {
  for (let i = values.length - 1; i >= 0; i--) {
    const v = values[i];
    if (v !== null && v !== undefined) return { v, i };
  }
  return null;
}

/** Stakes for a snapshot as math-core inputs (pct → beta). */
function stakesFor(
  snapshots: Record<string, OwnershipRow[]>,
  key: string,
): OwnershipStake[] {
  return (snapshots[key] ?? []).map((r) => ({
    owner: r.owner,
    carrier: r.carrier,
    beta: r.pct / 100,
  }));
}

const settingsLabel = (assumption: string, regimeId: string, coef: number) =>
  `${assumption === "proportional" ? "every big owner counts" : "Big Three passive"} · ${
    regimeId === "ast" ? "AST estimate" : regimeId === "dgs" ? "critics' estimate" : `custom (${coef.toFixed(3)})`
  }`;

function RegulatorFootnote({ before, after }: { before: number; after: number }) {
  const d = Math.round((after - before) * 10000);
  return (
    <>
      What regulators would see: <Term t="HHI" /> {d >= 0 ? "rises" : "falls"}{" "}
      {Math.abs(d).toLocaleString()} points ({Math.round(before * 10000).toLocaleString()} →{" "}
      {Math.round(after * 10000).toLocaleString()}).{" "}
      <Term t="MHHI delta" /> is not in their rulebook — that's the fight.
    </>
  );
}

function SpiritScenario() {
  const { bundle, assumption, regimeId, activeCoef, activeCoefHhi, customCoef } = useAppState();
  const spiritRoutes = useMemo(
    () =>
      bundle.routes
        .filter((r) => (r.latestShares?.NK ?? 0) >= 0.05)
        .sort((a, b) => (b.latestShares!.NK ?? 0) - (a.latestShares!.NK ?? 0)),
    [bundle.routes],
  );
  const [routeId, setRouteId] = useState(
    spiritRoutes.find((r) => r.id === "30977-32467")?.id ?? spiritRoutes[0]!.id,
  );
  const route = spiritRoutes.find((r) => r.id === routeId) ?? spiritRoutes[0]!;
  const treatmentIds = useMemo(
    () => new Set(bundle.did.pairs.map((p) => p.treatment)),
    [bundle.did.pairs],
  );

  const shares = route.latestShares!;
  const fare = lastNonNull(route.series.fare)!;
  const stakes2025 = stakesFor(bundle.ownershipSnapshots, "2025Q3");

  const after = removeCarrier(shares, "NK");
  const hhiBefore = hhi(shares);
  const hhiAfter = hhi(after);
  const mhhiBefore = mhhiDelta(shares, stakes2025, assumption);
  const mhhiAfter = mhhiDelta(after, stakes2025, assumption);
  const prediction = farePrediction(
    { hhi: hhiBefore, mhhiDelta: mhhiBefore },
    { hhi: hhiAfter, mhhiDelta: mhhiAfter },
    { coefHhi: activeCoefHhi, coefMhhiDelta: activeCoef },
  );

  // The wrinkle: rerun with Spirit owned like an ordinary index-era airline
  // (its 2022 register) instead of its actual creditor owners.
  const wrinkle = useMemo(() => {
    const nk2022 = stakesFor(bundle.ownershipSnapshots, "2022Q1").filter(
      (s) => s.carrier === "NK",
    );
    const hypothetical = [...stakes2025.filter((s) => s.carrier !== "NK"), ...nk2022];
    const dActual = (mhhiAfter - mhhiBefore) * 10000;
    const dHypo =
      (mhhiDelta(after, hypothetical, assumption) -
        mhhiDelta(shares, hypothetical, assumption)) *
      10000;
    return { dActual: Math.round(dActual), dHypo: Math.round(dHypo) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId, assumption, bundle]);

  const disputedColor =
    regimeId === "dgs" ? "var(--dgs)" : regimeId === "ast" ? "var(--ast)" : "var(--ink)";
  const webCarriers = Object.keys(shares)
    .sort((a, b) => shares[b]! - shares[a]!)
    .slice(0, 5);

  // Dollar decomposition for the takeaway (same arithmetic as the receipt).
  const concD = fare.v * (Math.exp(prediction.concentrationChannel) - 1);
  const coD =
    fare.v * Math.exp(prediction.concentrationChannel) * (Math.exp(prediction.commonOwnershipChannel) - 1);
  const totalPct = (Math.exp(prediction.totalLogChange) - 1) * 100;

  return (
    <div>
      <p className="scenario-note">
        Pick one of the routes where Spirit actually flew, and we'll remove
        it from the market and recompute everything:
      </p>
      <div className="chips scenario-chips">
        {spiritRoutes.slice(0, 6).map((r) => (
          <button
            key={r.id}
            className={`chip${r.id === routeId ? " active" : ""}`}
            onClick={() => setRouteId(r.id)}
          >
            {routeLabel(r)}
            <span className="chip-note">
              Spirit flew {((r.latestShares!.NK ?? 0) * 100).toFixed(0)}% of it
              {treatmentIds.has(r.id) ? " · part of the experiment in ④" : ""}
            </span>
          </button>
        ))}
      </div>

      <div className="scenario-grid">
        <Receipt
          routeLabel={routeLabel(route)}
          baseFare={fare.v}
          baseQuarter={route.series.quarters[fare.i]!}
          concentrationChannel={prediction.concentrationChannel}
          commonOwnershipChannel={prediction.commonOwnershipChannel}
          settingsLabel={settingsLabel(assumption, regimeId, customCoef)}
          disputedColor={disputedColor}
          footnote={<RegulatorFootnote before={hhiBefore} after={hhiAfter} />}
        />
        <div className="webs-pair">
          <div>
            <div className="web-title">Before — with Spirit</div>
            <OwnershipWeb
              stakes={bundle.ownershipSnapshots["2025Q3"] ?? []}
              carriers={webCarriers}
              carrierNames={bundle.carrierNames}
              assumption={assumption}
              weights={shares}
              maxOwners={5}
              height={160}
            />
          </div>
          <div>
            <div className="web-title">After — Spirit gone, shares redistributed</div>
            <OwnershipWeb
              stakes={bundle.ownershipSnapshots["2025Q3"] ?? []}
              carriers={webCarriers.filter((c) => c !== "NK")}
              carrierNames={bundle.carrierNames}
              assumption={assumption}
              weights={after}
              maxOwners={5}
              height={160}
            />
          </div>
        </div>
      </div>

      <div className="takeaway">
        <span className="takeaway-k">What you should take away</span>
        Under your current dial settings, losing Spirit makes the average
        ticket on this route about{" "}
        <strong>${(concD + coD).toFixed(0)} more expensive</strong> (
        {totalPct >= 0 ? "+" : ""}
        {totalPct.toFixed(1)}%).{" "}
        {concD >= Math.abs(coD) ? (
          <>
            The bigger part — ${concD.toFixed(0)} — comes from simply having
            one fewer competitor, which <em>both</em> camps agree matters.
            The shared-ownership effect adds ${Math.abs(coD).toFixed(0)}
            {coD >= 0 ? "" : " of savings"} on top, and that smaller slice is
            what the camps fight over.
          </>
        ) : (
          <>
            Surprisingly, the bigger part — ${Math.abs(coD).toFixed(0)} —
            flows through <em>shared ownership</em>: Spirit's passengers
            scatter onto airlines that do share big owners, so the disputed
            score jumps. Having one fewer competitor adds the other $
            {concD.toFixed(0)}, which <em>both</em> camps agree matters.
          </>
        )}{" "}
        Try flipping Dial 2: the disputed line stretches or collapses, while
        the competitor line barely moves. One route can't settle the fight —
        which is why step ④ pools 52 routes at once.
      </div>

      <div className="wrinkle">
        <strong>The wrinkle that makes this honest:</strong> by the time it
        shut down, Spirit didn't belong to the index funds anymore —
        bankruptcy had handed it to its lenders (investment firms like
        Citadel and PIMCO). That changes the math. If Spirit had still been owned the
        ordinary way — its <em>2022</em> register: Vanguard 9%, BlackRock
        7.5% — its exit would have <em>removed</em> wires from the web and
        moved the shared-ownership score (MHHI delta) by{" "}
        {wrinkle.dHypo >= 0 ? "+" : ""}
        {wrinkle.dHypo.toLocaleString()} points on this route. With its{" "}
        <em>actual</em> owners, Spirit was outside the web — so when it
        vanished, its passengers flowed <em>toward</em> the commonly-owned
        airlines, and the score moves {wrinkle.dActual >= 0 ? "+" : ""}
        {wrinkle.dActual.toLocaleString()} instead. Same event, opposite
        directions, depending on a fact about bankruptcy paperwork. That's
        why step ④ predicts the two effects separately instead of just
        eyeballing fares.
      </div>
    </div>
  );
}

function DivestScenario() {
  const { bundle, assumption, regimeId, activeCoef, activeCoefHhi, customCoef } = useAppState();
  const route = useSelectedRoute();
  const { shares, fare } = {
    shares: route.latestShares ?? (route.series.shares.filter(Boolean).at(-1) as Record<string, number>),
    fare: lastNonNull(route.series.fare)!,
  };
  const stakes = stakesFor(
    bundle.ownershipSnapshots,
    snapshotForQuarter(bundle, route.latestSharesQuarter),
  );
  const divested = divestOwners(stakes, BIG_THREE);
  const h = hhi(shares); // unchanged by construction
  const mhhiBefore = mhhiDelta(shares, stakes, assumption);
  const mhhiAfter = mhhiDelta(shares, divested, assumption);
  const prediction = farePrediction(
    { hhi: h, mhhiDelta: mhhiBefore },
    { hhi: h, mhhiDelta: mhhiAfter },
    { coefHhi: activeCoefHhi, coefMhhiDelta: activeCoef },
  );
  const disputedColor =
    regimeId === "dgs" ? "var(--dgs)" : regimeId === "ast" ? "var(--ast)" : "var(--ink)";
  const nothingToDo = assumption === "passive-index";
  const webCarriers = Object.keys(shares)
    .sort((a, b) => shares[b]! - shares[a]!)
    .slice(0, 5);

  return (
    <div>
      <p className="scenario-note">
        Uses the route you picked in ② ({routeLabel(route)}). No airline
        enters or leaves — the only thing that changes is <em>who owns
        stock</em>. So the concentration charge is automatically $0.00, and
        the entire prediction rides on the disputed line. This is the
        cleanest possible test of the theory itself.
      </p>
      {nothingToDo && (
        <p className="scenario-callout">
          Your dials already answer this one: with Dial 1 on{" "}
          <strong>"don't count the Big Three,"</strong> their divestiture
          changes nothing — you've assumed their stakes never mattered. The
          two dials interact; that's the point of having both.
        </p>
      )}
      <div className="scenario-grid">
        <Receipt
          routeLabel={routeLabel(route)}
          baseFare={fare.v}
          baseQuarter={route.series.quarters[fare.i]!}
          concentrationChannel={prediction.concentrationChannel}
          commonOwnershipChannel={prediction.commonOwnershipChannel}
          settingsLabel={settingsLabel(assumption, regimeId, customCoef)}
          disputedColor={disputedColor}
          footnote={
            <>
              What regulators would see: nothing. <Term t="HHI" /> doesn't move
              when only stock ownership changes — no merger review would ever
              open. MHHI delta falls{" "}
              {Math.round((mhhiBefore - mhhiAfter) * 10000).toLocaleString()}{" "}
              points.
            </>
          }
        />
        <div className="webs-pair">
          <div>
            <div className="web-title">Before — as owned today</div>
            <OwnershipWeb
              stakes={bundle.ownershipSnapshots[snapshotForQuarter(bundle, route.latestSharesQuarter)] ?? []}
              carriers={webCarriers}
              carrierNames={bundle.carrierNames}
              assumption={assumption}
              weights={shares}
              maxOwners={5}
              height={160}
            />
          </div>
          <div>
            <div className="web-title">After — Big Three fully divested</div>
            <OwnershipWeb
              stakes={(bundle.ownershipSnapshots[snapshotForQuarter(bundle, route.latestSharesQuarter)] ?? []).filter(
                (r) => !(BIG_THREE as readonly string[]).includes(r.owner),
              )}
              carriers={webCarriers}
              carrierNames={bundle.carrierNames}
              assumption={assumption}
              weights={shares}
              maxOwners={5}
              height={160}
            />
          </div>
        </div>
      </div>

      <div className="takeaway">
        <span className="takeaway-k">What you should take away</span>
        {nothingToDo ? (
          <>
            Your Dial 1 setting already answers this scenario. If the Big
            Three's stakes never influenced anyone — which is what "don't
            count the Big Three" assumes — then making them sell changes
            nothing, by definition. Flip Dial 1 back to "count every big
            owner" to see what the other worldview predicts.
          </>
        ) : (
          <>
            This is the entire policy debate expressed as one number. If
            AST's numbers are right, forcing the Big Three to sell their
            airline stock would make the average ticket on this route about{" "}
            <strong>
              ${Math.abs(fare.v * (Math.exp(prediction.commonOwnershipChannel) - 1)).toFixed(0)}{" "}
              cheaper
            </strong>{" "}
            ({((Math.exp(prediction.totalLogChange) - 1) * 100).toFixed(1)}%).
            If the critics are right, it would change almost nothing. Serious
            policy proposals — such as capping how much of competing
            companies the big funds may own — rest on the first answer, and
            the case against them rests on the second.
          </>
        )}
      </div>
    </div>
  );
}

export function Simulate() {
  const [scenario, setScenario] = useState<ScenarioId>("spirit");
  return (
    <section className="section" id="simulate">
      <div className="wrap">
        <div className="section-kicker">③ Run the experiment</div>
        <h2>On May 2, 2026, Spirit Airlines stopped flying</h2>
        <p className="section-lede">
          A major low-cost airline left hundreds of routes at once, which is
          the kind of shock economists usually wait decades for. What should
          happen to fares? The answer depends on your dial settings — so run
          the scenarios yourself, live, using the same math the studies
          used.
        </p>
        <div className="scenario-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={scenario === "spirit"}
            className={`scenario-tab${scenario === "spirit" ? " active" : ""}`}
            onClick={() => setScenario("spirit")}
          >
            <span className="tab-title">Scenario 1 · The Spirit shutdown</span>
            <span className="tab-note">This one actually happened, on May 2, 2026.</span>
          </button>
          <button
            role="tab"
            aria-selected={scenario === "divest"}
            className={`scenario-tab${scenario === "divest" ? " active" : ""}`}
            onClick={() => setScenario("divest")}
          >
            <span className="tab-title">Scenario 2 · The Big Three sell everything</span>
            <span className="tab-note">This is the thought experiment the fight is really about.</span>
          </button>
        </div>
        {scenario === "spirit" ? <SpiritScenario /> : <DivestScenario />}
      </div>
    </section>
  );
}
