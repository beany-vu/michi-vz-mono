// Renderer-agnostic semantic context for VerticalStackBar. Derived from the
// render model (not the DOM), so SVG and canvas produce identical context. Also
// absorbs the legacy ChartMetadata fields (xAxis domain, visibleItems, legend,
// renderedData) so nothing is lost.
import type {
  StackLegendItem,
  StackRectData,
  StackSeriesContext,
  VerticalStackBarChartContext,
} from "../types";

const round = (n: number): number => Math.round(n * 100) / 100;

export interface BuildStackContextInput {
  title?: string;
  renderer: "svg" | "canvas";
  dates: string[];
  keys: string[];
  stackedRectData: Record<string, StackRectData[]>;
  visibleItems: string[];
  legend: StackLegendItem[];
  colorsMapping: Record<string, string>;
  yAxisDomain: [number, number];
}

export function buildStackContext(input: BuildStackContextInput): VerticalStackBarChartContext {
  const { dates, keys, stackedRectData } = input;

  const series: StackSeriesContext[] = keys.map((key) => {
    const rects = stackedRectData[key] ?? [];
    const byDate = dates.map((date) => {
      const rect = rects.find((r) => r.date === date);
      const value = rect && !rect.isMissing ? rect.value : null;
      return { date, value, isMissing: !!rect?.isMissing };
    });
    const total = byDate.reduce((a, b) => a + (b.value ?? 0), 0);
    return { key, color: input.colorsMapping[key] ?? "", total: round(total), byDate };
  });

  // per-date totals + largest segment
  let largestSegment: { key: string; date: string; value: number } | null = null;
  const perDateTotals = dates.map((date) => {
    let total = 0;
    for (const key of keys) {
      const rect = (stackedRectData[key] ?? []).find((r) => r.date === date);
      const v = rect && !rect.isMissing ? rect.value ?? 0 : 0;
      total += v;
      if (v > 0 && (!largestSegment || v > largestSegment.value)) {
        largestSegment = { key, date, value: round(v) };
      }
    }
    return { date, total: round(total) };
  });
  const grandTotal = round(perDateTotals.reduce((a, b) => a + b.total, 0));
  let largestDate: { date: string; total: number } | null = null;
  for (const pd of perDateTotals) if (!largestDate || pd.total > largestDate.total) largestDate = pd;

  const titlePart = input.title ? `"${input.title}" ` : "";
  let summary = `Stacked bar chart ${titlePart}with ${keys.length} segment${
    keys.length === 1 ? "" : "s"
  } across ${dates.length} date${dates.length === 1 ? "" : "s"}.`;
  if (largestDate) summary += ` Largest total: ${largestDate.date} (${largestDate.total}).`;
  if (largestSegment) {
    const ls = largestSegment as { key: string; date: string; value: number };
    summary += ` Largest segment: ${ls.key} on ${ls.date} (${ls.value}).`;
  }

  return {
    chartType: "vertical-stack-bar-chart",
    title: input.title,
    renderer: input.renderer,
    xAxis: { type: "band", domain: dates },
    yAxis: { domain: input.yAxisDomain },
    keys,
    visibleItems: input.visibleItems,
    series,
    legend: input.legend,
    stats: {
      seriesCount: keys.length,
      dateCount: dates.length,
      grandTotal,
      perDateTotals,
      largestSegment,
    },
    colorsMapping: input.colorsMapping,
    summary,
    a11yTable: {
      headers: ["Date", ...keys, "Total"],
      rows: dates.map((date) => {
        const cells: Array<string | number> = [date];
        let total = 0;
        for (const key of keys) {
          const rect = (stackedRectData[key] ?? []).find((r) => r.date === date);
          if (rect && !rect.isMissing && rect.value !== null) {
            cells.push(rect.value);
            total += rect.value;
          } else {
            cells.push("—");
          }
        }
        cells.push(round(total));
        return cells;
      }),
    },
  };
}
