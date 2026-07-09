// Shared glue between an engine and the TimelineController for "play through
// years" charts (rows carrying an optional `date`). The engine keeps ownership
// of rendering: the timeline just names the active period and the engine
// filters its dataSet to that period's rows before processing.
import { resolveEasing, easeInOutCubic, type EasingFn } from "./easing";
import { TimelineController } from "./timeline";
import { defaultTicker, type Ticker } from "./ticker";
import {
  createTimelineControlRefs,
  applyTimelineControl,
  syncTimelineControl,
} from "../render/timelineControl";
import type { Filter, TimelinePeriodConfig } from "../types";

export interface ResolvedTimeline {
  speedMs: number;
  loop: boolean;
  autoplay: boolean;
  showControl: boolean;
  /** Phase 6: tween values between periods (discrete stepping until then). */
  interpolate: boolean;
  tweenMs: number | null;
  easing: EasingFn;
  onStep: ((period: number | string, index: number) => void) | null;
  formatPeriod: ((period: number | string) => string) | null;
}

export function resolveTimeline(
  v: boolean | TimelinePeriodConfig | undefined
): ResolvedTimeline | null {
  if (!v) return null;
  const cfg = v === true ? {} : v;
  return {
    speedMs: cfg.speedMs ?? 800,
    loop: cfg.loop ?? false,
    autoplay: cfg.autoplay ?? false,
    showControl: cfg.showControl ?? true,
    interpolate: cfg.interpolate ?? true,
    tweenMs: cfg.tweenMs ?? null,
    easing: resolveEasing(cfg.easing, easeInOutCubic),
    onStep: cfg.onStep ?? null,
    formatPeriod: cfg.formatPeriod ?? null,
  };
}

/** Distinct raw `date` values across the rows, ascending. Raw values are kept
 *  as-is (never normalized) so an engine's own `date` comparison semantics
 *  keep working; sorting is numeric when every value coerces to a number. */
export function enumerateDatePeriods(
  rows: Array<{ date?: number | string }>
): Array<number | string> {
  const seen = new Map<string, number | string>();
  for (const row of rows) {
    if (row.date === undefined || row.date === null || row.date === "") continue;
    const key = String(row.date);
    if (!seen.has(key)) seen.set(key, row.date);
  }
  const values = Array.from(seen.values());
  const allNumeric = values.every(v => Number.isFinite(Number(v)));
  return values.sort((a, b) =>
    allNumeric ? Number(a) - Number(b) : String(a).localeCompare(String(b))
  );
}

/** Rows belonging to the active period (rows without a date always stay). */
export function filterRowsToPeriod<T extends { date?: number | string }>(
  rows: T[],
  period: number | string
): T[] {
  return rows.filter(
    row => row.date === undefined || row.date === null || String(row.date) === String(period)
  );
}

// ---- Per-engine timeline lifecycle (controller + built-in control) ----

export interface EngineTimeline {
  /** Call at the top of render(). Returns the period-filtered dataSet and the
   *  effective filter (the user's filter with its own `date` neutralized while
   *  the timeline owns period selection). (Re)creates the controller when the
   *  period list changes; preserves the active index across data updates. */
  beforeRender<T extends { date?: number | string }>(
    cfg: ResolvedTimeline | null,
    dataSet: T[],
    filter: Filter | undefined
  ): { dataSet: T[]; filter: Filter | undefined };
  /** Call at the end of render(): mounts/updates or removes the built-in control. */
  afterRender(host: HTMLElement, cfg: ResolvedTimeline | null): void;
  controller(): TimelineController | null;
  destroy(): void;
}

export function createEngineTimeline(deps: {
  ticker?: Ticker;
  requestRender: () => void;
}): EngineTimeline {
  const ticker = deps.ticker ?? defaultTicker();
  const refs = createTimelineControlRefs();
  let tl: TimelineController | null = null;
  let index = 0;
  let periodsSig = "";
  let activeCfg: ResolvedTimeline | null = null;
  let autoplayed = false;

  const teardown = (): void => {
    tl?.destroy();
    tl = null;
    periodsSig = "";
  };

  return {
    beforeRender(cfg, dataSet, filter) {
      activeCfg = cfg;
      const periods = cfg ? enumerateDatePeriods(dataSet) : [];
      if (!cfg || periods.length === 0) {
        teardown();
        return { dataSet, filter };
      }
      const sig = periods.map(String).join("|");
      if (!tl || sig !== periodsSig) {
        const firstCreation = !tl;
        teardown();
        periodsSig = sig;
        // First mount honors a filter.date starting period; later re-creations
        // (data updates) keep the current position, clamped.
        let startIndex = Math.min(index, periods.length - 1);
        if (firstCreation && filter?.date !== undefined && filter.date !== "") {
          const fromFilter = periods.findIndex(p => String(p) === String(filter.date));
          if (fromFilter >= 0) startIndex = fromFilter;
        }
        index = startIndex;
        tl = new TimelineController({
          periods,
          speedMs: cfg.speedMs,
          loop: cfg.loop,
          startIndex,
          ticker,
          events: {
            onStep: (period, i) => {
              index = i;
              deps.requestRender();
              activeCfg?.onStep?.(period, i);
            },
            onPlayStateChange: () => {
              syncTimelineControl(refs, tl?.getState() ?? null, activeCfg?.formatPeriod);
            },
          },
        });
      }
      const effFilter: Filter | undefined =
        filter && filter.date !== undefined && filter.date !== ""
          ? { ...filter, date: "" }
          : filter;
      return { dataSet: filterRowsToPeriod(dataSet, periods[index]), filter: effFilter };
    },
    afterRender(host, cfg) {
      applyTimelineControl(host, refs, () => tl, Boolean(cfg && tl && cfg.showControl));
      syncTimelineControl(refs, tl?.getState() ?? null, cfg?.formatPeriod);
      if (cfg?.autoplay && tl && !autoplayed) {
        autoplayed = true;
        tl.play();
      }
    },
    controller: () => tl,
    destroy() {
      teardown();
      refs.root?.remove();
      refs.root = null;
    },
  };
}
