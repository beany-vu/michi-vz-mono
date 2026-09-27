// onDataWarning checks for FountainChart (SPEC section 8, audit fountain #3):
// - the data repairs the resolver makes (non-finite-value, range-excludes-value,
//   sample-outside-range, inverted-range, missing-date, duplicate-date);
// - duplicate-label in snapshot mode (jets with one label share a column);
// - out-of-domain: data or a reference line outside a user yAxisDomain;
// - ignored-option: each prop the redesign removed, and per-item density / lean.
// It checks the user's data, not the view: disabled items are checked too.
import { resolveFountainData, type FountainResolvedJet } from "../fountainChart/data";
import type {
  DataWarning,
  FountainChartProps,
  FountainDataItem,
  FountainReferenceLine,
} from "../types";

/** Props removed from the drawing in core 1.29; still accepted, each reported once. */
export const FOUNTAIN_REMOVED_PROPS = [
  "style",
  "frothLayers",
  "bloomExponent",
  "stemFraction",
  "showDroplets",
  "showMist",
] as const;

type RemovedProp = (typeof FOUNTAIN_REMOVED_PROPS)[number];

const REMOVED_WHY: Record<RemovedProp, string> = {
  style: "there is one look now: stem, fountain, small dots and big dot",
  frothLayers: "the fountain has no froth layers any more",
  bloomExponent: "the fountain's shape is fixed; its top is `high` and its base is `low`",
  stemFraction: "the stem is a fixed-width bar up to the big dot",
  showDroplets: "droplet arcs are gone; `samples` draw one small dot per measurement",
  showMist: "the mist skirt is gone",
};

const names = (labels: string[]): string => {
  const shown = labels.slice(0, 5).map((l) => `"${l}"`);
  const more = labels.length - shown.length;
  return shown.join(", ") + (more > 0 ? ` and ${more} more` : "");
};

/** ignored-option for every removed prop that is set, and for per-item density / lean. */
export function checkFountainOptions(
  props: Pick<FountainChartProps, "dataSet" | RemovedProp>,
): DataWarning[] {
  const warnings: DataWarning[] = [];
  for (const name of FOUNTAIN_REMOVED_PROPS) {
    if (props[name] === undefined || props[name] === null) continue;
    warnings.push({
      type: "ignored-option",
      message: `FountainChart: \`${name}\` is ignored since core 1.29 (${REMOVED_WHY[name]}).`,
    });
  }
  const withField = (field: "density" | "lean"): string[] => {
    const out: string[] = [];
    for (const d of props.dataSet ?? []) {
      if (!d || d[field] === undefined || d[field] === null) continue;
      if (!out.includes(d.label)) out.push(d.label);
    }
    return out;
  };
  const density = withField("density");
  if (density.length > 0) {
    warnings.push({
      type: "ignored-option",
      message: `FountainChart: per-item \`density\` is ignored since core 1.29 (the number of samples shows how much a jet is based on); set on ${names(density)}.`,
    });
  }
  const lean = withField("lean");
  if (lean.length > 0) {
    warnings.push({
      type: "ignored-option",
      message: `FountainChart: per-item \`lean\` is ignored since core 1.29 (use the chart-wide \`drift\` for the Geneva look); set on ${names(lean)}.`,
    });
  }
  return warnings;
}

export interface FountainDomainCheckOptions {
  /** false: ranges and dots are not drawn, so only values are checked (default true) */
  showRange?: boolean;
  /** false: dots are not drawn, so samples are not checked (default true) */
  showSamples?: boolean;
  referenceLines?: ReadonlyArray<FountainReferenceLine>;
}

/**
 * out-of-domain: one warning per jet whose value, range end or sample lies outside a
 * user yAxisDomain (the drawing is clamped to the plot and such dots are not drawn),
 * and one per reference line outside it (not drawn). [] without a user domain.
 */
export function checkFountainDomain(
  jets: ReadonlyArray<FountainResolvedJet>,
  yAxisDomain: [number, number] | undefined,
  o: FountainDomainCheckOptions = {},
): DataWarning[] {
  if (!yAxisDomain) return [];
  const lo = Math.min(yAxisDomain[0], yAxisDomain[1]);
  const hi = Math.max(yAxisDomain[0], yAxisDomain[1]);
  const out = (v: number): boolean => v < lo || v > hi;
  const showRange = o.showRange !== false;
  const showSamples = showRange && o.showSamples !== false;
  const warnings: DataWarning[] = [];
  for (const j of jets) {
    const parts: string[] = [];
    if (out(j.value)) parts.push(`value ${j.value}`);
    if (showRange && j.low !== null && out(j.low)) parts.push(`low ${j.low}`);
    if (showRange && j.high !== null && out(j.high)) parts.push(`high ${j.high}`);
    const samples = showSamples && !j.forecast ? j.samples.filter(out).length : 0;
    if (samples > 0) parts.push(`${samples} sample${samples === 1 ? "" : "s"}`);
    if (parts.length === 0) continue;
    warnings.push({
      type: "out-of-domain",
      label: j.label,
      message: `FountainChart: "${j.label}" has ${parts.join(", ")} outside yAxisDomain [${lo}, ${hi}]; the drawing is clamped to the plot.`,
    });
  }
  for (const line of o.referenceLines ?? []) {
    const v = Number(line.value);
    if (!Number.isFinite(v) || !out(v)) continue;
    warnings.push({
      type: "out-of-domain",
      label: line.label,
      message: `FountainChart: the reference line at ${v} is outside yAxisDomain [${lo}, ${hi}] and is not drawn.`,
    });
  }
  return warnings;
}

/** Every data and option warning for a FountainChart props object. */
export function checkFountainData(props: FountainChartProps): DataWarning[] {
  const dataSet: FountainDataItem[] = Array.isArray(props.dataSet) ? props.dataSet : [];
  if (dataSet.length === 0) {
    return [
      { type: "empty-dataset", message: "FountainChart received an empty dataSet." },
      ...checkFountainOptions(props),
    ];
  }
  const resolved = resolveFountainData(dataSet, { xAxisDataType: props.xAxisDataType });
  const warnings: DataWarning[] = [...resolved.warnings];

  if (resolved.mode === "snapshot") {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const j of resolved.all) {
      if (seen.has(j.label) && !dupes.includes(j.label)) dupes.push(j.label);
      seen.add(j.label);
    }
    for (const label of dupes) {
      warnings.push({
        type: "duplicate-label",
        label,
        message: `FountainChart: duplicate label "${label}" in snapshot mode; its jets share one column. Use unique labels or trend mode.`,
      });
    }
  }

  warnings.push(
    ...checkFountainDomain(resolved.all, props.yAxisDomain, {
      showRange: props.showRange,
      showSamples: props.showSamples,
      referenceLines: props.referenceLines,
    }),
  );
  warnings.push(...checkFountainOptions(props));
  return warnings;
}
