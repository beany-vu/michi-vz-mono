// Generic scalar tween on the injectable ticker: eases a value from -> to over
// durationMs, one onFrame per animation frame. Under prefers-reduced-motion (or
// a non-positive duration) it completes instantly in a single frame. Powers the
// LineChart progressive draw and the timeline between-period interpolation.
import type { Ticker } from "./ticker";
import type { MotionPreference } from "./reducedMotion";
import type { EasingFn } from "./easing";

export interface TweenDriver {
  start(): void;
  /** Reset to `from` and run again. */
  replay(): void;
  /** Cancel any pending frame; no further onFrame calls. */
  stop(): void;
  isRunning(): boolean;
  /** Latest emitted value. */
  getValue(): number;
}

export function createTweenDriver(deps: {
  ticker: Ticker;
  motion: MotionPreference;
  durationMs: number;
  easing: EasingFn;
  from: number;
  to: number;
  onFrame(value: number): void;
  onDone?(): void;
}): TweenDriver {
  let frameId: number | null = null;
  let running = false;
  let value = deps.from;

  const emit = (v: number): void => {
    value = v;
    deps.onFrame(v);
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
      emit(deps.to);
      deps.onDone?.();
      return;
    }
    running = true;
    const t0 = deps.ticker.now();
    const loop = (now: number): void => {
      const p = Math.min(1, (now - t0) / deps.durationMs);
      emit(deps.from + deps.easing(p) * (deps.to - deps.from));
      if (p >= 1) {
        running = false;
        frameId = null;
        deps.onDone?.();
        return;
      }
      frameId = deps.ticker.request(loop);
    };
    emit(deps.from);
    frameId = deps.ticker.request(loop);
  };

  return {
    start: begin,
    replay: begin,
    stop: cancel,
    isRunning: () => running,
    getValue: () => value,
  };
}
