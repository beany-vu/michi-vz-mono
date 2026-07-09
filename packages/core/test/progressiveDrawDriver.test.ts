import { describe, it, expect, vi } from "vitest";
import { createProgressiveDrawDriver } from "../src/lineChart/progressiveDraw";
import { createManualTicker } from "../src/animation/ticker";
import { linear } from "../src/animation/easing";
import type { MotionPreference } from "../src/animation/reducedMotion";

const noMotion: MotionPreference = { prefersReduced: () => false };
const reduced: MotionPreference = { prefersReduced: () => true };

function make(over: Partial<Parameters<typeof createProgressiveDrawDriver>[0]> = {}) {
  const ticker = createManualTicker();
  const frames: number[] = [];
  const onDone = vi.fn();
  const driver = createProgressiveDrawDriver({
    ticker,
    motion: noMotion,
    durationMs: 1000,
    easing: linear,
    startPx: 100,
    endPx: 600,
    onFrame: x => frames.push(x),
    onDone,
    ...over,
  });
  return { driver, ticker, frames, onDone };
}

describe("createProgressiveDrawDriver", () => {
  it("emits the start position immediately on start()", () => {
    const { driver, frames } = make();
    driver.start();
    expect(frames).toEqual([100]);
    expect(driver.isRunning()).toBe(true);
  });

  it("interpolates linearly and finishes exactly at endPx", () => {
    const { driver, ticker, frames, onDone } = make();
    driver.start();
    ticker.tick(500);
    expect(frames[frames.length - 1]).toBeCloseTo(350, 6);
    ticker.tick(500);
    expect(frames[frames.length - 1]).toBe(600);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(driver.isRunning()).toBe(false);
  });

  it("emits monotonically non-decreasing reveal positions", () => {
    const { driver, ticker, frames } = make();
    driver.start();
    for (let i = 0; i < 12; i++) ticker.tick(100);
    for (let i = 1; i < frames.length; i++) {
      expect(frames[i]).toBeGreaterThanOrEqual(frames[i - 1]);
    }
  });

  it("stops emitting after completion", () => {
    const { driver, ticker, frames } = make();
    driver.start();
    ticker.tick(1000);
    const n = frames.length;
    ticker.tick(1000);
    expect(frames.length).toBe(n);
    void driver;
  });

  it("jumps straight to endPx under prefers-reduced-motion", () => {
    const { driver, ticker, frames, onDone } = make({ motion: reduced });
    driver.start();
    expect(frames).toEqual([600]);
    expect(onDone).toHaveBeenCalledTimes(1);
    ticker.tick(1000);
    expect(frames.length).toBe(1);
  });

  it("jumps straight to endPx when durationMs is 0", () => {
    const { driver, frames, onDone } = make({ durationMs: 0 });
    driver.start();
    expect(frames).toEqual([600]);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("stop() cancels pending frames without emitting further", () => {
    const { driver, ticker, frames } = make();
    driver.start();
    ticker.tick(200);
    const n = frames.length;
    driver.stop();
    ticker.tick(1000);
    expect(frames.length).toBe(n);
    expect(driver.isRunning()).toBe(false);
  });

  it("replay() restarts from startPx after finishing", () => {
    const { driver, ticker, frames } = make();
    driver.start();
    ticker.tick(1000);
    expect(frames[frames.length - 1]).toBe(600);
    driver.replay();
    expect(frames[frames.length - 1]).toBe(100);
    ticker.tick(500);
    expect(frames[frames.length - 1]).toBeCloseTo(350, 6);
  });

  it("getRevealX() reports the latest emitted position", () => {
    const { driver, ticker } = make();
    driver.start();
    ticker.tick(500);
    expect(driver.getRevealX()).toBeCloseTo(350, 6);
  });
});
