import { describe, it, expect } from "vitest";
import { wireStickyDismiss } from "../src/render/stickyDismiss";
import { mountGapChart } from "../src/engine/gapChart";
import type { GapDataItem } from "../src/types";

// Legacy parity: a pinned (sticky) tooltip must dismiss on a click anywhere
// outside the host + tooltip, and destroy() must remove the document listener
// (consumers key-remount charts constantly - before this, each mount leaked a
// tooltip click listener and 16 of 17 engines never dismissed on outside click).

const makeDom = () => {
  const host = document.createElement("div");
  const tooltip = document.createElement("div");
  tooltip.className = "tooltip sticky";
  tooltip.style.visibility = "visible";
  host.appendChild(tooltip);
  const outside = document.createElement("button");
  document.body.append(host, outside);
  return { host, tooltip, outside };
};

describe("wireStickyDismiss", () => {
  it("dismisses a sticky tooltip on a click outside host and tooltip", () => {
    const { host, tooltip, outside } = makeDom();
    let sticky = true;
    const dispose = wireStickyDismiss(host, tooltip, {
      isSticky: () => sticky,
      unpin: () => {
        sticky = false;
      },
    });
    outside.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(sticky).toBe(false);
    expect(tooltip.classList.contains("sticky")).toBe(false);
    expect(tooltip.style.visibility).toBe("hidden");
    dispose();
    host.remove();
    outside.remove();
  });

  it("ignores outside clicks while not sticky, and clicks inside the host", () => {
    const { host, tooltip, outside } = makeDom();
    let sticky = false;
    let unpins = 0;
    const dispose = wireStickyDismiss(host, tooltip, {
      isSticky: () => sticky,
      unpin: () => {
        unpins += 1;
      },
    });
    outside.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(unpins).toBe(0);
    sticky = true;
    host.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(unpins).toBe(0); // host clicks are the engine's own pin-toggle path
    dispose();
    host.remove();
    outside.remove();
  });

  it("dismisses when the tooltip itself is clicked", () => {
    const { host, tooltip, outside } = makeDom();
    let sticky = true;
    const dispose = wireStickyDismiss(host, tooltip, {
      isSticky: () => sticky,
      unpin: () => {
        sticky = false;
      },
    });
    tooltip.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(sticky).toBe(false);
    expect(tooltip.style.visibility).toBe("hidden");
    dispose();
    host.remove();
    outside.remove();
  });

  it("dispose removes both listeners (no dismissal after dispose)", () => {
    const { host, tooltip, outside } = makeDom();
    let sticky = true;
    const dispose = wireStickyDismiss(host, tooltip, {
      isSticky: () => sticky,
      unpin: () => {
        sticky = false;
      },
    });
    dispose();
    outside.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    tooltip.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(sticky).toBe(true);
    expect(tooltip.classList.contains("sticky")).toBe(true);
    host.remove();
    outside.remove();
  });
});

describe("gapChart sticky tooltip dismiss (jsdom, svg renderer)", () => {
  const sample: GapDataItem[] = [
    { label: "Alpha", value1: 10, value2: 30, difference: -20, date: "2024" },
    { label: "Beta", value1: 50, value2: 20, difference: 30, date: "2024" },
  ];

  it("pins on mark click, dismisses on document click outside, survives destroy", () => {
    const host = document.createElement("div");
    const outside = document.createElement("button");
    document.body.append(host, outside);
    const chart = mountGapChart(host, { dataSet: sample, title: "Demo", width: 600, height: 300 });
    const tooltip = host.querySelector<HTMLElement>(".tooltip")!;
    const mark = host.querySelector<SVGRectElement>("rect.gap-bar")!;

    mark.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(tooltip.classList.contains("sticky")).toBe(true);
    expect(tooltip.style.visibility).toBe("visible");

    outside.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(tooltip.classList.contains("sticky")).toBe(false);
    expect(tooltip.style.visibility).toBe("hidden");

    // re-pin, then destroy: the document listener must be gone (no throw, no effect)
    mark.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(tooltip.classList.contains("sticky")).toBe(true);
    chart.destroy();
    expect(() =>
      outside.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    ).not.toThrow();
    host.remove();
    outside.remove();
  });
});
