import { useState, type ReactNode } from "react";

/** Plain-language glossary. Site rule: no term appears without one of these
 * (or an inline explanation in the surrounding sentence). */
export const GLOSSARY: Record<string, string> = {
  "index fund":
    "A fund that buys a little of every company in the market automatically, instead of picking winners. Most 401(k)s are built on them — which is how the same three firms ended up owning part of every airline.",
  "common ownership":
    "When the same investors own big stakes in companies that compete with each other — e.g. one fund owning chunks of American, Delta, United, and Southwest at once.",
  "market share":
    "A carrier's slice of all passengers flying a route. If half the people flying Chicago–Miami fly American, American's share is 50%.",
  HHI:
    "A standard 0–10,000 score for how concentrated a market is: add up the square of every company's market share. One monopolist = 10,000. Regulators flag mergers above ~2,500.",
  "MHHI delta":
    "The extra, invisible concentration you get if owning your rival's stock makes you compete less hard. It's added on top of HHI and uses the same 0–10,000 scale. It's the number this entire fight is about.",
  coefficient:
    "The multiplier from a statistical study: how much fares move when concentration moves by a given amount. Each camp published their own.",
  "difference-in-differences":
    "A way to isolate cause and effect: compare routes Spirit left against similar routes it never flew, before and after the shutdown. Anything that hits ALL routes (like a fuel spike) cancels out.",
  "the Big Three":
    "Vanguard, BlackRock, and State Street — the three giant index-fund managers that collectively hold roughly 15–25% of nearly every major U.S. airline (and most large public companies).",
};

export function Term({ t, children }: { t: keyof typeof GLOSSARY; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="term"
      tabIndex={0}
      role="button"
      aria-label={`Definition: ${GLOSSARY[t]}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={() => setOpen((o) => !o)}
    >
      {children ?? t}
      {open && <span className="term-pop">{GLOSSARY[t]}</span>}
    </span>
  );
}
