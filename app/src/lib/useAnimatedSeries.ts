import { useEffect, useRef, useState } from "react";

type Series = (number | null)[];

/**
 * Morph a numeric series toward `target` with an ease-out rAF lerp.
 * Both precomputed MHHIΔ variants share one quarter grid, so a toggle
 * flip animates index-wise — the line visibly deflates or inflates
 * instead of snapping, which is the whole point of the toggle.
 */
export function useAnimatedSeries(target: Series, ms = 450): Series {
  const [display, setDisplay] = useState<Series>(target);
  const fromRef = useRef<Series>(target);
  const rafRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    cancelAnimationFrame(rafRef.current);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - (1 - t) * (1 - t);
      const next = target.map((v, idx) => {
        const f = from[idx];
        if (v === null || f === null || f === undefined) return v;
        return f + (v - f) * eased;
      });
      setDisplay(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, ms]);

  return display;
}
