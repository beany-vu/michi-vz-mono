import { describe, it, expect, vi } from "vitest";
import { TimelineController } from "../src/animation/timeline";
import { createManualTicker } from "../src/animation/ticker";

const PERIODS = ["2018", "2019", "2020", "2021"];

function make(opts: Partial<ConstructorParameters<typeof TimelineController>[0]> = {}) {
  const ticker = createManualTicker();
  const onStep = vi.fn();
  const onPlayStateChange = vi.fn();
  const onEnd = vi.fn();
  const controller = new TimelineController({
    periods: PERIODS,
    ticker,
    events: { onStep, onPlayStateChange, onEnd },
    ...opts,
  });
  return { controller, ticker, onStep, onPlayStateChange, onEnd };
}

describe("TimelineController state", () => {
  it("starts paused at startIndex (default 0) with default speed 800", () => {
    const { controller } = make();
    const s = controller.getState();
    expect(s.periods).toEqual(PERIODS);
    expect(s.index).toBe(0);
    expect(s.playing).toBe(false);
    expect(s.loop).toBe(false);
    expect(s.speedMs).toBe(800);
  });

  it("honors startIndex and loop options", () => {
    const { controller } = make({ startIndex: 2, loop: true });
    expect(controller.getState().index).toBe(2);
    expect(controller.getState().loop).toBe(true);
  });
});

describe("play/pause", () => {
  it("play() flips playing and notifies onPlayStateChange", () => {
    const { controller, onPlayStateChange } = make();
    controller.play();
    expect(controller.getState().playing).toBe(true);
    expect(onPlayStateChange).toHaveBeenCalledWith(true);
  });

  it("advances exactly one period per speedMs elapsed and fires onStep", () => {
    const { controller, ticker, onStep } = make();
    controller.play();
    ticker.tick(800);
    expect(controller.getState().index).toBe(1);
    expect(onStep).toHaveBeenCalledTimes(1);
    expect(onStep).toHaveBeenCalledWith("2019", 1);
  });

  it("does not advance before speedMs has elapsed, then advances", () => {
    const { controller, ticker } = make();
    controller.play();
    ticker.tick(400);
    expect(controller.getState().index).toBe(0);
    ticker.tick(400);
    expect(controller.getState().index).toBe(1);
  });

  it("pause() stops further advancement and notifies", () => {
    const { controller, ticker, onStep, onPlayStateChange } = make();
    controller.play();
    ticker.tick(800);
    controller.pause();
    ticker.tick(800);
    ticker.tick(800);
    expect(controller.getState().index).toBe(1);
    expect(onStep).toHaveBeenCalledTimes(1);
    expect(onPlayStateChange).toHaveBeenLastCalledWith(false);
  });

  it("toggle() flips between playing and paused", () => {
    const { controller } = make();
    controller.toggle();
    expect(controller.getState().playing).toBe(true);
    controller.toggle();
    expect(controller.getState().playing).toBe(false);
  });

  it("play() when already playing does not re-notify", () => {
    const { controller, onPlayStateChange } = make();
    controller.play();
    controller.play();
    expect(onPlayStateChange).toHaveBeenCalledTimes(1);
  });
});

describe("end behavior", () => {
  it("without loop: stops at the last period, fires onEnd once, playing becomes false", () => {
    const { controller, ticker, onEnd } = make();
    controller.play();
    ticker.tick(800);
    ticker.tick(800);
    ticker.tick(800); // reaches index 3 (last)
    expect(controller.getState().index).toBe(3);
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(controller.getState().playing).toBe(false);
    ticker.tick(800);
    expect(controller.getState().index).toBe(3);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it("with loop: wraps to index 0 and keeps playing", () => {
    const { controller, ticker, onStep, onEnd } = make({ loop: true });
    controller.play();
    ticker.tick(800);
    ticker.tick(800);
    ticker.tick(800);
    expect(controller.getState().index).toBe(3);
    ticker.tick(800);
    expect(controller.getState().index).toBe(0);
    expect(controller.getState().playing).toBe(true);
    expect(onEnd).not.toHaveBeenCalled();
    expect(onStep).toHaveBeenLastCalledWith("2018", 0);
  });

  it("play() at the last period without loop restarts from the beginning", () => {
    const { controller, ticker } = make();
    controller.seek(3);
    controller.play();
    ticker.tick(800);
    expect(controller.getState().index).toBe(1);
  });
});

describe("seek and stepping", () => {
  it("seek(index) jumps and fires onStep", () => {
    const { controller, onStep } = make();
    controller.seek(2);
    expect(controller.getState().index).toBe(2);
    expect(onStep).toHaveBeenCalledWith("2020", 2);
  });

  it("seek(period value) resolves the matching index", () => {
    const { controller } = make();
    controller.seek("2021");
    expect(controller.getState().index).toBe(3);
  });

  it("seek clamps out-of-range indices", () => {
    const { controller } = make();
    controller.seek(99);
    expect(controller.getState().index).toBe(3);
    controller.seek(-5);
    expect(controller.getState().index).toBe(0);
  });

  it("seek to the current index does not fire onStep", () => {
    const { controller, onStep } = make();
    controller.seek(0);
    expect(onStep).not.toHaveBeenCalled();
  });

  it("stepForward/stepBack move one period while paused", () => {
    const { controller, onStep } = make();
    controller.stepForward();
    expect(controller.getState().index).toBe(1);
    controller.stepBack();
    expect(controller.getState().index).toBe(0);
    expect(onStep).toHaveBeenCalledTimes(2);
  });

  it("stepForward at the last period without loop stays put", () => {
    const { controller, onStep } = make();
    controller.seek(3);
    onStep.mockClear();
    controller.stepForward();
    expect(controller.getState().index).toBe(3);
    expect(onStep).not.toHaveBeenCalled();
  });

  it("stepForward at the last period with loop wraps to 0", () => {
    const { controller } = make({ loop: true });
    controller.seek(3);
    controller.stepForward();
    expect(controller.getState().index).toBe(0);
  });
});

describe("setSpeed", () => {
  it("changes the step cadence", () => {
    const { controller, ticker } = make();
    controller.setSpeed(200);
    expect(controller.getState().speedMs).toBe(200);
    controller.play();
    ticker.tick(200);
    expect(controller.getState().index).toBe(1);
  });
});

describe("destroy", () => {
  it("cancels the ticker and makes the controller inert", () => {
    const { controller, ticker, onStep } = make();
    controller.play();
    controller.destroy();
    ticker.tick(800);
    expect(onStep).not.toHaveBeenCalled();
    controller.play();
    ticker.tick(800);
    expect(onStep).not.toHaveBeenCalled();
    expect(controller.getState().playing).toBe(false);
  });
});

describe("degenerate periods", () => {
  it("a single-period timeline ends immediately when played", () => {
    const ticker = createManualTicker();
    const onEnd = vi.fn();
    const controller = new TimelineController({
      periods: ["2020"],
      ticker,
      events: { onEnd },
    });
    controller.play();
    ticker.tick(800);
    expect(controller.getState().index).toBe(0);
    expect(controller.getState().playing).toBe(false);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});
