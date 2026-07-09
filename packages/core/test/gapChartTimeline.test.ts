import { describe, it, expect } from "vitest";
import { mountGapChart } from "../src/engine/gapChart";
import { createManualTicker, type ManualTicker } from "../src/animation/ticker";
import { enumerateDatePeriods } from "../src/animation/chartTimeline";
import type { GapChartProps, GapDataItem } from "../src/types";

const years: GapDataItem[] = [
  { label: "Alpha", value1: 10, value2: 30, date: "2018" },
  { label: "Beta", value1: 50, value2: 20, date: "2018" },
  { label: "Alpha", value1: 12, value2: 28, date: "2019" },
  { label: "Beta", value1: 45, value2: 25, date: "2019" },
  { label: "Gamma", value1: 5, value2: 9, date: "2019" },
];

function mount(extra: Partial<GapChartProps> = {}, ticker?: ManualTicker) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountGapChart(
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

describe("enumerateDatePeriods", () => {
  it("returns distinct raw date values sorted ascending", () => {
    expect(enumerateDatePeriods(years)).toEqual(["2018", "2019"]);
  });

  it("sorts numerically when all values are numeric", () => {
    expect(
      enumerateDatePeriods([{ date: 2020 }, { date: 2016 }, { date: 2020 }, { date: 2018 }])
    ).toEqual([2016, 2018, 2020]);
  });

  it("ignores rows without a date", () => {
    expect(enumerateDatePeriods([{ date: "2018" }, {}, { date: "2017" }])).toEqual([
      "2017",
      "2018",
    ]);
  });
});

describe("gap chart timeline (off by default)", () => {
  it("renders no control and exposes no timeline() when the prop is unset", () => {
    const { host, chart } = mount();
    expect(host.querySelector(".mv-timeline")).toBeNull();
    expect(chart.timeline).toBeUndefined();
    chart.destroy();
    host.remove();
  });
});

describe("gap chart timeline (enabled)", () => {
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

  it("keeps the user's own filter while playing (top-1 by value1 per period)", () => {
    const { host, chart } = mount({
      timeline: true,
      filter: { limit: 1, criteria: "value1", sortingDir: "desc", date: "" },
    });
    expect(visibleLabels(host).has("Beta")).toBe(true);
    expect(visibleLabels(host).has("Alpha")).toBe(false);
    chart.timeline!()!.stepForward();
    expect(visibleLabels(host).has("Beta")).toBe(true); // 45 still tops 2019
    expect(visibleLabels(host).has("Gamma")).toBe(false);
    chart.destroy();
    host.remove();
  });

  it("preserves the active period across update()", () => {
    const { host, chart } = mount({ timeline: true });
    chart.timeline!()!.stepForward();
    chart.update({ dataSet: years, width: 600, height: 300, timeline: true });
    expect(visibleLabels(host).has("Gamma")).toBe(true);
    expect(chart.timeline!()!.getState().index).toBe(1);
    chart.destroy();
    host.remove();
  });
});

describe("gap chart timeline control UI", () => {
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

  it("clicking play toggles playback; the scrubber follows steps", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: true }, ticker);
    const tl = chart.timeline!()!;
    const button = host.querySelector<HTMLButtonElement>(".mv-timeline button")!;
    button.click();
    expect(tl.getState().playing).toBe(true);
    ticker.tick(800);
    const range = host.querySelector<HTMLInputElement>('.mv-timeline input[type="range"]')!;
    expect(range.value).toBe("1");
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

  it("formatPeriod customizes the period label", () => {
    const { host, chart } = mount({ timeline: { formatPeriod: p => `Year ${p}` } });
    expect(host.querySelector(".mv-timeline-period")!.textContent).toBe("Year 2018");
    chart.destroy();
    host.remove();
  });
});
