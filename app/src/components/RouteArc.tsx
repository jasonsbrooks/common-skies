import { useEffect, useRef } from "react";
import type { Route } from "../lib/bundle";
import { shortCity } from "../lib/bundle";
import { cityPoint, MAP_H, MAP_W, usOutlinePath } from "../lib/geo";

/** Editorial locator map: dotted US silhouette + the route's arc, redrawn
 * with a draw-in animation when the route changes. */
export function RouteArc({ route }: { route: Route }) {
  const a = cityPoint(route.city1);
  const b = cityPoint(route.city2);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    const len = el.getTotalLength();
    el.style.transition = "none";
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len}`;
    // Force a reflow so the reset lands before the transition re-enables.
    el.getBoundingClientRect();
    el.style.transition = "stroke-dashoffset 700ms ease-out";
    el.style.strokeDashoffset = "0";
  }, [route.id]);

  if (!a || !b) return null;

  const [x1, y1] = a;
  const [x2, y2] = b;
  // Bow the arc upward, proportional to distance.
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - Math.min(40, Math.hypot(x2 - x1, y2 - y1) * 0.22);

  return (
    <svg
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      className="locator"
      role="img"
      aria-label={`Route map: ${shortCity(route.city1)} to ${shortCity(route.city2)}`}
    >
      <path
        d={usOutlinePath()}
        fill="none"
        stroke="var(--hairline-strong)"
        strokeWidth="1"
        strokeDasharray="2.5 3"
        strokeLinejoin="round"
      />
      <path
        ref={pathRef}
        d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`}
        fill="none"
        stroke="var(--ink)"
        strokeWidth="1.6"
      />
      <circle cx={x1} cy={y1} r="3" fill="var(--ink)" />
      <circle cx={x2} cy={y2} r="3" fill="var(--ink)" />
      <text x={x1} y={y1 - 6} className="locator-label" textAnchor="middle">
        {shortCity(route.city1)}
      </text>
      <text x={x2} y={y2 - 6} className="locator-label" textAnchor="middle">
        {shortCity(route.city2)}
      </text>
    </svg>
  );
}
