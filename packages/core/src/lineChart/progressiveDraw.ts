// Progressive draw ("the line draws itself") for LineChart. The reveal is a
// geometric clip at a pixel x cutoff, applied identically by both renderers:
// SVG clips the content group with a <clipPath> rect whose width mutates in
// place each frame (no DOM rebuild in the animation loop), canvas redraws the
// same model under a ctx.clip() rect. Clipping instead of trimming run points
// keeps curved interpolation exact at the cut edge.
import { svgEl } from "../dom";
import { sanitizeForClassName } from "../math/sanitize";
import { resolveEasing, easeInOutCubic, type EasingFn } from "../animation/easing";
import { createTweenDriver } from "../animation/tween";
import type { Ticker } from "../animation/ticker";
import type { MotionPreference } from "../animation/reducedMotion";
import type { LineChartProps, ProgressiveDrawTipLabelConfig } from "../types";

export interface ResolvedProgressiveDraw {
  durationMs: number;
  easing: EasingFn;
  tipLabel: ProgressiveDrawTipLabelConfig | null;
  autoplay: boolean;
  replayOnUpdate: boolean;
}

export function resolveProgressiveDraw(
  v: LineChartProps["progressiveDraw"],
): ResolvedProgressiveDraw | null {
  if (!v) return null;
  const cfg = v === true ? {} : v;
  return {
    durationMs: cfg.durationMs ?? 1200,
    easing: resolveEasing(cfg.easing, easeInOutCubic),
    tipLabel: cfg.tipLabel ? (cfg.tipLabel === true ? {} : cfg.tipLabel) : null,
    autoplay: cfg.autoplay ?? true,
    replayOnUpdate: cfg.replayOnUpdate ?? false,
  };
}

export interface ProgressiveDrawDriver {
  /** Begin the reveal from startPx. Under prefers-reduced-motion (or a
   *  non-positive duration) it completes instantly in a single frame. */
  start(): void;
  /** Reset to startPx and run the reveal again. */
  replay(): void;
  /** Cancel any pending frame; no further onFrame calls. */
  stop(): void;
  isRunning(): boolean;
  /** Latest emitted reveal position (px). */
  getRevealX(): number;
}

export function createProgressiveDrawDriver(deps: {
  ticker: Ticker;
  motion: MotionPreference;
  durationMs: number;
  easing: EasingFn;
  startPx: number;
  endPx: number;
  onFrame(revealPx: number): void;
  onDone?(): void;
}): ProgressiveDrawDriver {
  // Thin adapter over the generic scalar tween (animation/tween.ts).
  const driver = createTweenDriver({
    ticker: deps.ticker,
    motion: deps.motion,
    durationMs: deps.durationMs,
    easing: deps.easing,
    from: deps.startPx,
    to: deps.endPx,
    onFrame: deps.onFrame,
    onDone: deps.onDone,
  });
  return {
    start: driver.start,
    replay: driver.replay,
    stop: driver.stop,
    isRunning: driver.isRunning,
    getRevealX: driver.getValue,
  };
}

let clipSeq = 0;

/** Create the reveal <clipPath> once per render and clip the content group with
 *  it. Only the returned rect's width mutates during the animation. */
export function installProgressiveClip(
  svg: SVGElement,
  contentRoot: SVGElement,
  height: number,
): SVGRectElement {
  const id = `mv-progressive-clip-${++clipSeq}`;
  const clip = svgEl("clipPath", { id });
  const rect = svgEl("rect", { x: 0, y: 0, width: 0, height }) as SVGRectElement;
  clip.appendChild(rect);
  svg.appendChild(clip);
  contentRoot.setAttribute("clip-path", `url(#${id})`);
  return rect;
}

/** Per-frame clip mutation: everything at x <= revealPx is visible. */
export function setProgressiveReveal(rect: SVGRectElement, revealPx: number): void {
  rect.setAttribute("width", String(Math.max(0, revealPx)));
}

