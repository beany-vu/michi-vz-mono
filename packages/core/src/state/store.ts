// Framework-agnostic replacement for the React MichiVzProvider context. Charts
// (and wrappers) can share one store instance to coordinate cross-chart state
// (colorsMapping, highlightItems, disabledItems, locale, dir, fontFamily, ...).
// Tiny observable: get / set(partial) / subscribe(fn) -> unsubscribe.

import type { SinglePointLineConfig } from "../types";

export interface MichiVzState {
  colorsMapping: Record<string, string>;
  highlightItems: string[];
  disabledItems: string[];
  // Parity with the legacy michi-vz MichiVzProvider context so a wrapper's
  // useChartContext()/useMichiVz() can return the full shape consumers read.
  // thd reads hiddenItems (useDimensionLabels) and visibleItems (useSorting);
  // both stay [] in thd but must exist so reads aren't undefined.
  hiddenItems: string[];
  visibleItems: string[];
  fontFamily?: string;
  /** Guide line for single-point series; mirrors the legacy provider prop. */
  singlePointLine?: boolean | SinglePointLineConfig;
  /** Legacy provider parity (unused by thd today; kept so the shape matches). */
  categoryMetadata?: Record<string, { color?: string; label?: string }>;
  colorsBasedMapping?: Record<string, string>;
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
  hiddenItems: [],
  visibleItems: [],
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
