// The `forecast()` plugin: appends a dashed (certainty:false) prediction tail to
// each target Line series, optional what-if scenario lines and a regression
// trendline, a threshold/goal line + "fall point" via the annotate() hook, and a
// forecast sentence (with accuracy + breach) into the chart summary — which flows
// to the a11y mirror + dataprocessed event for free.
//
// Statistical only — zero model download. Works on numeric x-axes (incl. annual
// year numbers); series with non-numeric x are left untouched (MVP limitation).
import type {
  Annotation,
  DataPoint,
  FanBand,
  FanDataItem,
  LineChartProps,
  LineDataItem,
  MichiVzPlugin,
  RangeDataItem,
  RangeDataPoint,
} from "@michi-vz/core";
import { computeForecast, type ForecastMethod, type ForecastOptions, type ForecastResult } from "./compute";
import { linearFit } from "./methods";
import { getForecastAdapter } from "./adapters";

/** A what-if scenario: `growth` compounds per forecast step (e.g. +0.15 = +15%/step). */
export interface ScenarioSpec {
  name: string;
  growth: number;
}

/** A reference/goal line; the plugin marks where the forecast crosses it. */
export interface ThresholdSpec {
  value: number;
  label?: string;
}

/** Fired (on change) when the forecast is projected to cross a threshold. */
export interface ThresholdBreach {
  label: string;
  value: number;
  /** the x-position of the projected crossing. */
  at: number;
}

export interface ForecastPluginOptions {
  method?: ForecastMethod;
  /** number of future points to predict (default 4). */
  horizon?: number;
  /** primary confidence level for the band (default 0.95). */
  level?: number;
  /** extra nested levels reported in the result/fan helper, e.g. [0.5, 0.8]. */
  levels?: number[];
  /** restrict to these series labels; default forecasts every series. */
  target?: string | string[];
  /** what-if scenarios, each drawn as an extra dashed series. */
  scenarios?: ScenarioSpec[];
  /** overlay a least-squares trendline over the historical series. */
  trendline?: boolean;
  /** a goal/threshold line + a marked "fall point" where the forecast crosses it. */
  threshold?: ThresholdSpec;
  /** fired (on change) when a forecast is projected to cross `threshold` — for alerting. */
  onThresholdBreach?: (breach: ThresholdBreach) => void;
  /** shade the forecast region (a faint zone highlighting prediction vs actual). Default true. */
  zone?: boolean;
}

const round = (n: number): number => Math.round(n * 100) / 100;

function numericDates(series: DataPoint[]): number[] | null {
  const xs = series.map((d) => (typeof d.date === "number" ? d.date : Number(d.date)));
  return xs.every((x) => Number.isFinite(x)) ? xs : null;
}

/** Median consecutive step of a numeric x-axis (used to space predicted points). */
function stepOf(xs: number[]): number {
  if (xs.length < 2) return 1;
  const diffs: number[] = [];
  for (let i = 1; i < xs.length; i++) diffs.push(xs[i] - xs[i - 1]);
  diffs.sort((a, b) => a - b);
  return diffs[Math.floor(diffs.length / 2)] || 1;
}

interface SeriesForecast {
  result: ForecastResult;
  lastX: number;
  lastValue: number;
  step: number;
}

/** First x where the path lastValue→predictions crosses `level` (linear interp), or null. */
function crossingX(sf: SeriesForecast, level: number): number | null {
  let prevX = sf.lastX;
  let prevY = sf.lastValue;
  for (let h = 0; h < sf.result.predictions.length; h++) {
    const x = sf.lastX + sf.step * (h + 1);
    const y = sf.result.predictions[h];
    if (prevY === level) return prevX;
    if ((prevY - level) * (y - level) < 0) {
      const t = (level - prevY) / (y - prevY);
      return prevX + (x - prevX) * t;
    }
    prevX = x;
    prevY = y;
  }
  return null;
}

