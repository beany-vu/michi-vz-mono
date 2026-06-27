// Renderer-agnostic semantic context for FanChart. Derived from the data model
// (history + median forecast line + nested bands), so identical in SVG and canvas.
import type { FanChartContext, FanDataItem, FanSeriesContext, XaxisDataType } from "../types";

const round = (n: number): number => Math.round(n * 100) / 100;

export interface BuildFanContextInput {
  title?: string;
  renderer: "svg" | "canvas";
  xAxisDataType: XaxisDataType;
  xAxisDomain: [number, number];
  yAxisDomain: [number, number];
  dataSet: FanDataItem[];
  colorsMapping: Record<string, string>;
}

function seriesContext(item: FanDataItem, colorsMapping: Record<string, string>): FanSeriesContext {
  const pts = item.series;
  const historyCount = pts.filter((d) => d.certainty !== false).length;
  const forecastCount = pts.length - historyCount;
  const lastPt = pts.length ? pts[pts.length - 1] : null;
  const bandLevels = item.bands.map((b) => b.level).sort((a, b) => a - b);

  let finalUncertainty: number | null = null;
  if (item.bands.length > 0) {
    const widest = item.bands.reduce((m, b) => (b.level > m.level ? b : m), item.bands[0]);
    const lastBp = widest.series[widest.series.length - 1];
    if (lastBp) finalUncertainty = round((lastBp.valueMax - lastBp.valueMin) / 2);
  }

  return {
    label: item.label,
    color: colorsMapping[item.label] ?? item.color ?? "",
    pointCount: pts.length,
    historyCount,
    forecastCount,
    last: lastPt ? { x: lastPt.date, y: round(lastPt.value) } : null,
    bandLevels,
    finalUncertainty,
  };
}

export function buildFanContext(input: BuildFanContextInput): FanChartContext {
  const series = input.dataSet.map((d) => seriesContext(d, input.colorsMapping));
  const forecastHorizon = series.reduce((m, s) => Math.max(m, s.forecastCount), 0);

  const titlePart = input.title ? `"${input.title}" ` : "";
  let summary = `Fan chart ${titlePart}with ${series.length} series, a ${forecastHorizon}-step forecast.`;
  const lead = series.find((s) => s.last);
  if (lead && lead.last) {
    summary += ` ${lead.label} projected to ${lead.last.y} by ${String(lead.last.x)}`;
    if (lead.finalUncertainty != null) summary += ` (±${lead.finalUncertainty})`;
    summary += ".";
  }

  return {
    chartType: "fan-chart",
    title: input.title,
    renderer: input.renderer,
    xAxis: { type: input.xAxisDataType, domain: input.xAxisDomain },
    yAxis: { domain: input.yAxisDomain },
    series,
    stats: { seriesCount: series.length, forecastHorizon },
    colorsMapping: input.colorsMapping,
    summary,
    a11yTable: {
      headers: ["Series", "History", "Forecast", "Last", "± at end"],
      rows: series.map((s) => [
        s.label,
        s.historyCount,
        s.forecastCount,
        s.last ? s.last.y : "—",
        s.finalUncertainty ?? "—",
      ]),
    },
  };
}
