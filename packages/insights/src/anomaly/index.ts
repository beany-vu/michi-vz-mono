// Anomaly detection over a numeric series. Pure + deterministic — no DOM, no deps,
// no randomness. Three methods: a population z-score, Tukey's IQR fences, and a
// one-step-ahead forecast residual test (reusing computeForecast). The `anomaly()`
// plugin mirrors the forecast plugin: it runs detection on each target Line
// series, emits a `point` Annotation per flagged value, and appends an anomaly
// count sentence to the chart summary.
import type {
  Annotation,
  DataPoint,
  LineChartProps,
  LineDataItem,
  MichiVzPlugin,
} from "@michi-vz/core";
import { computeForecast } from "../forecast/compute";

export type AnomalyMethod = "zscore" | "iqr" | "forecast";

export interface AnomalyPoint {
  index: number;
  value: number;
  /** method-specific severity: |z| (zscore), fence-overshoot / IQR (iqr), |actual-pred|/se (forecast). */
  score: number;
  kind: "high" | "low";
}

export interface AnomalyResult {
  method: AnomalyMethod;
  anomalies: AnomalyPoint[];
  /** the cutoff actually used (z-multiplier, IQR k, or forecast band level). */
  threshold: number;
}

export interface AnomalyOptions {
  method?: AnomalyMethod;
  /** zscore: max |z| (default 3). iqr: fence multiplier k (default 1.5). forecast: ignored. */
  threshold?: number;
  /** opaque hook for a caller-supplied forecast model; reserved (forecast method uses computeForecast). */
  horizonModel?: unknown;
}

const round = (n: number): number => Math.round(n * 100) / 100;

/** Linear-interpolated quantile (q in [0,1]) of a numeric sample. */
function quantile(sorted: number[], q: number): number {
  const n = sorted.length;
  if (n === 0) return NaN;
  if (n === 1) return sorted[0];
  const pos = (n - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  const frac = pos - lo;
  return sorted[lo] * (1 - frac) + sorted[hi] * frac;
}

function detectZScore(values: number[], threshold: number): AnomalyPoint[] {
  const finite = values.filter((v) => Number.isFinite(v));
  const n = finite.length;
  if (n === 0) return [];
  const mean = finite.reduce((a, b) => a + b, 0) / n;
  const variance = finite.reduce((a, b) => a + (b - mean) * (b - mean), 0) / n; // population
  const std = Math.sqrt(variance);
  if (std === 0) return [];
  const out: AnomalyPoint[] = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (!Number.isFinite(v)) continue;
    const z = (v - mean) / std;
    if (Math.abs(z) > threshold) {
      out.push({ index: i, value: v, score: round(Math.abs(z)), kind: z > 0 ? "high" : "low" });
    }
  }
  return out;
}

function detectIqr(values: number[], k: number): AnomalyPoint[] {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return [];
  const sorted = [...finite].sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  const lowFence = q1 - k * iqr;
  const highFence = q3 + k * iqr;
  const out: AnomalyPoint[] = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (!Number.isFinite(v)) continue;
    if (v < lowFence) {
      const score = iqr > 0 ? round((lowFence - v) / iqr) : Infinity;
      out.push({ index: i, value: v, score, kind: "low" });
    } else if (v > highFence) {
      const score = iqr > 0 ? round((v - highFence) / iqr) : Infinity;
      out.push({ index: i, value: v, score, kind: "high" });
    }
  }
  return out;
}

function detectForecast(values: number[]): AnomalyPoint[] {
  const out: AnomalyPoint[] = [];
  for (let i = 2; i < values.length; i++) {
    const v = values[i];
    if (!Number.isFinite(v)) continue;
    const history = values.slice(0, i);
    if (history.filter((x) => Number.isFinite(x)).length < 2) continue;
    const result = computeForecast(history, { method: "holt-winters", horizon: 1 });
    const pred = result.predictions[0];
    const lo = result.lower[0];
    const hi = result.upper[0];
    if (v < lo || v > hi) {
      const score = result.se > 0 ? round(Math.abs(v - pred) / result.se) : Infinity;
      out.push({ index: i, value: v, score, kind: v > pred ? "high" : "low" });
    }
  }
  return out;
}

