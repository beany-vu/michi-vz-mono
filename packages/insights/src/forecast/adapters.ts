// Per-chart forecast adapters. The forecast MATH is generic (computeForecast on any
// numeric series); each adapter just knows how to (a) read the time-series out of a
// given chart's data shape and (b) write the predicted continuation back. The
// forecast() plugin dispatches on chartType. Line is handled directly in the plugin
// (it has the rich extras); these cover Range / Area / Ribbon / BarBell / Stack.
import { computeForecast, type ForecastMethod } from "./compute";

const round = (n: number): number => Math.round(n * 100) / 100;

export interface AdapterOptions {
  method: ForecastMethod;
  horizon: number;
  level: number;
}

export interface ForecastAdapter {
  chartType: string;
  /** native uncertainty visual (certainty/band)? false → caller may add a forecast-zone cue. */
  hasUncertaintyVisual: boolean;
  /** append the predicted continuation; returns new props (same shape). */
  apply(props: Record<string, unknown>, opts: AdapterOptions): Record<string, unknown>;
}

/** Median consecutive step over a numeric x-axis. */
function medianStep(nums: number[]): number {
  if (nums.length < 2) return 1;
  const diffs: number[] = [];
  for (let i = 1; i < nums.length; i++) diffs.push(nums[i] - nums[i - 1]);
  diffs.sort((a, b) => a - b);
  return diffs[Math.floor(diffs.length / 2)] || 1;
}

/** Future x-values, preserving number-vs-string type of the original axis. Empty if non-numeric. */
function futureDates(xsRaw: Array<number | string | null>, horizon: number): Array<number | string> {
  const nums = xsRaw.map((x) => (typeof x === "number" ? x : Number(x)));
  if (!nums.every((n) => Number.isFinite(n))) return [];
  const step = medianStep(nums);
  const lastNum = nums[nums.length - 1];
  const asString = typeof xsRaw[xsRaw.length - 1] === "string";
  return Array.from({ length: horizon }, (_, h) => {
    const v = lastNum + step * (h + 1);
    return asString ? String(v) : v;
  });
}

type Row = Record<string, unknown>;

/** Keys to forecast for a "rows with category keys" chart. */
function rowKeys(props: Record<string, unknown>, firstRow: Row | undefined): string[] {
  const declared = props.keys as string[] | undefined;
  if (declared && declared.length) return declared;
  if (!firstRow) return [];
  return Object.keys(firstRow).filter((k) => k !== "date" && k !== "code");
}

/** Area / Ribbon / BarBell: rows of { date, [key]: number } under `field`. */
function rowsAdapter(chartType: string, field: string): ForecastAdapter {
  return {
    chartType,
    hasUncertaintyVisual: false,
    apply(props, opts) {
      const rows = (props[field] as Row[]) ?? [];
      if (rows.length < 2) return props;
      const fdates = futureDates(rows.map((r) => r.date as number | string), opts.horizon);
      if (!fdates.length) return props;

      const keys = rowKeys(props, rows[0]);
      const future: Row[] = fdates.map((d) => ({ date: d }));
      for (const key of keys) {
        const values = rows.map((r) => Number(r[key]) || 0);
        const r = computeForecast(values, { method: opts.method, horizon: opts.horizon, level: opts.level });
        r.predictions.forEach((yhat, h) => {
          future[h][key] = round(yhat);
        });
      }
      return { ...props, [field]: [...rows, ...future] };
    },
  };
}

/** Range: forecast each item's median, append RangeDataPoints with widening band (certainty:false). */
const rangeAdapter: ForecastAdapter = {
  chartType: "range-chart",
  hasUncertaintyVisual: true,
  apply(props, opts) {
    const dataSet = (props.dataSet as Array<{ label: string; color?: string; series: Array<Record<string, unknown>> }>).map((item) => {
      const pts = item.series;
      if (pts.length < 2) return item;
      const fdates = futureDates(pts.map((p) => p.date as number | string), opts.horizon);
      if (!fdates.length) return item;
      const values = pts.map((p) =>
        typeof p.valueMedium === "number" ? p.valueMedium : (Number(p.valueMin) + Number(p.valueMax)) / 2
      );
      const r = computeForecast(values, { method: opts.method, horizon: opts.horizon, level: opts.level });
      const future = r.predictions.map((yhat, h) => ({
        date: fdates[h],
        valueMin: round(r.lower[h]),
        valueMax: round(r.upper[h]),
        valueMedium: round(yhat),
        certainty: false,
      }));
      return { ...item, series: [...pts, ...future] };
    });
    return { ...props, dataSet };
  },
};

/** VerticalStackBar: dataSet of { seriesKey, series: [{ date, [key]: number }] }. */
const stackAdapter: ForecastAdapter = {
  chartType: "vertical-stack-bar-chart",
  hasUncertaintyVisual: false,
  apply(props, opts) {
    const dataSet = (props.dataSet as Array<{ seriesKey: string; series: Row[] }>).map((sk) => {
      const rows = sk.series;
      if (rows.length < 2) return sk;
      const fdates = futureDates(rows.map((r) => r.date as number | string | null), opts.horizon);
      if (!fdates.length) return sk;
      const keys = rowKeys(props, rows[0]);
      const future: Row[] = fdates.map((d) => ({ date: String(d) }));
      for (const key of keys) {
        const values = rows.map((r) => Number(r[key]) || 0);
        const r = computeForecast(values, { method: opts.method, horizon: opts.horizon, level: opts.level });
        r.predictions.forEach((yhat, h) => {
          future[h][key] = round(yhat);
        });
      }
      return { ...sk, series: [...rows, ...future] };
    });
    return { ...props, dataSet };
  },
};

const ADAPTERS: Record<string, ForecastAdapter> = {
  "range-chart": rangeAdapter,
  "area-chart": rowsAdapter("area-chart", "series"),
  "ribbon-chart": rowsAdapter("ribbon-chart", "series"),
  "bar-bell-chart": rowsAdapter("bar-bell-chart", "dataSet"),
  "vertical-stack-bar-chart": stackAdapter,
};

/** The forecast adapter for a chart type, or null (line is handled in the plugin). */
export function getForecastAdapter(chartType: string): ForecastAdapter | null {
  return ADAPTERS[chartType] ?? null;
}

/** Chart types that the forecast() plugin can extend (besides line/fan). */
export const FORECASTABLE_CHARTS = Object.keys(ADAPTERS);
