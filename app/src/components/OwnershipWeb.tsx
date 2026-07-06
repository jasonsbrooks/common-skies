import { useMemo } from "react";
import type { OwnershipRow } from "../lib/bundle";
import type { ControlAssumption } from "../lib/market-math";
import { BIG_THREE } from "../lib/market-math";

const SHORT_OWNER: Record<string, string> = {
  "Berkshire Hathaway": "Berkshire",
  "State Street": "State St",
  "Franklin Resources": "Franklin",
  "T. Rowe Price": "T. Rowe",
  "Victory Capital": "Victory",
  "Icahn Capital": "Icahn",
  "Galkin Revocable Trust": "Galkin Tr.",
  "Vladimir & Angela Galkin": "Galkins",
  "AllianceBernstein": "AB",
  "Arena Capital": "Arena",
  "Cyrus Capital": "Cyrus",
  "Ares Management": "Ares",
  "Rokos Capital": "Rokos",
  "Indigo Partners": "Indigo",
  "Bill Franke": "Franke",
  "Wildcat Capital": "Wildcat",
  "US Global Jets ETF": "JETS ETF",
};

export interface OwnershipWebProps {
  /** Stakes from the relevant snapshot (owner, carrier, pct 0–100). */
  stakes: OwnershipRow[];
  /** Carrier codes to display, in display order (e.g. by market share). */
  carriers: string[];
  carrierNames: Record<string, string>;
  assumption: ControlAssumption;
  /** Optional relative node weights (e.g. market shares, 0–1). */
  weights?: Record<string, number>;
  /** Pin owner positions (left→right). Owners keep their slot even when a
   * stake hits zero — no layout jumps while dragging sliders. */
  ownerOrder?: string[];
  maxOwners?: number;
  height?: number;
}

const W = 300;

/**
 * The mechanism, made visible: owners above, carriers below, a wire per
 * stake. HHI can only see the bottom row; MHHI delta sees the wiring.
 * Under passive-index the Big Three's wires grey out and stop counting.
 */
export function OwnershipWeb({
  stakes,
  carriers,
  carrierNames,
  assumption,
  weights,
  ownerOrder,
  maxOwners = 6,
  height = 190,
}: OwnershipWebProps) {
  const H = height;
  const relevant = useMemo(
    () => stakes.filter((s) => carriers.includes(s.carrier)),
    [stakes, carriers],
  );

  const owners = useMemo(() => {
    if (ownerOrder) {
      const present = new Set(relevant.map((s) => s.owner));
      return ownerOrder.filter((o) => present.has(o)).slice(0, maxOwners);
    }
    const strength = new Map<string, number>();
    for (const s of relevant) {
      strength.set(s.owner, (strength.get(s.owner) ?? 0) + s.pct);
    }
    return [...strength.entries()]
      .sort((a, b) => {
        // Big Three first (they're the story), then by combined stake.
        const aBig = (BIG_THREE as readonly string[]).includes(a[0]) ? 1 : 0;
        const bBig = (BIG_THREE as readonly string[]).includes(b[0]) ? 1 : 0;
        if (aBig !== bBig) return bBig - aBig;
        return b[1] - a[1];
      })
      .slice(0, maxOwners)
      .map(([o]) => o);
  }, [relevant, maxOwners, ownerOrder]);

  const ownerX = (i: number) =>
    owners.length === 1 ? W / 2 : 34 + (i * (W - 68)) / (owners.length - 1);
  const carrierX = (i: number) =>
    carriers.length === 1 ? W / 2 : 26 + (i * (W - 52)) / (carriers.length - 1);
  const ownerY = 30;
  const carrierY = H - 34;

  const passive = assumption === "passive-index";
  const isBig = (o: string) => (BIG_THREE as readonly string[]).includes(o);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="web" role="img" aria-label="Ownership web">
      {/* wires */}
      {relevant.map((s) => {
        const oi = owners.indexOf(s.owner);
        const ci = carriers.indexOf(s.carrier);
        if (oi < 0 || ci < 0 || s.pct <= 0) return null;
        const dead = passive && isBig(s.owner);
        return (
          <line
            key={`${s.owner}-${s.carrier}`}
            x1={ownerX(oi)}
            y1={ownerY + 8}
            x2={carrierX(ci)}
            y2={carrierY - 10}
            stroke={dead ? "var(--hairline-strong)" : isBig(s.owner) ? "var(--mhhi)" : "var(--ink-muted)"}
            strokeWidth={Math.max(0.8, Math.min(4.5, s.pct / 3.2))}
            strokeDasharray={dead ? "3 4" : undefined}
            opacity={dead ? 0.55 : isBig(s.owner) ? 0.8 : 0.5}
            style={{ transition: "stroke 350ms ease, opacity 350ms ease" }}
          />
        );
      })}
      {/* owners */}
      {owners.map((o, i) => {
        const dead = passive && isBig(o);
        return (
          <g key={o} opacity={dead ? 0.45 : 1} style={{ transition: "opacity 350ms ease" }}>
            <circle cx={ownerX(i)} cy={ownerY} r="7" fill={isBig(o) ? "var(--mhhi)" : "var(--ink-muted)"} />
            <text x={ownerX(i)} y={ownerY - 13} className="web-label" textAnchor="middle">
              {SHORT_OWNER[o] ?? o}
            </text>
          </g>
        );
      })}
      {/* carriers */}
      {carriers.map((c, i) => {
        const owned = relevant.some((s) => s.carrier === c);
        const w = weights?.[c];
        const r = w !== undefined ? Math.max(6, Math.sqrt(w) * 22) : 8;
        return (
          <g key={c}>
            <circle
              cx={carrierX(i)}
              cy={carrierY}
              r={r}
              fill={owned ? "var(--ink)" : "var(--paper-raised)"}
              stroke="var(--ink)"
              strokeWidth={owned ? 0 : 1.2}
              strokeDasharray={owned ? undefined : "2 2"}
            />
            <text x={carrierX(i)} y={carrierY + r + 13} className="web-label" textAnchor="middle">
              {(carrierNames[c] ?? c).split(" ")[0]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
