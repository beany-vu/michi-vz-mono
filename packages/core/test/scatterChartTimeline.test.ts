import { describe, it, expect } from "vitest";
import { mountScatterChart } from "../src/engine/scatterChart";
import { createManualTicker, type ManualTicker } from "../src/animation/ticker";
import type { ScatterChartProps, ScatterDataPoint } from "../src/types";

const dataSet: ScatterDataPoint[] = [
  { label: "Alpha", x: 1, y: 2, d: 5, date: "2018" },
  { label: "Beta", x: 3, y: 6, d: 10, date: "2018" },
  { label: "Alpha", x: 2, y: 4, d: 6, date: "2019" },
  { label: "Beta", x: 4, y: 8, d: 9, date: "2019" },
  { label: "Gamma", x: 6, y: 12, d: 3, date: "2019" },
];

function mount(extra: Partial<ScatterChartProps> = {}, ticker?: ManualTicker) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountScatterChart(
    host,
    { dataSet, width: 600, height: 300, xAxisDataType: "number", ...extra },
    ticker ? { ticker } : undefined,
  );
  return { host, chart };
}

const visibleLabels = (host: HTMLElement): Set<string> =>
  new Set(
    Array.from(host.querySelectorAll("[data-label]")).map((e) => e.getAttribute("data-label")!),
  );

describe("scatter chart timeline", () => {
  it("is off by default: no control, no timeline()", () => {
    const { host, chart } = mount();
    expect(host.querySelector(".mv-timeline")).toBeNull();
    expect(chart.timeline).toBeUndefined();
    chart.destroy();
    host.remove();
  });

  it("snapshots the first period on mount and steps through periods", () => {
    const { host, chart } = mount({ timeline: true });
    expect(visibleLabels(host).has("Gamma")).toBe(false);
    const tl = chart.timeline!()!;
    expect(tl.getState().periods).toEqual(["2018", "2019"]);
    tl.stepForward();
    expect(visibleLabels(host).has("Gamma")).toBe(true);
    chart.destroy();
    host.remove();
  });

  it("plays on the injected ticker", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: { speedMs: 600 } }, ticker);
    const tl = chart.timeline!()!;
    tl.play();
    ticker.tick(600);
    expect(tl.getState().index).toBe(1);
    expect(visibleLabels(host).has("Gamma")).toBe(true);
    chart.destroy();
    host.remove();
  });

  it("renders the built-in control with the current period", () => {
    const { host, chart } = mount({ timeline: true });
    const root = host.querySelector<HTMLElement>(".mv-timeline")!;
    expect(root).not.toBeNull();
    expect(root.querySelector(".mv-timeline-period")!.textContent).toBe("2018");
    chart.destroy();
    host.remove();
  });

  it("getContext() reflects only the active period's points", () => {
    const { host, chart } = mount({ timeline: true });
    const before = JSON.stringify(chart.getContext());
    chart.timeline!()!.stepForward();
    const after = JSON.stringify(chart.getContext());
    expect(before).not.toBe(after);
    chart.destroy();
    host.remove();
  });
});
