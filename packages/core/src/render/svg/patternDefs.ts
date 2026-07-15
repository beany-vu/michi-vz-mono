// Real `<defs><pattern>` SVG hatch/image fill for a chart's `patternsMapping`
// (label -> data-URI, e.g. createHatchPattern's output). The canvas renderer
// already tiles patternsMapping via `ctx.createPattern` (see
// canvas/createHatchPattern.ts + each chart's renderCanvas.ts); this is the
// SVG-mode equivalent: a `<pattern>` tiling an `<image>` of the data-URI,
// referenced from a mark's `fill` as `url(#<id>)`.
//
// Shared by ComparableVerticalBarChart (native) and ComparableHorizontalBarChart
// (backported - its SVG path previously lacked the pattern support its own
// doc-comment promised; see comparableBar/renderSvg.ts).
import { svgEl } from "../../dom";

export interface PatternDefsOptions {
  /** Tile size (px) for the repeating pattern square. Default 8 (comfortably
   * tiles the common createHatchPattern default spacing of 6). */
  size?: number;
}

let counter = 0;

/**
 * Ensure a `<pattern>` def exists (in the SVG's `<defs>`) for every entry in
 * `patternsMapping`, and return a label -> pattern-element-id lookup. Safe to
 * call every render: each chart engine clears (and thus rebuilds) the whole
 * `<svg>` per render, so this rebuilds `<defs>` fresh each time (ids are
 * per-render, not persisted/reused across renders).
 */
export function ensurePatternDefs(
  svg: SVGElement,
  patternsMapping: Record<string, string> | undefined,
  o: PatternDefsOptions = {},
): Map<string, string> {
  const ids = new Map<string, string>();
  if (!patternsMapping || Object.keys(patternsMapping).length === 0) return ids;
  const size = o.size ?? 8;

  let defs = svg.querySelector(":scope > defs.mv-pattern-defs") as SVGElement | null;
  if (!defs) {
    defs = svgEl("defs", { class: "mv-pattern-defs" });
    svg.insertBefore(defs, svg.firstChild);
  }

  for (const [label, src] of Object.entries(patternsMapping)) {
    const id = `mv-pattern-${++counter}`;
    const pattern = svgEl("pattern", {
      id,
      patternUnits: "userSpaceOnUse",
      width: size,
      height: size,
    });
    const image = svgEl("image", { href: src, width: size, height: size });
    pattern.appendChild(image);
    defs.appendChild(pattern);
    ids.set(label, id);
  }
  return ids;
}
