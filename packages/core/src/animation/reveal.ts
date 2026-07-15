// Generic reveal ("wipe in left to right") shared by every chart that opts into
// `progressiveDraw` but has no chart-specific tip machinery (LineChart keeps its
// own richer implementation in lineChart/progressiveDraw.ts). Same mechanics:
// SVG clips the marks group with a <clipPath> rect whose width mutates in place
// per frame; canvas redraws under an equivalent ctx.clip via `canvasRedraw`.
import { svgEl } from "../dom";
import { resolveEasing, easeInOutCubic, type EasingFn } from "./easing";
import { createTweenDriver, type TweenDriver } from "./tween";
import { defaultTicker, type Ticker } from "./ticker";
import { defaultMotionPreference, type MotionPreference } from "./reducedMotion";
import type { ProgressiveDrawConfig } from "../types";

export interface ResolvedReveal {
  durationMs: number;
  easing: EasingFn;
  autoplay: boolean;
  replayOnUpdate: boolean;
}

export function resolveReveal(
  v: boolean | ProgressiveDrawConfig | undefined,
): ResolvedReveal | null {
  if (!v) return null;
  const cfg = v === true ? {} : v;
  return {
    durationMs: cfg.durationMs ?? 1200,
    easing: resolveEasing(cfg.easing, easeInOutCubic),
    autoplay: cfg.autoplay ?? true,
    replayOnUpdate: cfg.replayOnUpdate ?? false,
  };
}

let revealClipSeq = 0;

/** Create the reveal <clipPath> once per render and clip the marks group with
 *  it; only the returned rect's width mutates during the animation. */
export function installRevealClip(
  svg: SVGElement,
  marksRoot: Element,
  height: number,
): SVGRectElement {
  const id = `mv-reveal-clip-${++revealClipSeq}`;
  const clip = svgEl("clipPath", { id });
  const rect = svgEl("rect", { x: 0, y: 0, width: 0, height }) as SVGRectElement;
  clip.appendChild(rect);
  svg.appendChild(clip);
  marksRoot.setAttribute("clip-path", `url(#${id})`);
  return rect;
}

export function setRevealWidth(rect: SVGRectElement, revealPx: number): void {
  rect.setAttribute("width", String(Math.max(0, revealPx)));
}

export interface EngineReveal {
  /** Call at the END of every render(). Installs the clip (svg) or drives
   *  `canvasRedraw(revealX)` per frame (painted renderers); starts the wipe on
   *  the first render (autoplay) and renders fully revealed afterwards. */
  afterRender(
    cfg: ResolvedReveal | null,
    args: {
      renderer: string;
      svg: SVGElement;
      /** The marks group to clip in svg mode (never the axes/title). */
      marksRoot: Element | null;
      height: number;
      startPx: number;
      endPx: number;
      /** Painted-renderer redraw at a reveal cutoff (canvas/webgpu fallback). */
      canvasRedraw?: (revealX: number) => void;
    },
  ): void;
  replay(): void;
  stop(): void;
}

export function createEngineReveal(deps: {
  ticker?: Ticker;
  motion?: MotionPreference;
}): EngineReveal {
  const ticker = deps.ticker ?? defaultTicker();
  const motion = deps.motion ?? defaultMotionPreference();
  let driver: TweenDriver | null = null;
  let hasPlayed = false;

  return {
    afterRender(cfg, args) {
      // Capture an in-flight reveal's position so a re-render RESUMES it:
      // wrappers (Lit updated(), React effects) call update() right after
      // mount, and without the resume that double-render would kill every
      // mount autoplay.
      const resumeX = driver?.isRunning() ? driver.getValue() : null;
      driver?.stop();
      driver = null;
      if (!cfg) return;
      let apply: ((x: number) => void) | null = null;
      if (args.renderer === "svg") {
        if (!args.marksRoot) return;
        const rect = installRevealClip(args.svg, args.marksRoot, args.height);
        apply = (x) => setRevealWidth(rect, x);
      } else if (args.canvasRedraw) {
        apply = args.canvasRedraw;
      }
      if (!apply) return;
      const resuming = resumeX !== null;
      const span = Math.max(1, args.endPx - args.startPx);
      const remaining = resuming
        ? Math.max(1, cfg.durationMs * (1 - (resumeX - args.startPx) / span))
        : cfg.durationMs;
      driver = createTweenDriver({
        ticker,
        motion,
        durationMs: remaining,
        easing: cfg.easing,
        from: resuming ? resumeX : args.startPx,
        to: args.endPx,
        onFrame: apply,
      });
      if (resuming) {
        driver.start();
      } else if (cfg.autoplay && (!hasPlayed || cfg.replayOnUpdate)) {
        hasPlayed = true;
        driver.start();
      } else {
        apply(args.endPx);
      }
    },
    replay() {
      driver?.replay();
    },
    stop() {
      driver?.stop();
      driver = null;
    },
  };
}
