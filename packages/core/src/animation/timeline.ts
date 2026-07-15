// Headless playback controller for "play through years" charts. It owns the
// clock and the current period index but never touches the DOM: engines wire
// events.onStep to their own snapshot update, the built-in control UI wires
// its buttons to play/pause/seek. Deterministic under a ManualTicker.

import { defaultTicker, type Ticker } from "./ticker";

export interface TimelineState {
  periods: Array<number | string>;
  index: number;
  playing: boolean;
  loop: boolean;
  speedMs: number;
}

export interface TimelineEvents {
  onStep?(period: number | string, index: number): void;
  onPlayStateChange?(playing: boolean): void;
  /** Fires once when a non-looping timeline reaches the last period. */
  onEnd?(): void;
}

export interface TimelineOptions {
  periods: Array<number | string>;
  /** ms per period step while playing (default 800). */
  speedMs?: number;
  loop?: boolean;
  startIndex?: number;
  ticker?: Ticker;
  events?: TimelineEvents;
}

export class TimelineController {
  private periods: Array<number | string>;
  private index: number;
  private playing = false;
  private loop: boolean;
  private speedMs: number;
  private ticker: Ticker;
  private events: TimelineEvents;
  private frameId: number | null = null;
  private lastStepAt = 0;
  private destroyed = false;

  constructor(opts: TimelineOptions) {
    this.periods = opts.periods.slice();
    this.speedMs = opts.speedMs ?? 800;
    this.loop = opts.loop ?? false;
    this.ticker = opts.ticker ?? defaultTicker();
    this.events = opts.events ?? {};
    this.index = clamp(opts.startIndex ?? 0, 0, Math.max(0, this.periods.length - 1));
  }

  play(): void {
    if (this.destroyed || this.playing) return;
    // Replaying a finished, non-looping timeline restarts from the beginning.
    if (!this.loop && this.index >= this.lastIndex()) this.moveTo(0);
    this.playing = true;
    this.events.onPlayStateChange?.(true);
    this.lastStepAt = this.ticker.now();
    this.scheduleFrame();
  }

  pause(): void {
    if (this.destroyed || !this.playing) return;
    this.playing = false;
    this.cancelFrame();
    this.events.onPlayStateChange?.(false);
  }

  toggle(): void {
    if (this.playing) this.pause();
    else this.play();
  }

  seek(indexOrPeriod: number | string): void {
    if (this.destroyed) return;
    const idx =
      typeof indexOrPeriod === "number" && !this.periods.includes(indexOrPeriod)
        ? indexOrPeriod
        : this.periods.findIndex((p) => String(p) === String(indexOrPeriod));
    this.moveTo(clamp(idx, 0, this.lastIndex()));
    this.lastStepAt = this.ticker.now();
  }

  stepForward(): void {
    if (this.destroyed) return;
    const next = this.index + 1;
    if (next > this.lastIndex()) {
      if (this.loop) this.moveTo(0);
      return;
    }
    this.moveTo(next);
  }

  stepBack(): void {
    if (this.destroyed) return;
    const prev = this.index - 1;
    if (prev < 0) {
      if (this.loop) this.moveTo(this.lastIndex());
      return;
    }
    this.moveTo(prev);
  }

  setSpeed(ms: number): void {
    this.speedMs = Math.max(16, ms);
    this.lastStepAt = this.ticker.now();
  }

  getState(): Readonly<TimelineState> {
    return {
      periods: this.periods.slice(),
      index: this.index,
      playing: this.playing,
      loop: this.loop,
      speedMs: this.speedMs,
    };
  }

  destroy(): void {
    this.cancelFrame();
    this.playing = false;
    this.destroyed = true;
  }

  private lastIndex(): number {
    return Math.max(0, this.periods.length - 1);
  }

  private moveTo(idx: number): void {
    if (idx === this.index) return;
    this.index = idx;
    this.events.onStep?.(this.periods[idx], idx);
  }

  private scheduleFrame(): void {
    this.frameId = this.ticker.request((now) => this.onFrame(now));
  }

  private cancelFrame(): void {
    if (this.frameId !== null) {
      this.ticker.cancel(this.frameId);
      this.frameId = null;
    }
  }

  private onFrame(now: number): void {
    if (!this.playing || this.destroyed) return;
    if (now - this.lastStepAt >= this.speedMs) {
      this.lastStepAt = now;
      const next = this.index + 1;
      if (next > this.lastIndex()) {
        if (this.loop) {
          this.moveTo(0);
        } else {
          this.finish();
          return;
        }
      } else {
        this.moveTo(next);
        if (!this.loop && next === this.lastIndex()) {
          this.finish();
          return;
        }
      }
    }
    this.scheduleFrame();
  }

  private finish(): void {
    this.playing = false;
    this.cancelFrame();
    this.events.onPlayStateChange?.(false);
    this.events.onEnd?.();
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
