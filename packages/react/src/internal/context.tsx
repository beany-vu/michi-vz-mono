// The ONE module that owns the React context identity. Every subpath imports the
// provider and hook from here, never re-creating them: two createContext calls
// would give a provider that appears mounted but reaches nothing, and colours and
// disabledItems would silently fall back to defaults.
import { createContext, useContext, useEffect, useRef, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { createMichiVzStore } from "@michi-vz/core";
import type { MichiVzStore, MichiVzState, SinglePointLineConfig } from "@michi-vz/core";

// ---------------------------------------------------------------------------
// Shared-state provider + hook - parity with the legacy michi-vz MichiVzProvider
// / useChartContext, backed by the framework-agnostic createMichiVzStore. The
// hook subscribes via useSyncExternalStore so charts re-render on shared-state
// changes (tear-free under concurrent rendering). A future CustomEvent
// coordinator can layer on the same store for cross-framework / web-component use.
// ---------------------------------------------------------------------------

export type { MichiVzState } from "@michi-vz/core";

const DEFAULT_CONTEXT_STATE: MichiVzState = {
  colorsMapping: {},
  highlightItems: [],
  disabledItems: [],
  hiddenItems: [],
  visibleItems: [],
};

/** Exported so a per-chart module can read the store directly if it ever needs to.
 *  There must never be a second createContext call anywhere in this package. */
export const MichiVzContext = createContext<MichiVzStore | null>(null);
const noopSubscribe = (): (() => void) => () => {};

export interface MichiVzProviderProps {
  children?: ReactNode;
  colorsMapping?: Record<string, string>;
  highlightItems?: string[];
  disabledItems?: string[];
  hiddenItems?: string[];
  visibleItems?: string[];
  fontFamily?: string;
  singlePointLine?: boolean | SinglePointLineConfig;
  categoryMetadata?: Record<string, { color?: string; label?: string }>;
  colorsBasedMapping?: Record<string, string>;
  locale?: string;
  dir?: "ltr" | "rtl";
}

function stateFromProps(p: MichiVzProviderProps): MichiVzState {
  return {
    colorsMapping: p.colorsMapping ?? {},
    highlightItems: p.highlightItems ?? [],
    disabledItems: p.disabledItems ?? [],
    hiddenItems: p.hiddenItems ?? [],
    visibleItems: p.visibleItems ?? [],
    fontFamily: p.fontFamily,
    singlePointLine: p.singlePointLine,
    categoryMetadata: p.categoryMetadata,
    colorsBasedMapping: p.colorsBasedMapping,
    locale: p.locale,
    dir: p.dir,
  };
}

export function MichiVzProvider(props: MichiVzProviderProps) {
  const storeRef = useRef<MichiVzStore | null>(null);
  if (storeRef.current === null) storeRef.current = createMichiVzStore(stateFromProps(props));

  // Re-sync props → store on change. Identity-stable selector outputs (e.g.
  // react-redux shallowEqual) keep this from firing every render.
  useEffect(() => {
    storeRef.current?.set(stateFromProps(props));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.colorsMapping,
    props.highlightItems,
    props.disabledItems,
    props.hiddenItems,
    props.visibleItems,
    props.fontFamily,
    props.singlePointLine,
    props.categoryMetadata,
    props.colorsBasedMapping,
    props.locale,
    props.dir,
  ]);

  return (
    <MichiVzContext.Provider value={storeRef.current}>{props.children}</MichiVzContext.Provider>
  );
}

/**
 * Read the shared MichiVz state (colorsMapping / highlightItems / disabledItems /
 * hiddenItems / visibleItems / fontFamily / singlePointLine). Returns empty
 * defaults when no MichiVzProvider is mounted, so consumers never read undefined.
 */
export function useChartContext(): MichiVzState {
  const store = useContext(MichiVzContext);
  const getSnapshot = store ? store.get : () => DEFAULT_CONTEXT_STATE;
  return useSyncExternalStore(store ? store.subscribe : noopSubscribe, getSnapshot, getSnapshot);
}
