// Generates a repeating diagonal-hatch tile as an SVG data-URI, for use as a
// chart pattern fill (the `patternsMapping` prop). It is a convenience over
// hand-authoring a pattern image: the data-URI it returns can be fed to any
// renderer - the canvas renderer tiles it via `ctx.createPattern`, and an SVG
// renderer can reference it from an `<image>` inside a `<pattern>`.
//
// Ported verbatim from the legacy michi-vz
// (src/components/hooks/canvas/createHatchPattern.ts) for drop-in parity.

export interface HatchPatternOptions {
  // Stroke colour of the hatch lines.
  color: string;
  // Hatch direction: 45 (↗, default) or -45 (↘).
  angle?: 45 | -45;
  // Tile size in px - also the gap between lines. Default 6 (matches the
  // common visx hatch).
  spacing?: number;
  // Hatch line thickness in px. Default 1.
  strokeWidth?: number;
  // Tile background; default transparent so the bar/area colour can show.
  background?: string;
}

// Builds the tile's diagonal path. For a `spacing`×`spacing` tile, three
// parallel segments (the main diagonal plus the two corner stubs) make the
// hatch tile seamlessly when repeated - the same construction visx uses.
const hatchPath = (spacing: number, angle: 45 | -45): string => {
  const s = spacing;
  const h = s / 2;
  if (angle === -45) {
    // "↘" diagonal
    return `M 0,0 l ${s},${s} M ${-h},${h} l ${s},${s} M ${h},${-h} l ${s},${s}`;
  }
  // "↗" diagonal (default)
  return `M 0,${s} l ${s},${-s} M ${-h},${h} l ${s},${-s} M ${h},${s + h} l ${s},${-s}`;
};

export const createHatchPattern = (options: HatchPatternOptions): string => {
  const { color, angle = 45, spacing = 6, strokeWidth = 1, background = "transparent" } = options;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${spacing}" height="${spacing}">` +
    `<rect width="${spacing}" height="${spacing}" fill="${background}"/>` +
    `<path d="${hatchPath(spacing, angle)}" stroke="${color}" stroke-width="${strokeWidth}" ` +
    `stroke-linecap="square" shape-rendering="auto"/>` +
    `</svg>`;

  // encodeURIComponent (not btoa) so any colour string - incl. non-Latin1 -
  // survives, and the data-URI works in both <img> src and ctx.createPattern.
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export default createHatchPattern;
