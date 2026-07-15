// Renderer-agnostic RadialTree model - consumed by SVG, canvas, and context.
// Bakes the legacy TreeRadial's adaptive label logic (abbreviate/truncate/hide by
// leaf-count density, rotate radially past a threshold) and the centre label's
// word-wrap into one pure computation, so SVG and canvas render byte-identical
// labels without duplicating the density rules.
import { sanitizeForClassName } from "../math/sanitize";
import type { RadialTreeColorResolver } from "./colors";
import type { RadialLayoutNode, RadialLink } from "./layout";
import type { RadiusOf } from "./scales";

export interface RadialTreeMark {
  label: string;
  code?: string;
  /** Colour-group key (top-level ancestor label). */
  colorKey: string;
  /** sanitizeForClassName(colorKey) - the colour contract. */
  dataLabelSafe: string;
  /** sanitizeForClassName(label) - per-node hook for CSS/tests. */
  nodeSafe: string;
  depth: number;
  isLeaf: boolean;
  value: number;
  path: string[];
  x: number;
  y: number;
  markRadius: number;
  fill: string;
  link: RadialLink;
  /** "" when labels are hidden at this density. */
  labelText: string;
  /** "" unless the density is low enough to show the value alongside the name. */
  valueText: string;
  textAnchor: "start" | "middle" | "end";
  /** Rotation in degrees applied AFTER translating to the node's position (0 = none). */
  rotateDeg: number;
  /** `x`/`y` text-attribute offsets in em units (legacy fine-tuning for radial labels). */
  offsetXEm: number;
  offsetYEm: number;
  dimmed: boolean;
}

export interface RadialTreeCenterLine {
  text: string;
  /** Vertical offset from the centre, in px. */
  dy: number;
}

export interface RadialTreeRenderModel {
  marks: RadialTreeMark[];
  /** Radius of the small centre circle (0 when there is no centerLabel). */
  centerRadius: number;
  centerLines: RadialTreeCenterLine[];
  /** True when the density crossed `rotateAbove` (labels abbreviated + rotated). */
  rotateText: boolean;
  /** False when the density crossed `hideAbove` (no labels drawn at all). */
  showLabels: boolean;
  highlightSet: Set<string>;
}

/** Greedy, deterministic word-wrap by character count - a simplified port of the
 * legacy chart's pixel-width-aware `textWrap` util (exact glyph-width math is not
 * load-bearing here; the break-roughly-every-N-characters INTENT is what's ported). */
export function wrapCenterLabel(text: string, maxCharsPerLine = 10): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const words = trimmed.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && candidate.length > maxCharsPerLine) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Per-line vertical offset ported verbatim from the legacy chart's centre-label
 * positioning (a 16px line height, with a small upward nudge added once there's
 * more than one line so the block stays roughly centred on the circle). */
export function centerLineOffsets(lines: string[]): number[] {
  const lineHeight = 16;
  return lines.map((_, i) => {
    let d = i * lineHeight;
    if (lines.length === 2) d -= lineHeight / 4;
    else if (lines.length > 2) d -= lineHeight;
    return d;
  });
}

export interface LabelDensity {
  rotateText: boolean;
  showLabels: boolean;
}

export function computeLabelDensity(
  leafCount: number,
  rotateAbove: number,
  hideAbove: number,
): LabelDensity {
  return { rotateText: leafCount > rotateAbove, showLabels: !(leafCount > hideAbove) };
}

export interface BuildRadialTreeModelOptions {
  leafCount: number;
  rotateAbove: number;
  hideAbove: number;
  outerRadius: number;
  centerLabel?: string;
  centerLabelWrapChars?: number;
  highlightItems: string[];
  valueFormatter: (n: number) => string;
}

const BUFFER = 10;

export function buildRadialTreeRenderModel(
  laidOut: RadialLayoutNode[],
  colors: RadialTreeColorResolver,
  radiusOf: RadiusOf,
  o: BuildRadialTreeModelOptions,
): RadialTreeRenderModel {
  const { rotateText, showLabels } = computeLabelDensity(o.leafCount, o.rotateAbove, o.hideAbove);
  const highlightSet = new Set(o.highlightItems);
  const anyHighlight = highlightSet.size > 0;

  const marks: RadialTreeMark[] = laidOut.map((node) => {
    const d = node.data;
    const angle = node.angle;
    const nearPole =
      (angle < 180 + BUFFER && angle > 180 - BUFFER) || (angle < 360 && angle > 360 - BUFFER);

    let labelText = "";
    let valueText = "";
    if (showLabels) {
      if (rotateText) {
        labelText = `${d.label.slice(0, 3)}.`;
      } else if (o.leafCount > o.rotateAbove / 2 && node.depth === 1) {
        labelText = d.label.length > 10 ? `${d.label.slice(0, 10)}..` : d.label;
      } else {
        labelText = d.label;
        valueText = o.valueFormatter(d.value);
      }
    }

    const rotateDeg = rotateText ? (angle < 180 ? angle - 90 : angle + 90) : 0;
    const textAnchor: RadialTreeMark["textAnchor"] = rotateText
      ? angle < 180
        ? "start"
        : "end"
      : nearPole
        ? "middle"
        : angle < 180
          ? "start"
          : "end";

    const highlighted =
      !anyHighlight || highlightSet.has(d.label) || highlightSet.has(d.groupLabel);

    return {
      label: d.label,
      code: d.code,
      colorKey: d.groupLabel,
      dataLabelSafe: sanitizeForClassName(d.groupLabel),
      nodeSafe: sanitizeForClassName(d.label),
      depth: node.depth,
      isLeaf: node.isLeaf,
      value: d.value,
      path: d.path,
      x: node.x,
      y: node.y,
      markRadius: radiusOf(d.value),
      fill: colors.getColor(d.groupLabel),
      link: node.link,
      labelText,
      valueText,
      textAnchor,
      rotateDeg,
      offsetXEm: angle < 180 ? 0.7 : -0.7,
      offsetYEm: nearPole ? 1.3 : 0.3,
      dimmed: !highlighted,
    };
  });

  const centerRadius = o.centerLabel ? o.outerRadius / 4 : 0;
  const lines = o.centerLabel ? wrapCenterLabel(o.centerLabel, o.centerLabelWrapChars ?? 10) : [];
  const offsets = centerLineOffsets(lines);
  const centerLines: RadialTreeCenterLine[] = lines.map((text, i) => ({ text, dy: offsets[i] }));

  return { marks, centerRadius, centerLines, rotateText, showLabels, highlightSet };
}
