import { describe, it, expect, vi } from "vitest";
import { createEngineReveal, resolveReveal } from "../src/animation/reveal";
import { createManualTicker } from "../src/animation/ticker";
import type { MotionPreference } from "../src/animation/reducedMotion";

// The generic progressiveDraw reveal: a hover cap (getRevealX) so undrawn marks are
// not inspectable mid-wipe, and a per-frame onReveal hook for marks that live
// outside the clipped group (e.g. text laid out under the plot).

function makeDom() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const marks = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svg.appendChild(marks);
  return { svg, marks };
}

const args = (dom: ReturnType<typeof makeDom>, extra: Record<string, unknown> = {}) => ({
  renderer: "svg",
  svg: dom.svg as SVGElement,
  marksRoot: dom.marks as Element,
  height: 300,
  startPx: 0,
  endPx: 600,
  ...extra,
});

describe("createEngineReveal: getRevealX and onReveal", () => {
  it("getRevealX is null before any reveal and when the feature is off", () => {
    const rv = createEngineReveal({ ticker: createManualTicker() });
    expect(rv.getRevealX()).toBeNull();
    rv.afterRender(null, args(makeDom()));
    expect(rv.getRevealX()).toBeNull();
  });

  it("reports the wipe position while it runs, then null once fully drawn", () => {
    const ticker = createManualTicker();
    const rv = createEngineReveal({ ticker });
    rv.afterRender(resolveReveal({ durationMs: 1000, easing: "linear" }), args(makeDom()));
    expect(rv.getRevealX()).toBe(0);
    ticker.tick(500);
    expect(rv.getRevealX()).toBeCloseTo(300, 6);
    ticker.tick(500);
    expect(rv.getRevealX()).toBeNull();
  });

  it("calls onReveal with every applied position (svg and painted renderers)", () => {
    const ticker = createManualTicker();
    const rv = createEngineReveal({ ticker });
    const onReveal = vi.fn();
    rv.afterRender(
      resolveReveal({ durationMs: 1000, easing: "linear" }),
      args(makeDom(), { onReveal }),
    );
    ticker.tick(500);
    expect(onReveal).toHaveBeenLastCalledWith(300);

    const redraw = vi.fn();
    const onReveal2 = vi.fn();
    const rv2 = createEngineReveal({ ticker });
    rv2.afterRender(
      resolveReveal({ durationMs: 1000, easing: "linear" }),
      args(makeDom(), { renderer: "canvas", canvasRedraw: redraw, onReveal: onReveal2 }),
    );
    ticker.tick(250);
    expect(redraw).toHaveBeenLastCalledWith(150);
    expect(onReveal2).toHaveBeenLastCalledWith(150);
  });

  it("reduced motion: fully drawn at once, onReveal gets the end, no cap", () => {
    const reduced: MotionPreference = { prefersReduced: () => true };
    const rv = createEngineReveal({ ticker: createManualTicker(), motion: reduced });
    const onReveal = vi.fn();
    rv.afterRender(resolveReveal(true), args(makeDom(), { onReveal }));
    expect(onReveal).toHaveBeenLastCalledWith(600);
    expect(rv.getRevealX()).toBeNull();
  });
});
