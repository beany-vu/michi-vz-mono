// Progressive draw ("the line draws itself") for LineChart. The reveal is a
// geometric clip at a pixel x cutoff, applied identically by both renderers:
// SVG clips the content group with a <clipPath> rect whose width mutates in
// place each frame (no DOM rebuild in the animation loop), canvas redraws the
// same model under a ctx.clip() rect. Clipping instead of trimming run points
// keeps curved interpolation exact at the cut edge.
import { svgEl } from "../dom";
import { resolveEasing, easeInOutCubic, type EasingFn } from "../animation/easing";
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
  v: LineChartProps["progressiveDraw"]
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
  let frameId: number | null = null;
  let running = false;
  let revealX = deps.startPx;

  const emit = (x: number): void => {
    revealX = x;
    deps.onFrame(x);
  };

  const cancel = (): void => {
    if (frameId !== null) {
      deps.ticker.cancel(frameId);
      frameId = null;
    }
    running = false;
  };

  const begin = (): void => {
    cancel();
    if (deps.motion.prefersReduced() || deps.durationMs <= 0) {
      emit(deps.endPx);
      deps.onDone?.();
      return;
    }
    running = true;
    const t0 = deps.ticker.now();
    const loop = (now: number): void => {
      const p = Math.min(1, (now - t0) / deps.durationMs);
      emit(deps.startPx + deps.easing(p) * (deps.endPx - deps.startPx));
      if (p >= 1) {
        running = false;
        frameId = null;
        deps.onDone?.();
        return;
      }
      frameId = deps.ticker.request(loop);
    };
    emit(deps.startPx);
    frameId = deps.ticker.request(loop);
  };

  return {
    start: begin,
    replay: begin,
    stop: cancel,
    isRunning: () => running,
    getRevealX: () => revealX,
  };
}

let clipSeq = 0;

/** Create the reveal <clipPath> once per render and clip the content group with
 *  it. Only the returned rect's width mutates during the animation. */
export function installProgressiveClip(
  svg: SVGElement,
  contentRoot: SVGElement,
  height: number
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
