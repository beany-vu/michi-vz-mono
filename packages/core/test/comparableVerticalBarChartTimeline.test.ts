import { describe, it, expect } from "vitest";
import { mountComparableVerticalBarChart } from "../src/engine/comparableVerticalBarChart";
import { createManualTicker, type ManualTicker } from "../src/animation/ticker";
import type { ComparableBarDataPoint, ComparableVerticalBarChartProps } from "../src/types";

const years: ComparableBarDataPoint[] = [
  { label: "Alpha", valueBased: 10, valueCompared: 12, date: "2018" },
  { label: "Beta", valueBased: 50, valueCompared: 45, date: "2018" },
  { label: "Alpha", valueBased: 12, valueCompared: 14, date: "2019" },
  { label: "Beta", valueBased: 45, valueCompared: 40, date: "2019" },
  { label: "Gamma", valueBased: 5, valueCompared: 9, date: "2019" },
];

function mount(extra: Partial<ComparableVerticalBarChartProps> = {}, ticker?: ManualTicker) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountComparableVerticalBarChart(
    host,
    { dataSet: years, width: 600, height: 300, ...extra },
    ticker ? { ticker } : undefined
  );
  return { host, chart };
}

const visibleLabels = (host: HTMLElement): Set<string> =>
  new Set(
    Array.from(host.querySelectorAll("[data-label]")).map(e => e.getAttribute("data-label")!)
  );

describe("comparable vertical bar chart timeline (off by default)", () => {
  it("renders no control and exposes no timeline() when the prop is unset", () => {
    const { host, chart } = mount();
    expect(host.querySelector(".mv-timeline")).toBeNull();
    expect(chart.timeline).toBeUndefined();
    chart.destroy();
    host.remove();
  });
});

describe("comparable vertical bar chart timeline (enabled)", () => {
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

  it("stepForward() advances to the next period's snapshot", () => {
    const { host, chart } = mount({ timeline: true });
    chart.timeline!()!.stepForward();
    expect(visibleLabels(host).has("Gamma")).toBe(true);
    chart.destroy();
    host.remove();
  });

  it("plays through periods on the injected ticker and stops at the end", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: { speedMs: 500 } }, ticker);
    const tl = chart.timeline!()!;
    tl.play();
    ticker.tick(500);
    expect(tl.getState().index).toBe(1);
    expect(visibleLabels(host).has("Gamma")).toBe(true);
    expect(tl.getState().playing).toBe(false); // reached the last period, non-loop
    chart.destroy();
    host.remove();
  });
});

describe("comparable vertical bar chart timeline control UI", () => {
  it("renders a play button, a scrubber, and the current period label", () => {
    const { host, chart } = mount({ timeline: true });
    const root = host.querySelector<HTMLElement>(".mv-timeline")!;
    expect(root).not.toBeNull();
    const button = root.querySelector("button")!;
    const range = root.querySelector<HTMLInputElement>('input[type="range"]')!;
    const label = root.querySelector(".mv-timeline-period")!;
    expect(button).not.toBeNull();
    expect(range.max).toBe("1");
    expect(range.value).toBe("0");
    expect(label.textContent).toBe("2018");
    chart.destroy();
    host.remove();
  });

  it("scrubbing seeks to the chosen period", () => {
    const { host, chart } = mount({ timeline: true });
    const range = host.querySelector<HTMLInputElement>('.mv-timeline input[type="range"]')!;
    range.value = "1";
    range.dispatchEvent(new Event("input", { bubbles: true }));
    expect(chart.timeline!()!.getState().index).toBe(1);
    expect(visibleLabels(host).has("Gamma")).toBe(true);
    chart.destroy();
    host.remove();
  });

  it("showControl: false renders no control but the API still works", () => {
    const { host, chart } = mount({ timeline: { showControl: false } });
    expect(host.querySelector(".mv-timeline")).toBeNull();
    chart.timeline!()!.stepForward();
    expect(visibleLabels(host).has("Gamma")).toBe(true);
    chart.destroy();
    host.remove();
  });
});