// forecast() works across chart types (line + the adapter charts: range/area/stack/
// ribbon/bar-bell), so it is typed loosely to be assignable to any chart's plugin list.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function forecast(options: ForecastPluginOptions = {}): MichiVzPlugin<any> {
  const horizon = Math.max(1, Math.floor(options.horizon ?? 4));
  const level = options.level ?? 0.95;
  const levels = options.levels;
  const method = options.method ?? "holt-winters";
  const scenarios = options.scenarios ?? [];
  const trendline = options.trendline ?? false;
  const threshold = options.threshold;
  const onThresholdBreach = options.onThresholdBreach;
  const showZone = options.zone ?? true;
  const targets =
    options.target == null
      ? null
      : new Set(Array.isArray(options.target) ? options.target : [options.target]);
  const isTarget = (label: string): boolean => targets == null || targets.has(label);

  const results = new Map<string, SeriesForecast>();
  let lastBreachKey = "";
  let lastAdapterHorizon = 0;

  return {
    name: "forecast",

    transformData(props, pc) {
      // Non-line charts dispatch to a per-chart adapter that appends predicted data.
      const adapter =
        pc?.chartType && pc.chartType !== "line-chart" ? getForecastAdapter(pc.chartType) : null;
      if (adapter) {
        lastAdapterHorizon = horizon;
        return adapter.apply(props, { method, horizon, level });
      }
      lastAdapterHorizon = 0;
      results.clear();
      const lp = props as LineChartProps;
      const extra: LineDataItem[] = [];

      const dataSet: LineDataItem[] = lp.dataSet.map((item) => {
        if (!isTarget(item.label) || item.series.length < 2) return item;
        const xs = numericDates(item.series);
        if (!xs) return item; // non-numeric x — can't extrapolate (MVP limitation)
        const values = item.series.map((d) => d.value);
        if (values.filter((v) => Number.isFinite(v)).length < 2) return item;

        const result = computeForecast(values, { method, horizon, level, levels });
        const step = stepOf(xs);
        const lastX = xs[xs.length - 1];
        const lastValue = values[values.length - 1];
        results.set(item.label, { result, lastX, lastValue, step });

        // Predicted points are certainty:false → the renderer draws them dashed.
        const predicted: DataPoint[] = result.predictions.map((v, h) => ({
          date: lastX + step * (h + 1),
          value: round(v),
          certainty: false,
        }));

        // What-if scenario lines fork from the last real point.
        for (const sc of scenarios) {
          const scSeries: DataPoint[] = [
            { date: lastX, value: round(lastValue), certainty: true },
            ...result.predictions.map((v, h) => ({
              date: lastX + step * (h + 1),
              value: round(v * Math.pow(1 + sc.growth, h + 1)),
              certainty: false,
            })),
          ];
          extra.push({ label: `${item.label} (${sc.name})`, series: scSeries });
        }

        // Regression trendline over the historical series (2-point overlay).
        if (trendline) {
          const { slope, intercept } = linearFit(values);
          extra.push({
            label: `${item.label} (trend)`,
            series: [
              { date: xs[0], value: round(intercept), certainty: true },
              { date: lastX, value: round(slope * (values.length - 1) + intercept), certainty: true },
            ],
          });
        }

        return { ...item, series: [...item.series, ...predicted] };
      });

      // Fire the alerting hook when the set of projected breaches changes.
      if (threshold && onThresholdBreach) {
        const breaches: ThresholdBreach[] = [];
        for (const [label, sf] of results) {
          const cx = crossingX(sf, threshold.value);
          if (cx != null) breaches.push({ label, value: threshold.value, at: round(cx) });
        }
        const key = JSON.stringify(breaches);
        if (key !== lastBreachKey) {
          lastBreachKey = key;
          for (const b of breaches) onThresholdBreach(b);
        }
      }

      return { ...lp, dataSet: [...dataSet, ...extra] };
    },

    enrichContext(ctx) {
      if (ctx.chartType !== "line-chart") {
        // adapter charts: a generic forecast note (the appended data is the forecast).
        if (lastAdapterHorizon > 0 && getForecastAdapter(ctx.chartType)) {
          return { ...ctx, summary: `${ctx.summary} Forecast extended ${lastAdapterHorizon} periods.` };
        }
        return ctx;
      }
      if (results.size === 0) return ctx;
      const parts: string[] = [];
      for (const [label, sf] of results) {
        const endX = sf.lastX + sf.step * horizon;
        const last = round(sf.result.predictions[sf.result.predictions.length - 1]);
        const acc =
          sf.result.accuracy.mape != null
            ? `MAPE ${round(sf.result.accuracy.mape)}%`
            : `RMSE ${round(sf.result.accuracy.rmse)}`;
        let s = `${label} projected to ${last} by ${endX} (${sf.result.method}, ${acc})`;
        if (threshold) {
          const cx = crossingX(sf, threshold.value);
          if (cx != null) s += `, crosses ${threshold.label ?? threshold.value} around ${round(cx)}`;
        }
        parts.push(s);
      }
      return { ...ctx, summary: `${ctx.summary} Forecast: ${parts.join("; ")}.` };
    },

    annotate(ctx) {
      if (ctx.chartType !== "line-chart" || results.size === 0) return [];
      const anns: Annotation[] = [];

      // Forecast zone: a faint full-height band shading the predicted x-range, from the
      // earliest "last real point" to the furthest forecast end.
      let boundary = Infinity;
      let end = -Infinity;
      for (const [, sf] of results) {
        boundary = Math.min(boundary, sf.lastX);
        end = Math.max(end, sf.lastX + sf.step * horizon);
      }
      if (showZone && Number.isFinite(boundary) && end > boundary) {
        anns.push({ type: "xband", at: boundary, at2: end, label: "forecast", color: "#64748b", opacity: 0.1 });
      }

      // Threshold/goal line + the "fall point" where the forecast crosses it.
      if (threshold) {
        anns.push({ type: "hline", value: threshold.value, label: threshold.label ?? `Target ${threshold.value}`, dashed: true });
        for (const [, sf] of results) {
          const cx = crossingX(sf, threshold.value);
          if (cx != null) anns.push({ type: "point", at: round(cx), value: threshold.value, label: "fall point" });
        }
      }
      return anns;
    },
  };
}

