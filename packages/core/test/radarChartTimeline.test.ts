import { describe, it, expect } from "vitest";
import { mountRadarChart } from "../src/engine/radarChart";
import { createManualTicker, type ManualTicker } from "../src/animation/ticker";
import type { RadarChartProps, RadarDataItem } from "../src/types";

const axes = ["Speed", "Power", "Range"];

// "Model B" only exists in 2019 - the first-period snapshot must omit it.
const series: RadarDataItem[] = [
  { label: "Model A", period: "2018", values: [4, 4, 4] },
  { label: "Model A", period: "2019", values: [8, 8, 8] },
  { label: "Model B", period: "2019", values: [5, 5, 5] },
];

function mount(extra: Partial<RadarChartProps> = {}, ticker?: ManualTicker) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountRadarChart(
    host,
    { series, axes, width: 400, height: 400, ...extra },
    ticker ? { ticker } : undefined,
  );
  return { host, chart };
}

const visibleLabels = (host: HTMLElement): Set<string> =>
  new Set(
    Array.from(host.querySelectorAll<SVGPolygonElement>("polygon.radar-area")).map((p) =>
      p.getAttribute("data-label"),
    ),
  );

describe("radar chart timeline (off by default)", () => {
  it("renders no control and exposes no timeline() when the prop is unset", () => {
    const { host, chart } = mount();
    expect(host.querySelector(".mv-timeline")).toBeNull();
    expect(chart.timeline).toBeUndefined();
    // Regression guard: both "Model A" rows render as separate polygons (no filtering).
    expect(host.querySelectorAll("polygon.radar-area").length).toBe(3);
    chart.destroy();
    host.remove();
  });

  it("guard: the tooltip's axis-label `date` semantics still work with `timeline` set", () => {
    // Radar's own `date` meaning (a per-axis label, attached ad hoc to the tooltip
    // datum) is entirely separate machinery from the `period` row tag - hovering a
    // polygon still renders one line per axis using its label, unaffected.
    const { host, chart } = mount({ timeline: true });
    const poly = host.querySelector<SVGPolygonElement>("polygon.radar-area")!;
    poly.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    const tooltip = host.querySelector<HTMLElement>(".tooltip")!;
    for (const axis of axes) expect(tooltip.innerHTML).toContain(axis);
    chart.destroy();
    host.remove();
  });
});

describe("radar chart timeline (enabled)", () => {
  it("snapshots the FIRST period on mount and exposes the controller", () => {
    const { host, chart } = mount({ timeline: true });
    const labels = visibleLabels(host);
    expect(labels.has("Model A")).toBe(true);
    expect(labels.has("Model B")).toBe(false); // Model B only exists in 2019
    expect(host.querySelectorAll("polygon.radar-area").length).toBe(1);
    const tl = chart.timeline!()!;
    expect(tl.getState().periods).toEqual(["2018", "2019"]);
    expect(tl.getState().index).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("stepForward() advances to the next period's snapshot", () => {
    const { host, chart } = mount({ timeline: true });
    chart.timeline!()!.stepForward();
    expect(visibleLabels(host).has("Model B")).toBe(true);
    expect(host.querySelectorAll("polygon.radar-area").length).toBe(2);
    chart.destroy();
    host.remove();
  });

  it("plays through periods on the injected ticker", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: { speedMs: 500, interpolate: false } }, ticker);
    const tl = chart.timeline!()!;
    tl.play();
    ticker.tick(500);
    expect(tl.getState().index).toBe(1);
    expect(visibleLabels(host).has("Model B")).toBe(true);
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

  it("mid-tween, a shared series' per-axis value is STRICTLY between the two periods' values", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: { easing: "linear", tweenMs: 400 } }, ticker);
    chart.timeline!()!.stepForward(); // start tweening Model A: 4 -> 8 per axis
    ticker.tick(200); // halfway through the 400ms tween
    const ctx = chart.getContext()!;
    if (ctx.chartType === "radar-chart") {
      const modelA = ctx.series.find((s) => s.label === "Model A")!;
      const speed = modelA.byAxis.find((b) => b.axis === "Speed")!.value;
      expect(speed).toBeGreaterThan(4);
      expect(speed).toBeLessThan(8);
    }
    chart.destroy();
    host.remove();
  });
});
