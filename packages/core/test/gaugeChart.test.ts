import { describe, it, expect, vi } from "vitest";
import { mountGaugeChart } from "../src/engine/gaugeChart";
import type { GaugeChartProps, GaugeChartContext } from "../src/types";

const sample = [
  { label: "World", value: 40, color: "#111111" },
  { label: "Africa", value: 25, color: "#222222" },
  { label: "Kenya", value: 96.14, color: "#333333" },
];

function mount(extra: Partial<GaugeChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountGaugeChart(host, {
    dataSet: sample,
    width: 200,
    height: 200,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    ...extra,
  });
  return { host, chart };
}

const arcs = (host: HTMLElement) =>
  Array.from(host.querySelectorAll<SVGPathElement>("path.gauge-arc"));
const tracks = (host: HTMLElement) =>
  Array.from(host.querySelectorAll<SVGPathElement>("path.gauge-track"));

describe("mountGaugeChart (jsdom)", () => {
  it("renders a track + value arc per ring carrying the colour contract", () => {
    const { host, chart } = mount();
    expect(tracks(host)).toHaveLength(3);
    const a = arcs(host);
    expect(a).toHaveLength(3);
    expect(a.map((p) => p.getAttribute("data-label"))).toEqual(["World", "Africa", "Kenya"]);
    expect(a.map((p) => p.getAttribute("data-label-safe"))).toEqual(["World", "Africa", "Kenya"]);
    expect(a[0].getAttribute("stroke")).toBe("#111111");
    chart.destroy();
    host.remove();
  });

  it("encodes value/max as the arc's dash length; rings shrink inward", () => {
    const { host, chart } = mount();
    const a = arcs(host);
    // Ring 1 ("Africa", 25%): dash length = circumference / 4.
    const dash = a[1].getAttribute("stroke-dasharray")!.split(" ").map(Number);
    expect(dash[0]).toBeCloseTo(dash[1] / 4, 5);
    // Outer ring radius (from the path's top point) is larger than the inner's.
    const topY = (p: SVGPathElement) => Number(p.getAttribute("d")!.match(/M \S+ (\S+)/)![1]);
    expect(topY(a[0])).toBeLessThan(topY(a[2]));
    chart.destroy();
    host.remove();
  });

  it("renders a null-value ring as track only (zero sweep), not as no-data", () => {
    const { host, chart } = mount({
      dataSet: [
        { label: "A", value: null },
        { label: "B", value: 50 },
      ],
    });
    const a = arcs(host);
    expect(a).toHaveLength(2);
    expect(Number(a[0].getAttribute("stroke-dasharray")!.split(" ")[0])).toBe(0);
    expect(host.querySelector(".mv-nodata")).toBeNull();
    expect(host.getAttribute("data-mv-state")).toBe("ready");
    chart.destroy();
    host.remove();
  });

  it("shows the defaultActive (inner) ring in the centre label and swaps on hover", () => {
    const onHighlightItem = vi.fn();
    const { host, chart } = mount({ onHighlightItem });
    const center = host.querySelector<HTMLDivElement>(".mv-gauge-center")!;
    expect(center.textContent).toContain("Kenya");
    expect(center.textContent).toContain("96.14%");

    const outerCell = host.querySelectorAll<SVGGElement>("g.gauge-ring-cell")[0];
    outerCell.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));
    expect(onHighlightItem).toHaveBeenCalledWith(["World"]);
    expect(host.querySelector(".mv-gauge-center")!.textContent).toContain("World");
    expect(host.querySelector(".mv-gauge-center")!.textContent).toContain("40%");

    host
      .querySelectorAll<SVGGElement>("g.gauge-ring-cell")[0]
      .dispatchEvent(new MouseEvent("mouseleave", { bubbles: false }));
    expect(onHighlightItem).toHaveBeenLastCalledWith([]);
    expect(host.querySelector(".mv-gauge-center")!.textContent).toContain("Kenya");
    chart.destroy();
    host.remove();
  });

  it("uses noValueLabel for an active ring without data and supports centerContent", () => {
    const { host, chart } = mount({
      dataSet: [{ label: "Only", value: null }],
      noValueLabel: "n/a",
    });
    expect(host.querySelector(".mv-gauge-center")!.textContent).toContain("n/a");
    chart.update({
      dataSet: [{ label: "Only", value: 12 }],
      width: 200,
      height: 200,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      centerContent: (ring) => `<i>${ring ? `${ring.label}:${ring.value}` : "none"}</i>`,
    });
    expect(host.querySelector(".mv-gauge-center i")!.textContent).toBe("Only:12");
    chart.destroy();
    host.remove();
  });

  it("applies per-ring opacity arrays and active emphasis", () => {
    const { host, chart } = mount({
      ringOpacity: [0.2, 0.5, 0.7],
      activeStyle: { opacity: 1 },
      defaultActive: "inner",
    });
    const a = arcs(host);
    expect(a[0].getAttribute("opacity")).toBe("0.2");
    expect(a[1].getAttribute("opacity")).toBe("0.5");
    expect(a[2].getAttribute("opacity")).toBe("1"); // inner is active
    chart.destroy();
    host.remove();
  });

  it("drops disabledItems and clamps out-of-range values with a warning", () => {
    const onDataWarning = vi.fn();
    const { host, chart } = mount({
      dataSet: [
        { label: "A", value: 150 },
        { label: "B", value: 30 },
      ],
      disabledItems: ["B"],
      onDataWarning,
    });
    const a = arcs(host);
    expect(a).toHaveLength(1);
    const dash = a[0].getAttribute("stroke-dasharray")!.split(" ").map(Number);
    expect(dash[0]).toBeCloseTo(dash[1], 5); // clamped to max = full sweep
    expect(
      onDataWarning.mock.calls[0][0].some((w: { message: string }) =>
        w.message.includes("outside"),
      ),
    ).toBe(true);
    chart.destroy();
    host.remove();
  });

  it("exposes rings, fractions, legendData, and stats on the context", () => {
    const { chart, host } = mount();
    const ctx = chart.getContext() as GaugeChartContext;
    expect(ctx.chartType).toBe("gauge-chart");
    expect(ctx.max).toBe(100);
    expect(ctx.rings.map((r) => r.label)).toEqual(["World", "Africa", "Kenya"]);
    expect(ctx.rings[1].fraction).toBeCloseTo(0.25, 5);
    expect(ctx.stats.largestRing).toEqual({ label: "Kenya", value: 96.14 });
    expect(ctx.legendData?.map((l) => l.label)).toEqual(["World", "Africa", "Kenya"]);
    chart.destroy();
    host.remove();
  });

  it("resolves transparent arcs under skipColorMappingDispatch and never dispatches a mapping", () => {
    const onColorMappingGenerated = vi.fn();
    const { host, chart } = mount({
      dataSet: [{ label: "X", value: 10 }],
      skipColorMappingDispatch: true,
      onColorMappingGenerated,
    });
    expect(arcs(host)[0].getAttribute("stroke")).toBe("transparent");
    expect(onColorMappingGenerated).not.toHaveBeenCalled();
    chart.destroy();
    host.remove();
  });

  it("mounts with the canvas renderer (jsdom no-op draw) and reports it on the context", () => {
    const { host, chart } = mount({ renderer: "canvas" });
    expect(host.querySelector("canvas.gauge-chart-canvas")).not.toBeNull();
    expect(host.querySelector("path.gauge-arc")).toBeNull(); // no SVG marks in canvas mode
    expect((chart.getContext() as GaugeChartContext).renderer).toBe("canvas");
    chart.destroy();
    host.remove();
  });

  it("shows the default no-data overlay only for an empty dataSet", () => {
    const { host, chart } = mount({ dataSet: [] });
    expect(host.getAttribute("data-mv-state")).toBe("nodata");
    expect(host.querySelector(".mv-gauge-center")!.style.display).toBe("none");
    chart.destroy();
    host.remove();
  });
});
