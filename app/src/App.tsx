import { useEffect, useRef, useState } from "react";
import { loadBundle, type Bundle } from "./lib/bundle";
import { AppStateProvider, useAppState, type SectionId } from "./state";
import { StickyDials } from "./components/Dials";
import { Hero } from "./components/Hero";
import { StoryRail } from "./components/StoryRail";
import { Explore } from "./sections/Explore";
import { Learn } from "./sections/Learn";
import { Simulate } from "./sections/Simulate";
import { Prediction } from "./sections/Prediction";

const SECTION_IDS: SectionId[] = ["learn", "explore", "simulate", "prediction"];

function ResumeBanner() {
  const { visited, lastSection, restart } = useAppState();
  const [dismissed, setDismissed] = useState(false);
  if (!visited || !lastSection || dismissed) return null;
  const labels: Record<SectionId, string> = {
    learn: "① Learn",
    explore: "② Explore",
    simulate: "③ Simulate",
    prediction: "④ The prediction",
  };
  return (
    <div className="resume-banner" role="status">
      <span>Welcome back.</span>
      <button
        onClick={() => {
          setDismissed(true);
          document
            .getElementById(lastSection)
            ?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        Jump back to {labels[lastSection]}
      </button>
      <button
        onClick={() => {
          setDismissed(true);
          restart();
        }}
      >
        Start over
      </button>
    </div>
  );
}

function Page() {
  const { setLastSection } = useAppState();
  const [active, setActive] = useState<SectionId | null>(null);
  const [pastDialsIntro, setPastDialsIntro] = useState(false);
  const seenOnce = useRef(false);

  useEffect(() => {
    // Plain scroll math (not IntersectionObserver): the condensed bar may
    // only appear once the full dials intro has scrolled above the viewport
    // — never before the dials have been explained.
    const check = () => {
      const intro = document.getElementById("dials-intro");
      if (!intro) return;
      setPastDialsIntro(intro.getBoundingClientRect().bottom < 60);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const id = e.target.id as SectionId;
            setActive(id);
            // Don't clobber the persisted position with the first paint.
            if (seenOnce.current) setLastSection(id);
          }
        }
      },
      { rootMargin: "-25% 0px -60% 0px" },
    );
    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    const t = setTimeout(() => (seenOnce.current = true), 1500);
    return () => {
      observer.disconnect();
      clearTimeout(t);
    };
  }, [setLastSection]);

  return (
    <>
      <div className="masthead">
        <div className="wrap">
          <span className="masthead-brand">Common Skies</span>
          <span className="masthead-tag">
            the index-fund airfare fight, adjudicated by you
          </span>
        </div>
      </div>
      <StoryRail active={active} />
      <ResumeBanner />
      <Hero />
      <Learn />
      {/* Wrapper scopes the sticky condensed dials to the data sections. */}
      <div className="dial-scope">
        <StickyDials visible={pastDialsIntro} />
        <Explore />
        <Simulate />
        <Prediction />
      </div>
      <footer className="footer">
        <div className="wrap">
          Fares: DOT Consumer Airfare Report (Table 6). Market shares: BTS
          T-100. Ownership: SEC filings &amp; AST (2018) Table 1 — every number
          cited in the methods panel. Pre-registration commit hash lands here
          in Phase 7.
        </div>
      </footer>
    </>
  );
}

export default function App() {
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBundle().then(setBundle, (e) => setError(String(e)));
  }, []);

  if (error) return <div className="loading">Failed to load data: {error}</div>;
  if (!bundle) return <div className="loading">Loading a decade of airline data…</div>;

  return (
    <AppStateProvider bundle={bundle}>
      <Page />
    </AppStateProvider>
  );
}
