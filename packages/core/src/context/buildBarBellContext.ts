// Renderer-agnostic semantic context for BarBell.
import type { BarBellChartContext, BarBellDataRow, BarBellSeriesContext } from "../types";

const round = (n: number): number => Math.round(n * 100) / 100;

export interface BuildBarBellContextInput {
  title?: string;
  renderer: "svg" | "canvas";
  xAxisDomain: [number, number];
  dataSet: BarBellDataRow[];
  activeKeys: string[];
  dates: string[];
  colorsMapping: Record<string, string>;
}

export function buildBarBellContext(input: BuildBarBellContextInput): BarBellChartContext {
  const series: BarBellSeriesContext[] = input.activeKeys.map((key) => {
    let total = 0;
    for (const row of input.dataSet) total += Number(row[key]) || 0;
    return { key, color: input.colorsMapping[key] ?? "", total: round(total) };
  });
  const grandTotal = round(series.reduce((a, s) => a + s.total, 0));

  const titlePart = input.title ? `"${input.title}" ` : "";
  let largest: BarBellSeriesContext | null = null;
  for (const s of series) if (!largest || s.total > largest.total) largest = s;
  let summary = `Bar-bell chart ${titlePart}with ${series.length} cumulative segment${
    series.length === 1 ? "" : "s"
  } across ${input.dates.length} row${input.dates.length === 1 ? "" : "s"}.`;
  if (largest) summary += ` Largest segment total: ${largest.key} (${largest.total}).`;
  summary += ` Combined total ${grandTotal}.`;

  return {
    chartType: "bar-bell-chart",
    title: input.title,
    renderer: input.renderer,
    xAxis: { domain: input.xAxisDomain },
    yAxis: { labels: input.dates },
    keys: input.activeKeys,
    series,
    stats: { keyCount: series.length, rowCount: input.dates.length, grandTotal },
    colorsMapping: input.colorsMapping,
    summary,
    a11yTable: {
      headers: ["Date", ...input.activeKeys, "Total"],
      rows: input.dataSet.map((row) => {
        const cells: Array<string | number> = [String(row.date)];
        let total = 0;
        for (const key of input.activeKeys) {
          const v = Number(row[key]) || 0;
          cells.push(v);
          total += v;
        }
        cells.push(round(total));
        return cells;
      }),
    },
  };
}
