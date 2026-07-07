import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";
import { useMemo, useState, type ReactNode } from "react";
import type { BundleEvent, Route } from "../lib/bundle";
import { useAnimatedSeries } from "../lib/useAnimatedSeries";
import { useAppState } from "../state";
import { TranslationSentence } from "./Dials";

const W = 640;
const FARE_H = 190;
const CONC_H = 250;
const M = { top: 34, right: 14, bottom: 24, left: 52 };

function useXScale(n: number) {
  return useMemo(
    () => scaleLinear([0, n - 1], [M.left, W - M.right]),
    [n],
  );
}

function quarterTicks(quarters: string[]): number[] {
  // A tick at Q1 of every even year keeps labels breathable.
  return quarters
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => q.endsWith("Q1") && Number(q.slice(0, 4)) % 2 === 0)
    .map(({ i }) => i);
}

function seriesPath(
  values: (number | null)[],
  x: (i: number) => number,
  y: (v: number) => number,
): string {
  const gen = line<number | null>()
    .defined((v) => v !== null)
    .x((_, i) => x(i))
    .y((v) => y(v as number));
  return gen(values) ?? "";
}

interface HoverProps {
  hoverIdx: number | null;
  setHoverIdx: (i: number | null) => void;
}

function useHoverHandlers(x: ReturnType<typeof scaleLinear<number, number>>, n: number, set: (i: number | null) => void) {
  return {
    onMouseMove: (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * W;
      const i = Math.round(x.invert(px));
      set(Math.max(0, Math.min(n - 1, i)));
    },
    onMouseLeave: () => set(null),
  };
}

function ChartFrame({
  h,
  title,
  readout,
  overlay,
  children,
  handlers,
}: {
  h: number;
  title: ReactNode;
  readout?: ReactNode;
  overlay?: ReactNode;
  children: ReactNode;
  handlers: ReturnType<typeof useHoverHandlers>;
}) {
  return (
    <div className="chart-card">
      <div className="chart-head">
        <div className="chart-title">{title}</div>
        <div className="chart-readout">{readout}</div>
      </div>
      <svg viewBox={`0 0 ${W} ${h}`} className="chart" {...handlers}>
        {children}
      </svg>
      {overlay}
    </div>
  );
}

function XAxis({ quarters, x, h }: { quarters: string[]; x: (i: number) => number; h: number }) {
  return (
    <g>
      {quarterTicks(quarters).map((i) => (
        <g key={i}>
          <line x1={x(i)} x2={x(i)} y1={h - M.bottom} y2={h - M.bottom + 4} stroke="var(--hairline-strong)" />
          <text x={x(i)} y={h - 7} className="tick" textAnchor="middle">
            {quarters[i]!.slice(0, 4)}
          </text>
        </g>
      ))}
      <line x1={M.left} x2={W - M.right} y1={h - M.bottom} y2={h - M.bottom} stroke="var(--hairline-strong)" />
    </g>
  );
}

function Crosshair({ idx, x, h }: { idx: number | null; x: (i: number) => number; h: number }) {
  if (idx === null) return null;
  return (
    <line
      x1={x(idx)}
      x2={x(idx)}
      y1={M.top - 6}
      y2={h - M.bottom}
      stroke="var(--ink-faint)"
      strokeWidth="1"
      strokeDasharray="3 3"
    />
  );
}

