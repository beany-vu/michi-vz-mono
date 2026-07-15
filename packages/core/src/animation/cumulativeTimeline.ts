// Cumulative "play through years" for time-axis charts: the marks are drawn UP
// TO the active period and the reveal sweeps between period pixel positions as
// the timeline steps. Rendering reuses the reveal clip mechanics (one SVG
// <clipPath> rect mutated per frame / a canvas redraw at a reveal cutoff); the
// playback state reuses TimelineController and the built-in control bar. Data
// and getContext() stay FULL - the reveal is purely visual, matching
// progressiveDraw's accessibility stance.
import { TimelineController } from "./timeline";
import { defaultTicker, type Ticker } from "./ticker";
import { defaultMotionPreference, type MotionPreference } from "./reducedMotion";
import { createTweenDriver, type TweenDriver } from "./tween";
import { installRevealClip, setRevealWidth } from "./reveal";
import {
  createTimelineControlRefs,
  applyTimelineControl,
  syncTimelineControl,
} from "../render/timelineControl";
import type { ResolvedTimeline } from "./chartTimeline";

export interface CumulativePeriod {
  period: number | string;
  /** The period's x position in px (same coordinate space as the SVG). */
  px: number;
}

export interface CumulativeRenderArgs {
  host: HTMLElement;
  renderer: string;
  svg: SVGElement;
  /** Marks group to clip in svg mode (never axes/title/legend). */
  marksRoot: Element | null;
  height: number;
  periods: CumulativePeriod[];
  /** Plot left edge (reveal floor). */
  startPx: number;
  /** Full reveal (the LAST period's target). */
  endPx: number;
  /** Painted-renderer redraw at a reveal cutoff (canvas/webgpu 2D fallback). */
  canvasRedraw?: (revealX: number) => void;
  /** Extra per-frame hook (LineChart tip labels ride here). */
  onReveal?: (revealX: number) => void;
  /** Initial period on first creation (e.g. from filter.date). */
  startPeriod?: number | string;
}

export interface EngineCumulativeTimeline {
  /** Call at the END of every render(); re-installs the clip and resumes any
   *  in-flight sweep (wrappers re-render right after mount). */
  afterRender(cfg: ResolvedTimeline | null, args: CumulativeRenderArgs): void;
  controller(): TimelineController | null;
  /** Current reveal position while the timeline is active, else null - the
   *  engine's hover cap (undrawn years are not inspectable, even paused). */
  getRevealX(): number | null;
  destroy(): void;
}

/** Marker headroom so the active period's data-point marker is fully visible. */
const TIP_PAD = 8;

export function createCumulativeTimeline(deps: {
  ticker?: Ticker;
  motion?: MotionPreference;
}): EngineCumulativeTimeline {
  const ticker = deps.ticker ?? defaultTicker();
  const motion = deps.motion ?? defaultMotionPreference();
  const refs = createTimelineControlRefs();
  let tl: TimelineController | null = null;
  let index = 0;
  let periodsSig = "";
  let revealX: number | null = null;
  let tween: TweenDriver | null = null;
  let activeCfg: ResolvedTimeline | null = null;
  let autoplayed = false;
  // Rebound every render to the fresh clip/canvas closures.
  let apply: ((x: number) => void) | null = null;
  let targets: number[] = [];

  const applyAt = (x: number): void => {
    revealX = x;
    apply?.(x);
  };

  const stopTween = (): void => {
    tween?.stop();
    tween = null;
  };

  const sweepTo = (target: number): void => {
    stopTween();
    const cfg = activeCfg;
    if (!cfg || !cfg.interpolate || motion.prefersReduced() || revealX === null) {
      applyAt(target);
      return;
    }
    tween = createTweenDriver({
      ticker,
      motion,
      durationMs: cfg.tweenMs ?? cfg.speedMs,
      easing: cfg.easing,
      from: revealX,
      to: target,
      onFrame: applyAt,
    });
    tween.start();
  };

  const teardown = (): void => {
    stopTween();
    tl?.destroy();
    tl = null;
    periodsSig = "";
    revealX = null;
    apply = null;
  };

  return {
    afterRender(cfg, args) {
      activeCfg = cfg;
      const wasSweeping = tween?.isRunning() ?? false;
      const resumeX = revealX;
      stopTween();
      apply = null;
      if (!cfg || args.periods.length === 0) {
        teardown();
        applyTimelineControl(args.host, refs, () => tl, false);
        return;
      }
      targets = args.periods.map((p, i) =>
        i === args.periods.length - 1 ? args.endPx : Math.min(args.endPx, p.px + TIP_PAD),
      );
      const sig = args.periods.map((p) => String(p.period)).join("|");
      if (!tl || sig !== periodsSig) {
        const firstCreation = !tl;
        tl?.destroy();
        periodsSig = sig;
        let startIndex = Math.min(index, args.periods.length - 1);
        if (firstCreation && args.startPeriod !== undefined) {
          const fromStart = args.periods.findIndex(
            (p) => String(p.period) === String(args.startPeriod),
          );
          if (fromStart >= 0) startIndex = fromStart;
        }
        index = startIndex;
        tl = new TimelineController({
          periods: args.periods.map((p) => p.period),
          speedMs: cfg.speedMs,
          loop: cfg.loop,
          startIndex,
          ticker,
          events: {
            onStep: (period, i) => {
              index = i;
              sweepTo(targets[i]);
              syncTimelineControl(refs, tl?.getState() ?? null, activeCfg?.formatPeriod);
              activeCfg?.onStep?.(period, i);
            },
            onPlayStateChange: () => {
              syncTimelineControl(refs, tl?.getState() ?? null, activeCfg?.formatPeriod);
            },
          },
        });
      }

      // Fresh appliers for this render's DOM/canvas.
      let localApply: ((x: number) => void) | null = null;
      if (args.renderer === "svg") {
        if (args.marksRoot) {
          const rect = installRevealClip(args.svg, args.marksRoot, args.height);
          localApply = (x) => setRevealWidth(rect, x);
        }
      } else if (args.canvasRedraw) {
        localApply = args.canvasRedraw;
      }
      const extra = args.onReveal;
      apply = localApply
        ? (x) => {
            localApply!(x);
            extra?.(x);
          }
        : (extra ?? null);

      const target = targets[Math.min(index, targets.length - 1)];
      if (wasSweeping && resumeX !== null) {
        // Re-render interrupted a sweep: continue from where it was.
        revealX = resumeX;
        sweepTo(target);
      } else {
        applyAt(target);
      }

      applyTimelineControl(args.host, refs, () => tl, cfg.showControl);
      syncTimelineControl(refs, tl?.getState() ?? null, cfg.formatPeriod);
      if (cfg.autoplay && tl && !autoplayed) {
        autoplayed = true;
        tl.play();
      }
    },
    controller: () => tl,
    getRevealX: () => (tl ? revealX : null),
    destroy() {
      teardown();
      refs.root?.remove();
      refs.root = null;
    },
  };
}
