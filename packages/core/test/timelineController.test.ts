import { describe, it, expect, vi } from "vitest";
import { TimelineController } from "../src/animation/timeline";
import { createManualTicker } from "../src/animation/ticker";
import { applyTimelineControl, createTimelineControlRefs } from "../src/render/timelineControl";

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
    controller.seekIndex(3);
    controller.play();
    ticker.tick(800);
    expect(controller.getState().index).toBe(1);
  });
});

describe("seek and stepping", () => {
  it("seek(n) falls back to index n when no period is n, and fires onStep", () => {
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

  it("seek clamps an out-of-range index fallback", () => {
    const { controller } = make();
    controller.seek(99);
    expect(controller.getState().index).toBe(3);
    controller.seek(-5);
    expect(controller.getState().index).toBe(0);
  });

  it("seek(number) matches a period first: string years are found by value", () => {
    const { controller } = make({ periods: ["2021", "2022", "2023", "2024"] });
    controller.seek(2021);
    expect(controller.getState().index).toBe(0);
    controller.seek(2023);
    expect(controller.getState().index).toBe(2);
  });

  it("seek(number) falls back to an index only when no period matches", () => {
    const { controller } = make({ periods: [2001, 2002, 2003] });
    controller.seek(2);
    expect(controller.getState().index).toBe(2);
    controller.seek(2002);
    expect(controller.getState().index).toBe(1);
  });

  it("seekIndex(i) always takes an index (periods that look like indices too), clamped", () => {
    const { controller, onStep } = make({ periods: [1, 2, 3] });
    controller.seek(1);
    expect(controller.getState().index).toBe(0);
    controller.seekIndex(1);
    expect(controller.getState().index).toBe(1);
    expect(onStep).toHaveBeenLastCalledWith(2, 1);
    controller.seekIndex(99);
    expect(controller.getState().index).toBe(2);
    controller.seekIndex(-1);
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
    controller.seekIndex(3);
    onStep.mockClear();
    controller.stepForward();
    expect(controller.getState().index).toBe(3);
    expect(onStep).not.toHaveBeenCalled();
  });

  it("stepForward at the last period with loop wraps to 0", () => {
    const { controller } = make({ loop: true });
    controller.seekIndex(3);
    controller.stepForward();
    expect(controller.getState().index).toBe(0);
  });
});

describe("seek matches a period first, then falls back to an index", () => {
  it("a number finds the string period it spells (seek(2019) on string years)", () => {
    const { controller, onStep } = make();
    controller.seek(2019);
    expect(controller.getState().index).toBe(1);
    expect(onStep).toHaveBeenCalledWith("2019", 1);
  });

  it("a string finds the numeric period it spells", () => {
    const { controller } = make({ periods: [2019, 2020, 2021] });
    controller.seek("2020");
    expect(controller.getState().index).toBe(1);
    controller.seek(2021);
    expect(controller.getState().index).toBe(2);
  });

  it("string periods that look like small numbers match before any index reading", () => {
    const months = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
    const { controller, onStep } = make({ periods: months });
    controller.seek(3);
    expect(controller.getState().index).toBe(2);
    expect(onStep).toHaveBeenLastCalledWith("3", 2);
  });

  it("numeric periods that look like indices also match as periods", () => {
    const { controller } = make({ periods: [1, 2, 3, 4] });
    controller.seek(2);
    expect(controller.getState().index).toBe(1);
  });

  it("a number that matches no period is read as an index (clamped)", () => {
    const { controller } = make();
    controller.seek(2);
    expect(controller.getState().index).toBe(2);
    controller.seek(99);
    expect(controller.getState().index).toBe(3);
  });

  it("a string that matches no period leaves the timeline where it is", () => {
    const { controller, onStep } = make({ startIndex: 2 });
    controller.seek("2030");
    expect(controller.getState().index).toBe(2);
    expect(onStep).not.toHaveBeenCalled();
  });

  it("a non-finite number that matches no period is ignored", () => {
    const { controller, onStep } = make({ startIndex: 1 });
    controller.seek(Number.NaN);
    controller.seek(Number.POSITIVE_INFINITY);
    expect(controller.getState().index).toBe(1);
    expect(onStep).not.toHaveBeenCalled();
  });
});

describe("seekIndex", () => {
  it("always goes by position, even when a period has the same value", () => {
    const { controller, onStep } = make({ periods: [1, 2, 3, 4] });
    controller.seekIndex(2);
    expect(controller.getState().index).toBe(2);
    expect(onStep).toHaveBeenCalledWith(3, 2);
  });

  it("clamps out-of-range positions", () => {
    const { controller } = make();
    controller.seekIndex(99);
    expect(controller.getState().index).toBe(3);
    controller.seekIndex(-5);
    expect(controller.getState().index).toBe(0);
  });

  it("rounds a fractional position to the nearest period", () => {
    const { controller } = make();
    controller.seekIndex(1.6);
    expect(controller.getState().index).toBe(2);
  });

  it("ignores a non-finite position", () => {
    const { controller, onStep } = make({ startIndex: 1 });
    controller.seekIndex(Number.NaN);
    expect(controller.getState().index).toBe(1);
    expect(onStep).not.toHaveBeenCalled();
  });

  it("to the current index does not fire onStep", () => {
    const { controller, onStep } = make();
    controller.seekIndex(0);
    expect(onStep).not.toHaveBeenCalled();
  });

  it("is inert after destroy", () => {
    const { controller, onStep } = make();
    controller.destroy();
    controller.seekIndex(2);
    expect(controller.getState().index).toBe(0);
    expect(onStep).not.toHaveBeenCalled();
  });

  it("resets the step clock, so playback waits a full step after the jump", () => {
    const { controller, ticker } = make();
    controller.play();
    ticker.tick(600);
    controller.seekIndex(2);
    ticker.tick(600);
    expect(controller.getState().index).toBe(2);
    ticker.tick(200);
    expect(controller.getState().index).toBe(3);
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

describe("the built-in scrubber", () => {
  it("seeks by index, even when the periods are small numbers", () => {
    const { controller } = make({ periods: [1, 2, 3] });
    const host = document.createElement("div");
    const refs = createTimelineControlRefs();
    applyTimelineControl(host, refs, () => controller, true);
    const range = host.querySelector<HTMLInputElement>(".mv-timeline-scrubber")!;
    range.max = "2";
    range.value = "1";
    range.dispatchEvent(new Event("input"));
    expect(controller.getState().index).toBe(1);
  });
});