/** Event hairlines + dots along the top of a chart. */
function EventLayer({
  events,
  quarters,
  x,
  h,
  onHover,
}: {
  events: BundleEvent[];
  quarters: string[];
  x: (i: number) => number;
  h: number;
  onHover: (e: { evs: BundleEvent[]; xFrac: number } | null) => void;
}) {
  const byIdx = useMemo(() => {
    const m = new Map<number, BundleEvent[]>();
    for (const e of events) {
      const i = quarters.indexOf(e.quarter);
      if (i >= 0) m.set(i, [...(m.get(i) ?? []), e]);
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [events, quarters]);

  return (
    <g>
      {byIdx.map(([i, evs]) => (
        <g
          key={i}
          onMouseEnter={() => onHover({ evs, xFrac: x(i) / W })}
          onMouseLeave={() => onHover(null)}
          style={{ cursor: "help" }}
        >
          <line x1={x(i)} x2={x(i)} y1={M.top - 4} y2={h - M.bottom} stroke="var(--hairline-strong)" strokeDasharray="2 4" />
          {/* generous invisible hit target */}
          <circle cx={x(i)} cy={M.top - 10} r="12" fill="transparent" />
          <circle
            cx={x(i)}
            cy={M.top - 10}
            r={evs.length > 1 ? 7 : 4.5}
            fill="var(--paper)"
            stroke="var(--ink-muted)"
            strokeWidth="1.3"
          />
          {evs.length > 1 && (
            // "×2" = two events share this quarter (COVID + the Buffett
            // exit both landed in 2020Q2); a bare numeral read as a label.
            <text x={x(i)} y={M.top - 7.4} className="event-count" textAnchor="middle">
              ×{evs.length}
            </text>
          )}
        </g>
      ))}
    </g>
  );
}

export function RouteCharts({ route }: { route: Route }) {
  const { bundle, assumption, activeCoef, regimeId } = useAppState();
  const s = route.series;
  const n = s.quarters.length;
  const x = useXScale(n);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [eventTip, setEventTip] = useState<
    { evs: BundleEvent[]; xFrac: number; chart: "fare" | "conc" } | null
  >(null);

  const chartEvents = bundle.events.filter((e) => !e.beyond_series);
  const mhhiTarget = assumption === "proportional" ? s.mhhiDeltaAst : s.mhhiDeltaPassive;
  // What the fare would be with the shared-owner effect switched off,
  // under the reader's current dials. Both dials visibly move this line.
  // Memoized: useAnimatedSeries keys its animation on array identity, so a
  // fresh array every render restarts the lerp forever and the line
  // freezes on stale values (it was drawing the previous route's fares).
  const counterfactualTarget = useMemo(
    () =>
      s.fare.map((f, idx) => {
        const m = mhhiTarget[idx];
        if (f === null || m === null || m === undefined) return null;
        return f * Math.exp(-activeCoef * (m / 10000));
      }),
    [s.fare, mhhiTarget, activeCoef],
  );
  // Animated: toggle flips deflate/inflate the lines; route changes glide.
  const mhhi = useAnimatedSeries(mhhiTarget);
  const hhiAnim = useAnimatedSeries(s.hhi);
  const fareAnim = useAnimatedSeries(s.fare);
  const cfAnim = useAnimatedSeries(counterfactualTarget);
  const campColor =
    regimeId === "dgs" ? "var(--dgs)" : regimeId === "ast" ? "var(--ast)" : "var(--ink-muted)";

  const fareY = useMemo(() => {
    const vals = s.fare.filter((v): v is number => v !== null);
    const max = Math.max(...vals);
    return scaleLinear([0, max * 1.12], [FARE_H - M.bottom, M.top]);
  }, [s.fare]);

  const concY = useMemo(() => {
    const vals = [...s.hhi, ...s.mhhiDeltaAst, ...s.mhhiDeltaPassive].filter(
      (v): v is number => v !== null,
    );
    const max = Math.max(...vals, 2600);
    return scaleLinear([0, max * 1.08], [CONC_H - M.bottom, M.top]);
  }, [s]);

  const handlers = useHoverHandlers(x, n, setHoverIdx);
  // Readouts fall back to the latest quarter with data, so they always teach.
  const lastIdx = s.fare.reduce<number>(
    (acc, v, idx) => (v !== null ? idx : acc),
    0,
  );
  const i = hoverIdx ?? lastIdx;
  const isLive = hoverIdx !== null;
  const shares = s.shares[i];

  const eventTipBox = (tip: { evs: BundleEvent[]; xFrac: number } | null) =>
    tip && (
      <div
        className="event-tip"
        style={{ left: `${Math.min(0.78, Math.max(0.22, tip.xFrac)) * 100}%` }}
      >
        {tip.evs.map((e) => (
          <div key={e.id} className="event-tip-item">
            <strong>{e.label}</strong>
            <span>{e.detail}</span>
          </div>
        ))}
      </div>
    );

  return (
    <div className="charts">
      <ChartFrame
        h={FARE_H}
        handlers={handlers}
        overlay={eventTipBox(eventTip?.chart === "fare" ? eventTip : null)}
        readout={
          <>
            <span className={isLive ? "" : "readout-dim"}>{s.quarters[i]}</span>{" "}
            <strong>{s.fare[i] !== null ? `$${s.fare[i]!.toFixed(0)}` : "—"}</strong>
            {counterfactualTarget[i] !== null && (
              <span className="readout-shares">
                without shared-owner effect: $
                {counterfactualTarget[i]!.toFixed(0)}
              </span>
            )}
          </>
        }
        title={
          <>
            Average one-way fare{" "}
            <span className="chart-sub">
              <span style={{ color: "var(--fare)" }}>— what people paid</span>{" "}
              <span style={{ color: campColor }}>
                ┄ what your dials say it would cost with no shared-owner effect
              </span>
            </span>
          </>
        }
      >
        {[100, 200, 300, 400, 500]
          .filter((v) => v < fareY.domain()[1]!)
          .map((v) => (
            <g key={v}>
              <line x1={M.left} x2={W - M.right} y1={fareY(v)} y2={fareY(v)} stroke="var(--hairline)" />
              <text x={M.left - 6} y={fareY(v) + 4} className="tick" textAnchor="end">
                ${v}
              </text>
            </g>
          ))}
        <path
          d={seriesPath(cfAnim, x, fareY)}
          fill="none"
          stroke={campColor}
          strokeWidth="1.7"
          strokeDasharray="5 4"
          style={{ transition: "stroke 300ms ease" }}
        />
        <path d={seriesPath(fareAnim, x, fareY)} fill="none" stroke="var(--fare)" strokeWidth="2" />
        <EventLayer
          events={chartEvents}
          quarters={s.quarters}
          x={x}
          h={FARE_H}
          onHover={(t) => setEventTip(t ? { ...t, chart: "fare" } : null)}
        />
        <Crosshair idx={hoverIdx} x={x} h={FARE_H} />
        <XAxis quarters={s.quarters} x={x} h={FARE_H} />
      </ChartFrame>

      <TranslationSentence />

      <ChartFrame
        h={CONC_H}
        handlers={handlers}
        overlay={eventTipBox(eventTip?.chart === "conc" ? eventTip : null)}
        readout={
          <>
            <span className={isLive ? "" : "readout-dim"}>{s.quarters[i]}</span>{" "}
            HHI <strong>{s.hhi[i]?.toLocaleString() ?? "—"}</strong> · MHHI delta{" "}
            <strong>{mhhiTarget[i]?.toLocaleString() ?? "—"}</strong>
            {shares && (
              <span className="readout-shares">
                {Object.entries(shares)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 4)
                  .map(([c, v]) => `${(bundle.carrierNames[c] ?? c).split(" ")[0]} ${(v * 100).toFixed(0)}%`)
                  .join(" · ")}
              </span>
            )}
          </>
        }
        title={
          <>
            Market concentration{" "}
            <span className="chart-sub">
              <span style={{ color: "var(--hhi)" }}>— HHI (the base score)</span>{" "}
              <span style={{ color: "var(--mhhi)" }}>
                — MHHI delta (just the add-on for shared owners, not the
                total — the lines can cross)
              </span>
            </span>
          </>
        }
      >
        {[2500, 5000, 7500]
          .filter((v) => v < concY.domain()[1]!)
          .map((v) => (
            <g key={v}>
              <line x1={M.left} x2={W - M.right} y1={concY(v)} y2={concY(v)} stroke="var(--hairline)" />
              <text x={M.left - 6} y={concY(v) + 4} className="tick" textAnchor="end">
                {v.toLocaleString()}
              </text>
            </g>
          ))}
        <line
          x1={M.left}
          x2={W - M.right}
          y1={concY(1800)}
          y2={concY(1800)}
          stroke="var(--ink-faint)"
          strokeDasharray="5 4"
        />
        <text x={W - M.right} y={concY(1800) - 5} className="tick" textAnchor="end">
          regulators call 1,800+ “highly concentrated”
        </text>
        <path d={seriesPath(hhiAnim, x, concY)} fill="none" stroke="var(--hhi)" strokeWidth="1.8" />
        <path
          d={seriesPath(mhhi, x, concY)}
          fill="none"
          stroke="var(--mhhi)"
          strokeWidth="2.2"
        />
        <EventLayer
          events={chartEvents}
          quarters={s.quarters}
          x={x}
          h={CONC_H}
          onHover={(t) => setEventTip(t ? { ...t, chart: "conc" } : null)}
        />
        <Crosshair idx={hoverIdx} x={x} h={CONC_H} />
        <XAxis quarters={s.quarters} x={x} h={CONC_H} />
      </ChartFrame>

    </div>
  );
}
