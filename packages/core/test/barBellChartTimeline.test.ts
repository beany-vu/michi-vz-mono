import { describe, it, expect } from "vitest";
import { mountBarBellChart } from "../src/engine/barBellChart";
import { createManualTicker, type ManualTicker } from "../src/animation/ticker";
import type { BarBellChartProps, BarBellDataRow } from "../src/types";

const keys = ["Fruit Sales", "Veg"];

// "Region B" only exists in 2019 - the first-period snapshot must omit it.
const dataSet: BarBellDataRow[] = [
  { period: "2018", date: "Region A", "Fruit Sales": 10, Veg: 5 },
  { period: "2019", date: "Region A", "Fruit Sales": 14, Veg: 8 },
  { period: "2019", date: "Region B", "Fruit Sales": 9, Veg: 12 },
];

function mount(extra: Partial<BarBellChartProps> = {}, ticker?: ManualTicker) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountBarBellChart(
    host,
    { dataSet, keys, width: 600, height: 300, ...extra },
    ticker ? { ticker } : undefined
  );
  return { host, chart };
}

const bandLabels = (host: HTMLElement): Set<string> =>
  new Set(
    Array.from(host.querySelectorAll<HTMLElement>(".mv-y-axis .mv-ylabel span")).map(
      (t) => t.textContent ?? ""
    )
  );

describe("bar-bell chart timeline (off by default)", () => {
  it("renders no control and exposes no timeline() when the prop is unset", () => {
    const { host, chart } = mount();
    expect(host.querySelector(".mv-timeline")).toBeNull();
    expect(chart.timeline).toBeUndefined();
    // Regression guard: all 3 rows render (no timeline filtering applied).
    expect(host.querySelectorAll(".bar-bell-cap").length).toBe(6); // 3 rows x 2 keys
    chart.destroy();
    host.remove();
  });

  it("guard: `date` still renders as the category/band, untouched by the timeline field", () => {
    const { host, chart } = mount({ timeline: true });
    // Both periods' bands render "Region A" - the row's real date survives the
    // filter/tween round-trip through the timeline's period-tag machinery.
    expect(bandLabels(host).has("Region A")).toBe(true);
    chart.destroy();
    host.remove();
  });
});

describe("bar-bell chart timeline (enabled)", () => {
  it("snapshots the FIRST period on mount and exposes the controller", () => {
    const { host, chart } = mount({ timeline: true });
    expect(bandLabels(host).has("Region A")).toBe(true);
    expect(bandLabels(host).has("Region B")).toBe(false); // Region B only exists in 2019
    expect(host.querySelectorAll(".bar-bell-cap").length).toBe(2); // 1 row x 2 keys
    const tl = chart.timeline!()!;
    expect(tl.getState().periods).toEqual(["2018", "2019"]);
    expect(tl.getState().index).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("stepForward() advances to the next period's snapshot", () => {
    const { host, chart } = mount({ timeline: true });
    chart.timeline!()!.stepForward();
    expect(bandLabels(host).has("Region B")).toBe(true);
    expect(host.querySelectorAll(".bar-bell-cap").length).toBe(4); // 2 rows x 2 keys
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
    expect(bandLabels(host).has("Region B")).toBe(true);
    chart.destroy();
    host.remove();
  });

  it("renders the built-in play/scrub control", () => {
    const { host, chart } = mount({ timeline: true });
    const root = host.querySelector<HTMLElement>(".mv-timeline")!;
    expect(root).not.toBeNull();
    expect(root.querySelector("button")).not.toBeNull();
    expect(root.querySelector('input[type="range"]')).not.toBeNull();
    chart.destroy();
    host.remove();
  });
});
