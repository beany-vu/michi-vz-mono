// Renderer-agnostic semantic context for SymbolMap. Derived from the PROCESSED
// data + render model (not the DOM), so SVG and canvas produce identical
// context. Stats separate the three populations that matter for this chart:
// invalid (dropped for bad coordinates), hidden (excluded by radiusVisibleMin),
// and visible (actually drawn) - so a consumer/LLM can tell "no data" apart from
// "data present but filtered out".
import { buildLegendData } from "./legend";
import type { SymbolMapMark } from "../symbolMap/renderModel";
import type { SymbolMapChartContext, SymbolMapSymbolContext } from "../types";

export interface BuildSymbolMapContextInput {
  title?: string;
  renderer: "svg" | "canvas" | "webgpu";
  projection: string;
  locatedCount: number;
  invalidCount: number;
  symbols: SymbolMapMark[];
  colorsMapping: Record<string, string>;
  disabledItems?: string[];
}

export function buildSymbolMapContext(input: BuildSymbolMapContextInput): SymbolMapChartContext {
  const symbols: SymbolMapSymbolContext[] = input.symbols.map((m) => ({
    id: m.id,
    label: m.label,
    value: m.value,
    valueSecond: m.valueSecond,
    radius: m.radius,
    radiusSecond: m.radiusSecond,
    color: m.fill,
  }));

  let largest: { id: string; label: string; value: number } | null = null;
  let smallest: { id: string; label: string; value: number } | null = null;
  for (const s of symbols) {
    if (!largest || s.value > largest.value) largest = { id: s.id, label: s.label, value: s.value };
    if (!smallest || s.value < smallest.value) smallest = { id: s.id, label: s.label, value: s.value };
  }
  const valueDomain: [number, number] | null = smallest && largest ? [smallest.value, largest.value] : null;

  const visibleCount = symbols.length;
  const hiddenCount = Math.max(0, input.locatedCount - visibleCount);

  const titlePart = input.title ? `"${input.title}" ` : "";
  let summary = `Symbol map ${titlePart}shows ${visibleCount} symbol${visibleCount === 1 ? "" : "s"}`;
  if (hiddenCount > 0) summary += ` (${hiddenCount} hidden below radiusVisibleMin)`;
  if (input.invalidCount > 0) summary += ` (${input.invalidCount} dropped for invalid coordinates)`;
  summary += ".";
  if (largest && smallest && largest.id !== smallest.id) {
    summary += ` Largest: ${largest.label} (${largest.value}). Smallest: ${smallest.label} (${smallest.value}).`;
  }

  const legendData = buildLegendData({
    labels: symbols.map((s) => s.label),
    colorsMapping: input.colorsMapping,
    disabledItems: input.disabledItems,
  });

  return {
    chartType: "symbol-map-chart",
    title: input.title,
    renderer: input.renderer,
    projection: input.projection,
    stats: {
      locatedCount: input.locatedCount,
      visibleCount,
      hiddenCount,
      invalidCount: input.invalidCount,
      valueDomain,
      largest,
      smallest,
    },
    symbols,
    colorsMapping: input.colorsMapping,
    legendData,
    summary,
    a11yTable: {
      headers: ["Label", "Value", "Value (second)"],
      rows: symbols.map((s) => [s.label, s.value, s.valueSecond ?? ""]),
    },
  };
}