/**
 * Flag outliers in `values`. Default "zscore" uses a population standard
 * deviation; "iqr" uses Tukey fences with k=`threshold`; "forecast" walks the
 * series and tests each point against a one-step-ahead Holt band.
 */
export function detectAnomalies(values: number[], opts: AnomalyOptions = {}): AnomalyResult {
  const method = opts.method ?? "zscore";
  if (method === "iqr") {
    const k = opts.threshold ?? 1.5;
    return { method, anomalies: detectIqr(values, k), threshold: k };
  }
  if (method === "forecast") {
    return { method, anomalies: detectForecast(values), threshold: 0.95 };
  }
  const z = opts.threshold ?? 3;
  return { method, anomalies: detectZScore(values, z), threshold: z };
}

// ---- Plugin ----

export interface AnomalyPluginOptions {
  method?: AnomalyMethod;
  threshold?: number;
  /** restrict to these series labels; default scans every series. */
  target?: string | string[];
}

function numericDates(series: DataPoint[]): number[] | null {
  const xs = series.map((d) => (typeof d.date === "number" ? d.date : Number(d.date)));
  return xs.every((x) => Number.isFinite(x)) ? xs : null;
}

interface SeriesAnomalies {
  result: AnomalyResult;
  series: DataPoint[];
}

/**
 * The `anomaly()` plugin: detects outliers in each target Line series, draws a
 * `point` Annotation at every flagged (date, value), and appends an anomaly count
 * sentence to ctx.summary (line-chart only). Detection runs in transformData and
 * is cached so annotate()/enrichContext() reuse the same pass (like forecast()).
 */
export function anomaly(options: AnomalyPluginOptions = {}): MichiVzPlugin<LineChartProps> {
  const method = options.method ?? "zscore";
  const threshold = options.threshold;
  const targets =
    options.target == null
      ? null
      : new Set(Array.isArray(options.target) ? options.target : [options.target]);
  const isTarget = (label: string): boolean => targets == null || targets.has(label);

  const results = new Map<string, SeriesAnomalies>();

  const run = (dataSet: LineDataItem[]): void => {
    results.clear();
    for (const item of dataSet) {
      if (!isTarget(item.label) || item.series.length < 2) continue;
      const values = item.series.map((d) => d.value);
      if (values.filter((v) => Number.isFinite(v)).length < 2) continue;
      const result = detectAnomalies(values, { method, threshold });
      if (result.anomalies.length > 0) results.set(item.label, { result, series: item.series });
    }
  };

  return {
    name: "anomaly",

    transformData(props) {
      // detection only — never mutates the data; just refreshes the cache.
      run(props.dataSet);
      return props;
    },

    annotate(ctx) {
      if (ctx.chartType !== "line-chart") return [];
      if (results.size === 0) return [];
      const anns: Annotation[] = [];
      for (const [label, sa] of results) {
        for (const a of sa.result.anomalies) {
          const point = sa.series[a.index];
          if (!point) continue;
          const at = typeof point.date === "number" ? point.date : Number(point.date);
          if (!Number.isFinite(at)) continue;
          anns.push({
            type: "point",
            at,
            value: point.value,
            label: `${label} anomaly (${a.kind})`,
          });
        }
      }
      return anns;
    },

    enrichContext(ctx) {
      if (ctx.chartType !== "line-chart" || results.size === 0) return ctx;
      let total = 0;
      const parts: string[] = [];
      for (const [label, sa] of results) {
        const count = sa.result.anomalies.length;
        total += count;
        parts.push(`${count} in ${label}`);
      }
      const noun = total === 1 ? "anomaly" : "anomalies";
      return {
        ...ctx,
        summary: `${ctx.summary} Anomalies (${method}): ${total} ${noun} detected (${parts.join(", ")}).`,
      };
    },
  };
}
