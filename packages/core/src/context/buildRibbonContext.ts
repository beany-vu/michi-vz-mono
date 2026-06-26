// Renderer-agnostic semantic context for RibbonChart.
import type { RibbonChartContext, RibbonDataRow, RibbonSeriesContext } from "../types";

const round = (n: number): number => Math.round(n * 100) / 100;

export interface BuildRibbonContextInput {
  title?: string;
  renderer: "svg" | "canvas";
  series: RibbonDataRow[];
  activeKeys: string[];
  dates: string[];
  yAxisDomain: [number, number];
  colorsMapping: Record<string, string>;
}

export function buildRibbonContext(input: BuildRibbonContextInput): RibbonChartContext {
  const series: RibbonSeriesContext[] = input.activeKeys.map((key) => {
    let total = 0;
    for (const row of input.series) total += Number(row[key]) || 0;
    return { key, color: input.colorsMapping[key] ?? "", total: round(total) };
  });
  const grandTotal = round(series.reduce((a, s) => a + s.total, 0));

  const titlePart = input.title ? `"${input.title}" ` : "";
  let largest: RibbonSeriesContext | null = null;
  for (const s of series) if (!largest || s.total > largest.total) largest = s;
  let summary = `Ribbon chart ${titlePart}with ${series.length} stacked series across ${input.dates.length} date${
    input.dates.length === 1 ? "" : "s"
  }.`;
  if (largest) summary += ` Largest series: ${largest.key} (total ${largest.total}).`;
  summary += ` Combined total ${grandTotal}.`;

  return {
    chartType: "ribbon-chart",
    title: input.title,
    renderer: input.renderer,
    xAxis: { domain: input.dates },
    yAxis: { domain: input.yAxisDomain },
    keys: input.activeKeys,
    series,
    stats: { keyCount: series.length, dateCount: input.dates.length, grandTotal },
    colorsMapping: input.colorsMapping,
    summary,
    a11yTable: {
      headers: ["Date", ...input.activeKeys, "Total"],
      rows: input.series.map((row) => {
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
