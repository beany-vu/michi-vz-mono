// Named sequential colour schemes, so a consumer can build a choropleth
// `colorScale.range` (or any light-to-dark encoding) without depending on d3.
//
// Colours: ColorBrewer 2.0 single-hue sequential schemes (https://colorbrewer2.org),
// by Cynthia A. Brewer, Geography, Pennsylvania State University. Licensed under the
// Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0). The k = 3..9
// lists below are exactly the ones d3-scale-chromatic ships as schemeBlues[k],
// schemeGreens[k], schemeGreys[k], schemeOranges[k], schemePurples[k] and
// schemeReds[k] (lowercase "#rrggbb", as d3 returns them).

/** Names accepted by {@link sequentialScheme}, lightest-first single-hue ramps. */
export const SEQUENTIAL_SCHEME_NAMES = Object.freeze([
  "blues",
  "greens",
  "greys",
  "oranges",
  "purples",
  "reds",
] as const);

/** A ColorBrewer single-hue sequential scheme name. */
export type SequentialSchemeName = (typeof SEQUENTIAL_SCHEME_NAMES)[number];

const MIN_COUNT = 3;
const MAX_COUNT = 9;

// SCHEMES[name][k - 3] is the k-colour list, light to dark (one row per k).
// prettier-ignore
const SCHEMES: Record<SequentialSchemeName, readonly (readonly string[])[]> = {
  blues: [
    ["#deebf7", "#9ecae1", "#3182bd"],
    ["#eff3ff", "#bdd7e7", "#6baed6", "#2171b5"],
    ["#eff3ff", "#bdd7e7", "#6baed6", "#3182bd", "#08519c"],
    ["#eff3ff", "#c6dbef", "#9ecae1", "#6baed6", "#3182bd", "#08519c"],
    ["#eff3ff", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#084594"],
    ["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#084594"],
    ["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#08519c", "#08306b"],
  ],
  greens: [
    ["#e5f5e0", "#a1d99b", "#31a354"],
    ["#edf8e9", "#bae4b3", "#74c476", "#238b45"],
    ["#edf8e9", "#bae4b3", "#74c476", "#31a354", "#006d2c"],
    ["#edf8e9", "#c7e9c0", "#a1d99b", "#74c476", "#31a354", "#006d2c"],
    ["#edf8e9", "#c7e9c0", "#a1d99b", "#74c476", "#41ab5d", "#238b45", "#005a32"],
    ["#f7fcf5", "#e5f5e0", "#c7e9c0", "#a1d99b", "#74c476", "#41ab5d", "#238b45", "#005a32"],
    ["#f7fcf5", "#e5f5e0", "#c7e9c0", "#a1d99b", "#74c476", "#41ab5d", "#238b45", "#006d2c", "#00441b"],
  ],
  greys: [
    ["#f0f0f0", "#bdbdbd", "#636363"],
    ["#f7f7f7", "#cccccc", "#969696", "#525252"],
    ["#f7f7f7", "#cccccc", "#969696", "#636363", "#252525"],
    ["#f7f7f7", "#d9d9d9", "#bdbdbd", "#969696", "#636363", "#252525"],
    ["#f7f7f7", "#d9d9d9", "#bdbdbd", "#969696", "#737373", "#525252", "#252525"],
    ["#ffffff", "#f0f0f0", "#d9d9d9", "#bdbdbd", "#969696", "#737373", "#525252", "#252525"],
    ["#ffffff", "#f0f0f0", "#d9d9d9", "#bdbdbd", "#969696", "#737373", "#525252", "#252525", "#000000"],
  ],
  oranges: [
    ["#fee6ce", "#fdae6b", "#e6550d"],
    ["#feedde", "#fdbe85", "#fd8d3c", "#d94701"],
    ["#feedde", "#fdbe85", "#fd8d3c", "#e6550d", "#a63603"],
    ["#feedde", "#fdd0a2", "#fdae6b", "#fd8d3c", "#e6550d", "#a63603"],
    ["#feedde", "#fdd0a2", "#fdae6b", "#fd8d3c", "#f16913", "#d94801", "#8c2d04"],
    ["#fff5eb", "#fee6ce", "#fdd0a2", "#fdae6b", "#fd8d3c", "#f16913", "#d94801", "#8c2d04"],
    ["#fff5eb", "#fee6ce", "#fdd0a2", "#fdae6b", "#fd8d3c", "#f16913", "#d94801", "#a63603", "#7f2704"],
  ],
  purples: [
    ["#efedf5", "#bcbddc", "#756bb1"],
    ["#f2f0f7", "#cbc9e2", "#9e9ac8", "#6a51a3"],
    ["#f2f0f7", "#cbc9e2", "#9e9ac8", "#756bb1", "#54278f"],
    ["#f2f0f7", "#dadaeb", "#bcbddc", "#9e9ac8", "#756bb1", "#54278f"],
    ["#f2f0f7", "#dadaeb", "#bcbddc", "#9e9ac8", "#807dba", "#6a51a3", "#4a1486"],
    ["#fcfbfd", "#efedf5", "#dadaeb", "#bcbddc", "#9e9ac8", "#807dba", "#6a51a3", "#4a1486"],
    ["#fcfbfd", "#efedf5", "#dadaeb", "#bcbddc", "#9e9ac8", "#807dba", "#6a51a3", "#54278f", "#3f007d"],
  ],
  reds: [
    ["#fee0d2", "#fc9272", "#de2d26"],
    ["#fee5d9", "#fcae91", "#fb6a4a", "#cb181d"],
    ["#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"],
    ["#fee5d9", "#fcbba1", "#fc9272", "#fb6a4a", "#de2d26", "#a50f15"],
    ["#fee5d9", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#99000d"],
    ["#fff5f0", "#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#99000d"],
    ["#fff5f0", "#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#a50f15", "#67000d"],
  ],
};

/**
 * The `count`-colour list of a ColorBrewer single-hue sequential scheme, light to
 * dark: `sequentialScheme("purples", 5)` equals d3-scale-chromatic's
 * `schemePurples[5]`. Built for a choropleth `colorScale`, which takes one more
 * colour than thresholds: `{ domain: [100, 500, 1000, 5000], range:
 * sequentialScheme("purples", 5) }`.
 *
 * - `count` is clamped to 3..9 (ColorBrewer defines no other sizes) and a
 *   non-integer is rounded; a count that is not a number (NaN) throws a RangeError.
 * - An unknown `name` throws an Error listing the valid names (TypeScript already
 *   rejects it at compile time).
 * - Returns a fresh array on every call, so callers may reverse or extend it.
 */
export function sequentialScheme(name: SequentialSchemeName, count: number): string[] {
  if (!(SEQUENTIAL_SCHEME_NAMES as readonly string[]).includes(name)) {
    throw new Error(
      `sequentialScheme: unknown sequential scheme "${String(name)}". ` +
        `Use one of: ${SEQUENTIAL_SCHEME_NAMES.join(", ")}.`,
    );
  }
  if (typeof count !== "number" || Number.isNaN(count)) {
    const got = typeof count === "string" ? JSON.stringify(count) : String(count);
    throw new RangeError(`sequentialScheme: count must be a number (3 to 9), got ${got}.`);
  }
  const k = Math.min(MAX_COUNT, Math.max(MIN_COUNT, Math.round(count)));
  return SCHEMES[name][k - MIN_COUNT].slice();
}
