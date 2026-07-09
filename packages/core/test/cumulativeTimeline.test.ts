import { describe, it, expect, vi } from "vitest";
import { createCumulativeTimeline } from "../src/animation/cumulativeTimeline";
import { resolveTimeline } from "../src/animation/chartTimeline";
import { createManualTicker, type ManualTicker } from "../src/animation/ticker";
import type { MotionPreference } from "../src/animation/reducedMotion";

const PERIODS = [
  { period: "2018", px: 100 },
  { period: "2019", px: 200 },
  { period: "2020", px: 300 },
];
const START = 60;
const END = 600;

function makeDom() {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const marks = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svg.appendChild(marks);
  host.appendChild(svg);
  return { host, svg, marks };
}

function make(cfgIn: Parameters<typeof resolveTimeline>[0] = { easing: "linear", tweenMs: 400 }, motion?: MotionPreference) {
  const ticker: ManualTicker = createManualTicker();
  const cum = createCumulativeTimeline({ ticker, motion });
  const dom = makeDom();
  const onReveal = vi.fn();
  const cfg = resolveTimeline(cfgIn);
  const renderArgs = () => ({
    host: dom.host,
    renderer: "svg",
    svg: dom.svg as SVGElement,
    marksRoot: dom.marks as Element,
    height: 300,
    periods: PERIODS,
    startPx: START,
    endPx: END,
    onReveal,
  });
  const rerender = () => cum.afterRender(cfg, renderArgs());
  rerender();
  return { cum, ticker, dom, onReveal, rerender };
}

// Real engines clear(svg) before each render; this harness does not, so old
// clipPaths linger - always read the most recently installed one.
const clipWidth = (svg: SVGElement): number => {
  const rects = svg.querySelectorAll("clipPath rect");
  return Number(rects[rects.length - 1]!.getAttribute("width"));
};

describe("createCumulativeTimeline", () => {
  it("initially reveals up to the FIRST period (px + 8 headroom) and clips the marks", () => {
    const { cum, dom } = make();
    expect(clipWidth(dom.svg)).toBe(108);
    expect(dom.marks.getAttribute("clip-path")).toMatch(/^url\(#/);
    expect(cum.controller()).not.toBeNull();
    expect(cum.getRevealX()).toBe(108);
  });

  it("renders the built-in control with the first period label", () => {
    const { dom } = make();
    const control = dom.host.querySelector(".mv-timeline")!;
    expect(control).not.toBeNull();
    expect(control.querySelector(".mv-timeline-period")!.textContent).toBe("2018");
  });

  it("stepForward() tweens the reveal to the next period's target", () => {
    const { cum, ticker, dom } = make();
    cum.controller()!.stepForward();
    ticker.tick(200); // half of tweenMs 400, linear
    expect(clipWidth(dom.svg)).toBeCloseTo(158, 6); // 108 -> 208 midway
    ticker.tick(200);
    expect(clipWidth(dom.svg)).toBe(208);
  });

  it("the LAST period reveals to endPx (full width)", () => {
    const { cum, ticker, dom } = make();
    cum.controller()!.seek(2);
    ticker.tick(400);
    expect(clipWidth(dom.svg)).toBe(END);
  });

  it("seeking backwards tweens the reveal DOWN (the line retracts)", () => {
    const { cum, ticker, dom } = make();
    cum.controller()!.seek(2);
    ticker.tick(400);
    cum.controller()!.seek(0);
    ticker.tick(200);
    const mid = clipWidth(dom.svg);
    expect(mid).toBeLessThan(END);
    expect(mid).toBeGreaterThan(108);
    ticker.tick(200);
    expect(clipWidth(dom.svg)).toBe(108);
  });

  it("play() on the ticker advances period by period and stops at the end", () => {
    const { cum, ticker, dom } = make({ easing: "linear", tweenMs: 400, speedMs: 800 });
    cum.controller()!.play();
    ticker.tick(800); // step to 2019, tween starts
    ticker.tick(400); // tween done
    expect(clipWidth(dom.svg)).toBe(208);
    ticker.tick(400); // rest of the step window
    ticker.tick(400); // tween to last
    expect(clipWidth(dom.svg)).toBe(END);
    expect(cum.controller()!.getState().playing).toBe(false);
  });

  it("interpolate: false jump-cuts to the target", () => {
    const { cum, dom } = make({ interpolate: false });
    cum.controller()!.stepForward();
    expect(clipWidth(dom.svg)).toBe(208);
  });

  it("reduced motion jump-cuts even with interpolate on", () => {
    const reduced: MotionPreference = { prefersReduced: () => true };
    const { cum, dom } = make({ easing: "linear", tweenMs: 400 }, reduced);
    cum.controller()!.stepForward();
    expect(clipWidth(dom.svg)).toBe(208);
  });

  it("a re-render mid-tween resumes the sweep from its current position", () => {
    const { cum, ticker, dom, rerender } = make();
    cum.controller()!.stepForward();
    ticker.tick(200);
    const before = clipWidth(dom.svg);
    rerender(); // engine re-render rebuilds the clip
    expect(clipWidth(dom.svg)).toBeCloseTo(before, 3);
    ticker.tick(400);
    expect(clipWidth(dom.svg)).toBe(208);
  });

  it("calls onReveal with every applied position", () => {
    const { cum, ticker, onReveal } = make();
    onReveal.mockClear();
    cum.controller()!.stepForward();
    ticker.tick(400);
    expect(onReveal).toHaveBeenCalled();
    expect(onReveal.mock.calls[onReveal.mock.calls.length - 1][0]).toBe(208);
  });

  it("destroy() removes the control and stops the controller", () => {
    const { cum, ticker, dom } = make();
    cum.controller()!.play();
    cum.destroy();
    expect(dom.host.querySelector(".mv-timeline")).toBeNull();
    expect(() => ticker.tick(2000)).not.toThrow();
  });

  it("a null config tears everything down (no control, no controller)", () => {
    const { cum, dom } = make();
    cum.afterRender(null, {
      host: dom.host,
      renderer: "svg",
      svg: dom.svg as SVGElement,
      marksRoot: dom.marks as Element,
      height: 300,
      periods: PERIODS,
      startPx: START,
      endPx: END,
    });
    expect(cum.controller()).toBeNull();
    expect(dom.host.querySelector(".mv-timeline")).toBeNull();
  });
});
