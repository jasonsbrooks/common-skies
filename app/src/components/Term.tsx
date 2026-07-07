import { useState, type ReactNode } from "react";

/** Plain-language glossary. Site rule: no term appears without one of these
 * (or an inline explanation in the surrounding sentence). */
export const GLOSSARY: Record<string, string> = {
  "index fund":
    "A fund that automatically buys a small slice of every big company instead of trying to pick winners. It's cheap and it works, so most retirement savings (401(k)s) now sit in them — run mostly by three firms: Vanguard, BlackRock, and State Street.",
  "common ownership":
    "When the same investors own pieces of companies that are supposed to be competing — like one fund owning chunks of American, Delta, United, AND Southwest at the same time. The question: do 'rivals' with the same owners really fight each other?",
  "market share":
    "A company's percent of the market. If half the people flying Chicago–Miami fly American, American's market share on that route is 50%.",
  HHI:
    "The official 0–10,000 score for how concentrated a market is. Recipe: take each company's percent of the market, square it, add them up. One monopolist: 100² = 10,000. Two equal rivals: 50² + 50² = 5,000. Under the current (2023) merger guidelines, anything above 1,800 is 'highly concentrated' (the old threshold was 2,500). It counts market shares only — it can't see who owns the companies.",
  "MHHI delta":
    "The extra points added to HHI when competitors share owners. Zero if every company has separate owners; big if the same funds own everyone. Same 0–10,000 scale as HHI. Whether these points are real — whether shared ownership actually softens competition — is what this whole fight is about.",
  coefficient:
    "A multiplier measured from data: 'when concentration rises this much, fares rise that much.' Each camp published its own — that disagreement is Dial 2.",
  "difference-in-differences":
    "A trick for isolating cause and effect. Compare the routes Spirit left (treatment) with near-identical routes it never flew (control), before and after the shutdown. Anything that hits BOTH groups — like a fuel-price spike raising all fares — subtracts away, leaving just the effect of Spirit's exit.",
  "the Big Three":
    "Vanguard, BlackRock, and State Street — the three giant index-fund managers. Together they hold roughly 15–25% of nearly every major U.S. airline, and of most large public companies.",
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
