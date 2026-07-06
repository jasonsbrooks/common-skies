import type { SectionId } from "../state";

const STEPS: { id: SectionId; n: string; label: string }[] = [
  { id: "learn", n: "①", label: "Learn the mechanism" },
  { id: "explore", n: "②", label: "Explore real routes" },
  { id: "simulate", n: "③", label: "Run the experiment" },
  { id: "prediction", n: "④", label: "The prediction" },
];

export function StoryRail({ active }: { active: SectionId | null }) {
  return (
    <nav className="rail" aria-label="Story steps">
      <div className="rail-inner">
        {STEPS.map((s) => (
          <button
            key={s.id}
            className={`rail-step${active === s.id ? " active" : ""}`}
            onClick={() =>
              document
                .getElementById(s.id)
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          >
            {s.n} {s.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
