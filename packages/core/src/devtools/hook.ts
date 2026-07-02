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

/** One canvas-mode pointer hit-test result, streamed to the devtools Hit-test tab. */
export interface DevtoolsHitEvent {
  /** The chart host the pointer event fired on (maps to a DevtoolsChartEntry). */
  host: HTMLElement;
  /** Pointer position in the chart's plot coordinate space. */
  x: number;
  y: number;
  /** The mark the hit-test resolved, or null for a miss. */
  label: string | null;
  /** performance.now() timestamp. */
  t: number;
}

type HitListener = (e: DevtoolsHitEvent) => void;
type TimingListener = (id: string, ms: number) => void;

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
  /**
   * High-frequency channels, kept separate from subscribe/notify so a busy
   * mousemove stream never re-renders the chart list. Nothing is stored here -
   * a panel keeps its own ring buffer.
   */
  reportHit(e: DevtoolsHitEvent): void;
  subscribeHits(fn: HitListener): () => void;
  /** Per-update render duration, reported by attachDevtools around update(). */
  reportTiming(id: string, ms: number): void;
  subscribeTimings(fn: TimingListener): () => void;
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
  const hitSubs = new Set<HitListener>();
  const timingSubs = new Set<TimingListener>();
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
    reportHit(e) {
      hitSubs.forEach((fn) => fn(e));
    },
    subscribeHits(fn) {
      hitSubs.add(fn);
      return () => hitSubs.delete(fn);
    },
    reportTiming(id, ms) {
      timingSubs.forEach((fn) => fn(id, ms));
    },
    subscribeTimings(fn) {
      timingSubs.add(fn);
      return () => timingSubs.delete(fn);
    },
  };
}

/**
 * Report a canvas hit-test result from an engine's host mousemove/click handler.
 * Safe to call unconditionally: it is a no-op unless devtools is enabled, and it
 * tolerates an older hook (version skew) that predates the hit channel.
 */
export function reportDevtoolsHit(host: HTMLElement, x: number, y: number, label: string | null): void {
  const hook = g.__MICHI_VZ_DEVTOOLS_HOOK__;
  if (!hook || typeof hook.reportHit !== "function") return;
  const t = typeof performance !== "undefined" ? performance.now() : 0;
  hook.reportHit({ host, x, y, label, t });
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
  // One timed path for BOTH the app's update() and a panel edit via setProps, so
  // the Profiler sees every re-render regardless of who drove it.
  const timedUpdate = (next: P): void => {
    const timed = typeof performance !== "undefined" && typeof hook.reportTiming === "function";
    const t0 = timed ? performance.now() : 0;
    instance.update(next);
    if (timed) hook.reportTiming(id, performance.now() - t0);
    hook.notify();
  };
  hook.register({
    id,
    chartType,
    host,
    getContext: () => instance.getContext(),
    getProps: () => getProps(),
    setProps: (patch) => timedUpdate({ ...getProps(), ...(patch as Partial<P>) } as P),
    getTools: instance.getTools ? () => instance.getTools!() : undefined,
  });

  return {
    ...instance,
    update: timedUpdate,
    destroy() {
      hook.unregister(id);
      instance.destroy();
    },
  };
}
