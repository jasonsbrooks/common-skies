import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Bundle } from "./lib/bundle";
import type { ControlAssumption } from "./lib/market-math";

export type SectionId = "learn" | "explore" | "simulate" | "prediction";

interface PersistedState {
  assumption: ControlAssumption;
  regimeId: string; // "ast" | "dgs" | "custom"
  customCoef: number;
  routeId: string | null;
  lastSection: SectionId | null;
  visited: boolean;
}

const STORAGE_KEY = "common-skies-v1";

const DEFAULTS: PersistedState = {
  assumption: "proportional",
  regimeId: "ast",
  customCoef: 0.1,
  routeId: null,
  lastSection: null,
  visited: false,
};

function loadPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<PersistedState>) };
  } catch {
    return DEFAULTS;
  }
}

interface AppState extends PersistedState {
  bundle: Bundle;
  setAssumption: (a: ControlAssumption) => void;
  setRegimeId: (id: string) => void;
  setCustomCoef: (v: number) => void;
  setRouteId: (id: string) => void;
  setLastSection: (s: SectionId) => void;
  restart: () => void;
  /** Active MHHIΔ coefficient under the current regime selection. */
  activeCoef: number;
  activeCoefHhi: number;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({
  bundle,
  children,
}: {
  bundle: Bundle;
  children: ReactNode;
}) {
  const [state, setState] = useState<PersistedState>(loadPersisted);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, visited: true }));
    } catch {
      /* private mode etc. — resume is a nicety, not a requirement */
    }
  }, [state]);

  const patch = useCallback(
    (p: Partial<PersistedState>) => setState((s) => ({ ...s, ...p })),
    [],
  );

  const value = useMemo<AppState>(() => {
    const ast = bundle.regimes.find((r) => r.id === "ast")!;
    const dgs = bundle.regimes.find((r) => r.id === "dgs")!;
    const activeCoef =
      state.regimeId === "ast"
        ? ast.coefMhhiDelta
        : state.regimeId === "dgs"
          ? dgs.coefMhhiDelta
          : state.customCoef;
    // The HHI channel isn't disputed the same way; use the selected camp's
    // published HHI coefficient, and AST's for custom (disclosed in methods).
    const activeCoefHhi =
      state.regimeId === "dgs" ? dgs.coefHhi : ast.coefHhi;
    return {
      ...state,
      bundle,
      activeCoef,
      activeCoefHhi,
      setAssumption: (assumption) => patch({ assumption }),
      setRegimeId: (regimeId) => patch({ regimeId }),
      setCustomCoef: (customCoef) => patch({ customCoef }),
      setRouteId: (routeId) => patch({ routeId }),
      setLastSection: (lastSection) => patch({ lastSection }),
      restart: () => {
        patch({ ...DEFAULTS, visited: true });
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
    };
  }, [state, bundle, patch]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppState outside provider");
  return v;
}
