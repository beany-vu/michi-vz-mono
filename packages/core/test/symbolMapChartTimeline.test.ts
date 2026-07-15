import { describe, it, expect } from "vitest";
import { mountSymbolMapChart } from "../src/engine/symbolMapChart";
import { createManualTicker, type ManualTicker } from "../src/animation/ticker";
import type { SymbolMapChartProps, SymbolMapDataItem } from "../src/types";

// Vietnam only exists in the 2019 snapshot - exercises the de-overlap force
// layout re-placing symbols per period.
const years: SymbolMapDataItem[] = [
  { id: "usa-2018", label: "United States", lng: -95, lat: 37, value: 100, date: "2018" },
  { id: "deu-2018", label: "Germany", lng: 10, lat: 51, value: 60, date: "2018" },
  { id: "usa-2019", label: "United States", lng: -95, lat: 37, value: 110, date: "2019" },
  { id: "deu-2019", label: "Germany", lng: 10, lat: 51, value: 65, date: "2019" },
  { id: "vnm-2019", label: "Vietnam", lng: 106, lat: 16, value: 20, date: "2019" },
];

function mount(extra: Partial<SymbolMapChartProps> = {}, ticker?: ManualTicker) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountSymbolMapChart(
    host,
    { dataSet: years, width: 600, height: 400, ...extra },
    ticker ? { ticker } : undefined,
  );
  return { host, chart };
}

const visibleLabels = (host: HTMLElement): Set<string> =>
  new Set(
    Array.from(host.querySelectorAll("circle.symbol[data-label]")).map((e) =>
      e.getAttribute("data-label")!,
    ),
  );

describe("symbol map chart timeline (off by default)", () => {
  it("renders no control and exposes no timeline() when the prop is unset", () => {
    const { host, chart } = mount();
    expect(host.querySelector(".mv-timeline")).toBeNull();
    expect(chart.timeline).toBeUndefined();
    chart.destroy();
    host.remove();
  });
});

describe("symbol map chart timeline (enabled)", () => {
  it("snapshots the FIRST period on mount and exposes the controller", () => {
    const { host, chart } = mount({ timeline: true });
    const labels = visibleLabels(host);
    expect(labels.has("United States")).toBe(true);
    expect(labels.has("Vietnam")).toBe(false); // Vietnam only exists in 2019
    const tl = chart.timeline!()!;
    expect(tl.getState().periods).toEqual(["2018", "2019"]);
    expect(tl.getState().index).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("stepForward() reveals the later-only symbol (the force layout re-places per period)", () => {
    const { host, chart } = mount({ timeline: true });
    chart.timeline!()!.stepForward();
    expect(visibleLabels(host).has("Vietnam")).toBe(true);
    // Exactly 3 symbols settle in the 2019 snapshot.
    expect(host.querySelectorAll("circle.symbol").length).toBe(3);
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
    expect(visibleLabels(host).has("Vietnam")).toBe(true);
    expect(tl.getState().playing).toBe(false); // reached the last period, non-loop
    chart.destroy();
    host.remove();
  });
});

describe("symbol map chart timeline control UI", () => {
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
    expect(visibleLabels(host).has("Vietnam")).toBe(true);
    chart.destroy();
    host.remove();
  });

  it("showControl: false renders no control but the API still works", () => {
    const { host, chart } = mount({ timeline: { showControl: false } });
    expect(host.querySelector(".mv-timeline")).toBeNull();
    chart.timeline!()!.stepForward();
    expect(visibleLabels(host).has("Vietnam")).toBe(true);
    chart.destroy();
    host.remove();
  });
});
