import { describe, it, expect } from "vitest";
import { mountBubbleChart } from "../src/engine/bubbleChart";
import { createManualTicker, type ManualTicker } from "../src/animation/ticker";
import type { BubbleChartProps, BubbleDataItem } from "../src/types";

const years: BubbleDataItem[] = [
  { label: "Alpha", value: 10, date: "2018" },
  { label: "Beta", value: 30, date: "2018" },
  { label: "Alpha", value: 12, date: "2019" },
  { label: "Beta", value: 28, date: "2019" },
  { label: "Gamma", value: 9, date: "2019" },
];

function mount(extra: Partial<BubbleChartProps> = {}, ticker?: ManualTicker) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountBubbleChart(
    host,
    { dataSet: years, width: 400, height: 300, ...extra },
    ticker ? { ticker } : undefined
  );
  return { host, chart };
}

const visibleLabels = (host: HTMLElement): Set<string> =>
  new Set(
    Array.from(host.querySelectorAll("[data-label]")).map((e) => e.getAttribute("data-label")!)
  );

describe("bubble chart timeline (off by default)", () => {
  it("renders no control and exposes no timeline() when the prop is unset", () => {
    const { host, chart } = mount();
    expect(host.querySelector(".mv-timeline")).toBeNull();
    expect(chart.timeline).toBeUndefined();
    // Regression guard: all rows render (no timeline filtering applied).
    expect(visibleLabels(host).has("Gamma")).toBe(true);
    chart.destroy();
    host.remove();
  });
});

describe("bubble chart timeline (enabled)", () => {
  it("snapshots the FIRST period on mount and exposes the controller", () => {
    const { host, chart } = mount({ timeline: true });
    const labels = visibleLabels(host);
    expect(labels.has("Alpha")).toBe(true);
    expect(labels.has("Gamma")).toBe(false); // Gamma only exists in 2019
    const tl = chart.timeline!()!;
    expect(tl.getState().periods).toEqual(["2018", "2019"]);
    expect(tl.getState().index).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("stepForward() advances to the next period's snapshot (relayouts the force cluster)", () => {
    const { host, chart } = mount({ timeline: true });
    chart.timeline!()!.stepForward();
    expect(visibleLabels(host).has("Gamma")).toBe(true);
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
    expect(visibleLabels(host).has("Gamma")).toBe(true);
    chart.destroy();
    host.remove();
  });
});

describe("bubble chart timeline control UI", () => {
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
