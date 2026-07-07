import { DialsIntro } from "../components/Dials";
import { OwnershipWeb } from "../components/OwnershipWeb";
import { RouteArc } from "../components/RouteArc";
import { RouteCharts } from "../components/RouteCharts";
import { RoutePicker, useSelectedRoute } from "../components/RoutePicker";
import { Term } from "../components/Term";
import { shortCity, snapshotForQuarter } from "../lib/bundle";
import { useAppState } from "../state";

function RouteFacts() {
  const route = useSelectedRoute();
  const { bundle, assumption } = useAppState();
  const s = route.series;
  const lastIdx = [...s.hhi].map((v, i) => (v !== null ? i : -1)).reduce((a, b) => Math.max(a, b), 0);
  const shares = s.shares[lastIdx] ?? {};
  const topCarriers = Object.entries(shares)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);
  const quarter = s.quarters[lastIdx]!;
  const snapshot = snapshotForQuarter(bundle, quarter);
  const stakes = bundle.ownershipSnapshots[snapshot] ?? [];
  const webCarriers = topCarriers.map(([c]) => c);

  return (
    <div className="facts">
      <RouteArc route={route} />
      <div className="web-card">
        <div className="web-title">The web behind this route</div>
        <OwnershipWeb
          stakes={stakes}
          carriers={webCarriers}
          carrierNames={bundle.carrierNames}
          assumption={assumption}
          weights={shares}
        />
        <p className="web-caption">
          Who owns the airlines on this route ({snapshot.slice(0, 4)}{" "}
          filings) — each line is an ownership stake, thicker = bigger.{" "}
          <Term t="HHI" /> sees only the bottom row; <Term t="MHHI delta" />{" "}
          also counts the lines.
          {assumption === "passive-index" &&
            " Greyed-out lines: the Big Three's stakes, which your Dial 1 setting says don't count."}
          {" "}Hollow circles: airlines with no big shared owners on record —
          mostly regional carriers, smaller airlines that operate flights on
          behalf of the big ones.
        </p>
      </div>
      <dl>
        <div>
          <dt>Distance</dt>
          <dd>{Math.round(route.miles).toLocaleString()} miles</dd>
        </div>
        <div>
          <dt>Traffic</dt>
          <dd>{Math.round(route.meanDailyPax).toLocaleString()} passengers/day</dd>
        </div>
        <div>
          <dt>Who flies it now ({s.quarters[lastIdx]})</dt>
          <dd>
            {topCarriers
              .map(([c, v]) => `${bundle.carrierNames[c]?.split(" ")[0] ?? c} ${(v * 100).toFixed(0)}%`)
              .join(" · ")}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function Explore() {
  const route = useSelectedRoute();
  return (
    <section className="section" id="explore">
      <div className="wrap">
        <div className="section-kicker">② Explore real routes</div>
        <h2>Ten years of fares on routes you've actually flown</h2>
        <p className="section-lede">
          Here are the same two scoreboards, now computed on real government
          data. For every quarter since 2014, you can see what a ticket cost
          between {shortCity(route.city1)} and {shortCity(route.city2)}, who
          carried the passengers, and both scores: the gray <Term t="HHI" />{" "}
          line counts market shares only, while the purple{" "}
          <Term t="MHHI delta" /> line adds the extra points for shared
          owners. The circles along the top of each chart mark real events —
          hover over them to read the story.
        </p>
        <DialsIntro />
        <RoutePicker />
        <div className="explore-grid">
          <RouteCharts route={route} />
          <RouteFacts />
        </div>
      </div>
    </section>
  );
}