/**
 * Fan-chart helper — turn a Line series into nested RangeChart bands (NO new chart
 * type: RangeChart already fills a valueMin..valueMax band + a median line). Returns
 * one RangeDataItem per confidence level, widest first so narrower bands paint on top.
 */
export function forecastFanBands(
  series: DataPoint[],
  opts: ForecastPluginOptions = {},
  baseLabel = "forecast"
): RangeDataItem[] {
  const xs = numericDates(series);
  if (!xs) return [];
  const values = series.map((d) => d.value);
  if (values.filter((v) => Number.isFinite(v)).length < 2) return [];

  const horizon = Math.max(1, Math.floor(opts.horizon ?? 4));
  const computeOpts: ForecastOptions = {
    method: opts.method ?? "holt-winters",
    horizon,
    level: opts.level ?? 0.95,
    levels: opts.levels,
  };
  const result = computeForecast(values, computeOpts);
  const step = stepOf(xs);
  const lastX = xs[xs.length - 1];

  // widest band first
  const bands = [...result.bands].sort((a, b) => b.level - a.level);
  return bands.map((band) => {
    const points: RangeDataPoint[] = result.predictions.map((p, h) => ({
      date: lastX + step * (h + 1),
      valueMin: round(band.lower[h]),
      valueMax: round(band.upper[h]),
      valueMedium: round(p),
      certainty: false,
    }));
    return { label: `${baseLabel} ${Math.round(band.level * 100)}%`, series: points };
  });
}

/**
 * Build ready-to-render FanChart data from a history series: the line is the
 * history (solid) + the forecast median (dashed), and `bands` are the nested
 * confidence intervals (each anchored at the last actual so the fan opens from it).
 * Feed the result straight into `mountFanChart`.
 */
export function forecastFan(
  history: DataPoint[],
  options: ForecastPluginOptions = {},
  label = "series"
): FanDataItem {
  const xs = numericDates(history);
  const values = history.map((d) => d.value);
  if (!xs || values.filter((v) => Number.isFinite(v)).length < 2) {
    return { label, series: history, bands: [] };
  }
  const horizon = Math.max(1, Math.floor(options.horizon ?? 4));
  const result = computeForecast(values, {
    method: options.method ?? "holt-winters",
    horizon,
    level: options.level ?? 0.95,
    levels: options.levels,
  });
  const step = stepOf(xs);
  const lastX = xs[xs.length - 1];
  const lastValue = round(values[values.length - 1]);

  const median: DataPoint[] = result.predictions.map((v, h) => ({
    date: lastX + step * (h + 1),
    value: round(v),
    certainty: false,
  }));

  const bands: FanBand[] = result.bands.map((b) => {
    const anchor: RangeDataPoint = {
      date: lastX,
      valueMin: lastValue,
      valueMax: lastValue,
      valueMedium: lastValue,
      certainty: false,
    };
    const series: RangeDataPoint[] = result.predictions.map((p, h) => ({
      date: lastX + step * (h + 1),
      valueMin: round(b.lower[h]),
      valueMax: round(b.upper[h]),
      valueMedium: round(p),
      certainty: false,
    }));
    return { level: b.level, series: [anchor, ...series] };
  });

  return { label, series: [...history, ...median], bands };
}

export { getForecastAdapter, FORECASTABLE_CHARTS, type ForecastAdapter } from "./adapters";
export { computeForecast } from "./compute";
export { linearFit, linearForecast, holtForecast } from "./methods";
export { decompose, detectPeriod, type Decomposition } from "./seasonal";
export { detectChangepoints, type Changepoint, type ChangepointOptions } from "./changepoint";
export { monteCarloForecast, type MonteCarloResult, type MonteCarloOptions } from "./montecarlo";
export { requiredGrowth, requiredRunRate, pacingToGoal, type Pacing } from "./goalseek";
export type { ForecastMethod, ForecastOptions, ForecastResult, ForecastBand } from "./compute";
export type { Accuracy } from "./accuracy";
