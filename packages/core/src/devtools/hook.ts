// Opt-in devtools hook: a tiny page-level registry of mounted chart instances so an
// in-page panel (@michi-vz/devtools) or a future browser extension can enumerate every
// chart and read its live ChartContext / props / tools, and drive it. Modeled on React
// DevTools' global hook + the store's tiny-observable pattern (state/store.ts).
//
// Zero overhead unless devtools is enabled: `attachDevtools` is a no-op (returns the
// instance untouched) until the panel sets `globalThis.__MICHI_VZ_DEVTOOLS__ = true`
// (or installs the hook directly). Nothing here imports DOM/AI deps; SSR-safe.
import type { AgentTool } from "../plugins/types";
import type { ChartContext, ChartInstance } from "../types";

/** One mounted chart, as seen by the devtools panel. */
export interface DevtoolsChartEntry {
  /** Stable per-page id (chartType + counter). */
  id: string;
  /** e.g. "line-chart", "fan-chart". */
  chartType: string;
  /** The host element the chart is mounted into. */
  host: HTMLElement;
  /** Live renderer-agnostic context (null before the first render). */
  getContext(): ChartContext | null;
  /** Current props the chart was last (re)rendered with. */
  getProps(): unknown;
  /** Merge a partial props patch and re-render (powers control + data editing). */
  setProps(patch: Record<string, unknown>): void;
  /** Plugin-provided agent/MCP tools, if any. */
  getTools?(): AgentTool[];
}

type Listener = (charts: DevtoolsChartEntry[]) => void;

/** The singleton installed on `globalThis.__MICHI_VZ_DEVTOOLS_HOOK__`. */
export interface MichiVzDevtoolsHook {
  /** Marks this object as a michi-vz devtools hook (so an extension can detect it). */
  readonly isMichiVzDevtools: true;
  /** All currently-mounted charts, keyed by id. */
  readonly charts: Map<string, DevtoolsChartEntry>;
  register(entry: DevtoolsChartEntry): void;
  unregister(id: string): void;
  /** Subscribe to register/unregister/refresh; returns an unsubscribe fn. */
  subscribe(fn: Listener): () => void;
  /** Re-broadcast the current chart list (call after a chart re-renders). */
  notify(): void;
}

interface DevtoolsGlobals {
  __MICHI_VZ_DEVTOOLS__?: boolean;
  __MICHI_VZ_DEVTOOLS_HOOK__?: MichiVzDevtoolsHook;
}

const g = globalThis as unknown as DevtoolsGlobals;
let counter = 0;

function createHook(): MichiVzDevtoolsHook {
  const charts = new Map<string, DevtoolsChartEntry>();
  const subs = new Set<Listener>();
  const broadcast = (): void => {
    const list = [...charts.values()];
    subs.forEach((fn) => fn(list));
  };
  return {
    isMichiVzDevtools: true,
    charts,
    register(entry) {
      charts.set(entry.id, entry);
      broadcast();
    },
    unregister(id) {
      if (charts.delete(id)) broadcast();
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    notify: broadcast,
  };
}

/** The installed hook, or null when devtools has not been enabled. */
export function getDevtoolsHook(): MichiVzDevtoolsHook | null {
  if (g.__MICHI_VZ_DEVTOOLS_HOOK__) return g.__MICHI_VZ_DEVTOOLS_HOOK__;
  if (g.__MICHI_VZ_DEVTOOLS__) {
    g.__MICHI_VZ_DEVTOOLS_HOOK__ = createHook();
    return g.__MICHI_VZ_DEVTOOLS_HOOK__;
  }
  return null;
}

/**
 * Turn on devtools (sets the flag, installs the hook) and return it. Call this BEFORE
 * mounting charts so they register themselves; charts mounted while disabled are not
 * tracked (a panel can still discover web components via the DOM as a fallback).
 */
export function enableDevtools(): MichiVzDevtoolsHook {
  g.__MICHI_VZ_DEVTOOLS__ = true;
  return getDevtoolsHook() as MichiVzDevtoolsHook;
}

/**
 * Register a freshly-mounted chart with the devtools hook and return an instance whose
 * `destroy()` also unregisters it. No-op (returns `instance` unchanged) when devtools is
 * disabled, so production bundles that never enable it pay only one flag check per mount.
 *
 * `getProps` must return the props the chart's `update()` accepts; `setProps` is derived
 * from it so a panel can patch a single field (e.g. highlightItems, or an edited dataSet).
 */
export function attachDevtools<P>(
  instance: ChartInstance<P>,
  host: HTMLElement,
  chartType: string,
  getProps: () => P
): ChartInstance<P> {
  const hook = getDevtoolsHook();
  if (!hook) return instance;

  const id = `${chartType}-${++counter}`;
  hook.register({
    id,
    chartType,
    host,
    getContext: () => instance.getContext(),
    getProps: () => getProps(),
    setProps: (patch) => instance.update({ ...getProps(), ...(patch as Partial<P>) } as P),
    getTools: instance.getTools ? () => instance.getTools!() : undefined,
  });

  return {
    ...instance,
    update(next: P) {
      instance.update(next);
      hook.notify();
    },
    destroy() {
      hook.unregister(id);
      instance.destroy();
    },
  };
}
