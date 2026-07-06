import type { Route } from "../lib/bundle";
import { routeLabel } from "../lib/bundle";
import { useAppState } from "../state";

/** Story-forward preset routes (id → why it's interesting). Falls back
 * silently if a preset id ever leaves the top-50. */
const PRESETS: { id: string; note: string }[] = [
  { id: "30977-31703", note: "the classic majors battleground" },
  { id: "32457-32575", note: "Southwest's fortress" },
  { id: "30977-32467", note: "a route Spirit just left" },
  { id: "31703-32467", note: "the busiest East Coast market" },
];

export const DEFAULT_ROUTE_ID = "30977-31703"; // Chicago ↔ New York City

export function RoutePicker() {
  const { bundle, routeId, setRouteId } = useAppState();
  const selected = routeId ?? DEFAULT_ROUTE_ID;
  const presets = PRESETS.filter((p) => bundle.routes.some((r) => r.id === p.id));

  return (
    <div className="route-picker">
      <div className="chips">
        {presets.map((p) => {
          const route = bundle.routes.find((r) => r.id === p.id)!;
          return (
            <button
              key={p.id}
              className={`chip${selected === p.id ? " active" : ""}`}
              onClick={() => setRouteId(p.id)}
              title={p.note}
            >
              {routeLabel(route)}
              <span className="chip-note">{p.note}</span>
            </button>
          );
        })}
      </div>
      <label className="route-select">
        or any of the 50 busiest routes:{" "}
        <select value={selected} onChange={(e) => setRouteId(e.target.value)}>
          {bundle.routes.map((r) => (
            <option key={r.id} value={r.id}>
              {routeLabel(r)} — {Math.round(r.meanDailyPax).toLocaleString()} passengers/day
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function useSelectedRoute(): Route {
  const { bundle, routeId } = useAppState();
  return (
    bundle.routes.find((r) => r.id === (routeId ?? DEFAULT_ROUTE_ID)) ??
    bundle.routes[0]!
  );
}
