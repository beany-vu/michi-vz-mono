// Framework-agnostic replacement for the React MichiVzProvider context. Charts
// (and wrappers) can share one store instance to coordinate cross-chart state
// (colorsMapping, highlightItems, disabledItems, locale, dir, fontFamily, ...).
// Tiny observable: get / set(partial) / subscribe(fn) -> unsubscribe.

export interface MichiVzState {
  colorsMapping: Record<string, string>;
  highlightItems: string[];
  disabledItems: string[];
  fontFamily?: string;
  locale?: string;
  dir?: "ltr" | "rtl";
}

export interface MichiVzStore {
  get(): MichiVzState;
  set(partial: Partial<MichiVzState>): void;
  subscribe(fn: (state: MichiVzState) => void): () => void;
}

const DEFAULT_STATE: MichiVzState = {
  colorsMapping: {},
  highlightItems: [],
  disabledItems: [],
};

export function createMichiVzStore(initial: Partial<MichiVzState> = {}): MichiVzStore {
  let state: MichiVzState = { ...DEFAULT_STATE, ...initial };
  const subs = new Set<(s: MichiVzState) => void>();
  return {
    get: () => state,
    set: (partial) => {
      state = { ...state, ...partial };
      subs.forEach((fn) => fn(state));
    },
    subscribe: (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}