// ---- Tip labels (the text following each line's end while it draws) ----

export interface TipLabelTarget {
  label: string;
  safe: string;
  color: string;
  /** Tip position in px: the reveal edge on the line (y linearly interpolated
   *  between the surrounding points), clamped to the series' last point. */
  x: number;
  y: number;
  text: string;
}

interface TipEntry {
  label: string;
  points: Array<{ x: number; y: number; d: { value: number } }>;
}

/** Pure per-frame tip computation shared by the SVG and canvas renderers, fed
 *  from the engine's undecimated hitData so both report identical values. The
 *  displayed value is the LAST REVEALED data point's (real data, never an
 *  interpolated number); only the position eases along the line. */
export function computeTipLabels(
  entries: TipEntry[],
  colorOf: (label: string) => string,
  revealX: number,
  cfg: ProgressiveDrawTipLabelConfig,
): TipLabelTarget[] {
  const targets: TipLabelTarget[] = [];
  for (const entry of entries) {
    const pts = entry.points;
    if (pts.length === 0 || pts[0].x > revealX) continue;
    // Last revealed point + the geometric tip position at the reveal edge.
    let i = 0;
    while (i + 1 < pts.length && pts[i + 1].x <= revealX) i++;
    const last = pts[i];
    let x = last.x;
    let y = last.y;
    if (i + 1 < pts.length) {
      const next = pts[i + 1];
      const span = next.x - last.x;
      const t = span > 0 ? (revealX - last.x) / span : 0;
      x = Math.min(revealX, next.x);
      y = last.y + (next.y - last.y) * t;
    }
    const value = last.d.value;
    const content = cfg.content ?? "both";
    const text = cfg.format
      ? cfg.format(value, entry.label)
      : content === "name"
        ? entry.label
        : content === "value"
          ? String(value)
          : `${entry.label} ${value}`;
    targets.push({
      label: entry.label,
      safe: sanitizeForClassName(entry.label),
      color: colorOf(entry.label),
      x,
      y,
      text,
    });
  }
  return targets;
}

/** Create the SVG tip-label group once per render; per frame only transforms
 *  and text content mutate. Lives OUTSIDE the clipped content group so labels
 *  are never clipped away. */
export function installTipLabels(svg: SVGElement): SVGGElement {
  const g = svgEl("g", { class: "mv-progressive-tips" }) as SVGGElement;
  g.style.pointerEvents = "none";
  svg.appendChild(g);
  return g;
}

/** Per-frame SVG tip update: reuse one <text> per series, keyed by label. */
export function setTipLabels(group: SVGGElement, targets: TipLabelTarget[]): void {
  const seen = new Set<string>();
  for (const t of targets) {
    seen.add(t.label);
    let node = group.querySelector<SVGTextElement>(
      `text.mv-progressive-tip[data-label-safe="${t.safe}"]`,
    );
    if (!node) {
      node = svgEl("text", {
        class: "mv-progressive-tip",
        "data-label": t.label,
        "data-label-safe": t.safe,
        "font-size": 12,
        "dominant-baseline": "middle",
      }) as SVGTextElement;
      group.appendChild(node);
    }
    node.setAttribute("transform", `translate(${t.x + 8}, ${t.y})`);
    node.setAttribute("fill", t.color);
    if (node.textContent !== t.text) node.textContent = t.text;
  }
  for (const node of Array.from(group.querySelectorAll("text.mv-progressive-tip"))) {
    const label = node.getAttribute("data-label");
    if (label !== null && !seen.has(label)) node.remove();
  }
}

/** Canvas tip labels, drawn after the line marks each frame from the same
 *  computeTipLabels targets the SVG renderer uses. */
export function drawTipLabelsCanvas(
  ctx: CanvasRenderingContext2D,
  targets: TipLabelTarget[],
  fontFamily: string,
): void {
  ctx.save();
  ctx.font = `12px ${fontFamily}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  for (const t of targets) {
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x + 8, t.y);
  }
  ctx.restore();
}
