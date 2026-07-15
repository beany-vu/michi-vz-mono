import { describe, it, expect } from "vitest";
import { mountTreemapChart } from "../src/engine/treemapChart";
import { createManualTicker, type ManualTicker } from "../src/animation/ticker";
import type { TreemapChartProps, TreemapNode } from "../src/types";

// ROOT-level `date` tags: a year's snapshot is the root nodes sharing that date.
// Children carry no dates of their own; "Beverages" is shared across both years
// (its children's values change, proving the hierarchy tween), while "Snacks"
// exists only in 2019.
const years: TreemapNode[] = [
  {
    label: "Beverages",
    date: "2018",
    children: [
      { label: "Coffee", value: 100 },
      { label: "Tea", value: 60 },
    ],
  },
  {
    label: "Beverages",
    date: "2019",
    children: [
      { label: "Coffee", value: 200 },
      { label: "Tea", value: 60 },
    ],
  },
  {
    label: "Snacks",
    date: "2019",
    children: [{ label: "Chips", value: 40 }],
  },
];

function mount(extra: Partial<TreemapChartProps> = {}, ticker?: ManualTicker) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountTreemapChart(
    host,
    { dataSet: years, width: 600, height: 400, ...extra },
    ticker ? { ticker } : undefined,
  );
  return { host, chart };
}

const visibleLabels = (host: HTMLElement): Set<string> =>
  new Set(
    Array.from(host.querySelectorAll("rect.tile[data-leaf]")).map((e) =>
      e.getAttribute("data-leaf")!,
    ),
  );

describe("treemap chart timeline (off by default)", () => {
  it("renders no control and exposes no timeline() when the prop is unset", () => {
    const { host, chart } = mount();
    expect(host.querySelector(".mv-timeline")).toBeNull();
    expect(chart.timeline).toBeUndefined();
    // Regression guard: all rows render (no timeline filtering applied) - Chips
    // (2019-only) is present alongside both Beverages snapshots' children.
    expect(visibleLabels(host).has("Chips")).toBe(true);
    chart.destroy();
    host.remove();
  });
});

describe("treemap chart timeline (enabled)", () => {
  it("snapshots the FIRST period on mount and exposes the controller", () => {
    const { host, chart } = mount({ timeline: true });
    const leaves = visibleLabels(host);
    expect(leaves.has("Coffee")).toBe(true);
    expect(leaves.has("Chips")).toBe(false); // Snacks only exists in 2019
    const tl = chart.timeline!()!;
    expect(tl.getState().periods).toEqual(["2018", "2019"]);
    expect(tl.getState().index).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("stepForward() reveals the later-only root node (Snacks/Chips)", () => {
    const { host, chart } = mount({ timeline: true });
    chart.timeline!()!.stepForward();
    expect(visibleLabels(host).has("Chips")).toBe(true);
    chart.destroy();
    host.remove();
  });

  it("plays through periods on the injected ticker", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: { speedMs: 500 } }, ticker);
    const tl = chart.timeline!()!;
    tl.play();
    ticker.tick(500);
    expect(tl.getState().index).toBe(1);
    expect(visibleLabels(host).has("Chips")).toBe(true);
    chart.destroy();
    host.remove();
  });
});

describe("treemap chart timeline control UI", () => {
  it("renders a play button, a scrubber, and the current period label", () => {
    const { host, chart } = mount({ timeline: true });
    const root = host.querySelector<HTMLElement>(".mv-timeline")!;
    expect(root).not.toBeNull();
    expect(root.querySelector("button")).not.toBeNull();
    expect(root.querySelector('input[type="range"]')).not.toBeNull();
    expect(root.querySelector(".mv-timeline-period")!.textContent).toBe("2018");
    chart.destroy();
    host.remove();
  });
});

describe("treemap chart timeline value tweening (hierarchy recursion)", () => {
  it("mid-tween, the shared 'Coffee' leaf's value sits strictly between its two periods' values", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: { easing: "linear", tweenMs: 400 } }, ticker);
    const tl = chart.timeline!()!;
    tl.stepForward(); // 2018 -> 2019, starts the tween from the on-screen 2018 frame
    ticker.tick(200); // halfway through the 400ms tween
    const ctx = chart.getContext() as { leaves: { label: string; value: number }[] };
    const coffee = ctx.leaves.find((l) => l.label === "Coffee")!;
    expect(coffee.value).toBeGreaterThan(100);
    expect(coffee.value).toBeLessThan(200);
    chart.destroy();
    host.remove();
  });

  it("precedence: timeline wins over progressiveDraw when both are set (no reveal clip)", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: true, progressiveDraw: true }, ticker);
    expect(host.querySelector("clipPath rect")).toBeNull();
    chart.destroy();
    host.remove();
  });
});
