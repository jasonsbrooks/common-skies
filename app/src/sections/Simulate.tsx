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

  return (
    <div>
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
              {treatmentIds.has(r.id) ? " · in the registered experiment" : ""}
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

      <div className="wrinkle">
        <strong>The wrinkle that makes this honest:</strong> by shutdown,
        Spirit didn't belong to the index funds anymore — bankruptcy handed it
        to creditors (Citadel, PIMCO, Ares…). Run the math with Spirit's{" "}
        <em>2022</em> owners (Vanguard 9%, BlackRock 7.5%) and its exit would
        move the common-ownership term by {wrinkle.dHypo >= 0 ? "+" : ""}
        {wrinkle.dHypo.toLocaleString()} points on this route; with its{" "}
        <em>actual</em> creditor owners it moves {wrinkle.dActual >= 0 ? "+" : ""}
        {wrinkle.dActual.toLocaleString()}. The index funds had already lost
        this one — which is exactly why the honest experiment (step ④) splits
        the channels instead of eyeballing fares.
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
        Uses the route you picked in ② ({routeLabel(route)}). Market shares
        don't move at all — this scenario only rewires <em>ownership</em>, so
        the concentration charge is $0.00 by construction and everything rides
        on the disputed line.
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
              when only stock ownership changes — a merger review would never
              open. MHHI Δ falls{" "}
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
          A major low-cost carrier left hundreds of routes at once — the kind
          of shock economists wait decades for. What should happen to fares?
          Depends on your dials. Run it yourself, live, using the same math
          the studies used.
        </p>
        <div className="chips">
          <button
            className={`chip${scenario === "spirit" ? " active" : ""}`}
            onClick={() => setScenario("spirit")}
          >
            The Spirit shutdown
            <span className="chip-note">it actually happened — May 2, 2026</span>
          </button>
          <button
            className={`chip${scenario === "divest" ? " active" : ""}`}
            onClick={() => setScenario("divest")}
          >
            The Big Three divest everything
            <span className="chip-note">the thought experiment the fight is really about</span>
          </button>
        </div>
        {scenario === "spirit" ? <SpiritScenario /> : <DivestScenario />}
      </div>
    </section>
  );
}
