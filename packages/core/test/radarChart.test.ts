import { describe, it, expect, vi } from "vitest";
import { mountRadarChart } from "../src/engine/radarChart";
import { sanitizeForClassName } from "../src/math/sanitize";
import type { RadarChartProps, RadarDataItem } from "../src/types";

const axes = ["Speed", "Power", "Range", "Agility", "Cost"];
const series: RadarDataItem[] = [
  { label: "Model A", color: "#f00", values: [8, 6, 7, 9, 5] },
  { label: "Model B", color: "#00f", values: [5, 9, 6, 4, 8] },
];

function mount(extra: Partial<RadarChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountRadarChart(host, {
    series,
    axes,
    title: "Demo",
    width: 500,
    height: 500,
    ...extra,
  });
  return { host, chart };
}

describe("mountRadarChart (jsdom)", () => {
  it("renders one polygon per series carrying data-label-safe, with N vertices", () => {
    const { host, chart } = mount();
    const polys = host.querySelectorAll<SVGPolygonElement>("polygon.radar-area");
    expect(polys.length).toBe(2);
    const safes = Array.from(polys).map((p) => p.getAttribute("data-label-safe"));
    expect(safes).toContain(sanitizeForClassName("Model A")); // "Model_A"
    // each polygon has 5 vertices (5 axes)
    expect(polys[0].getAttribute("points")!.trim().split(" ").length).toBe(5);
    chart.destroy();
    host.remove();
  });

  it("keeps the top pole label clear of the title band (clamped when a title renders)", () => {
    // Wide chart -> height-limited radius -> the top label naturally overshoots
    // into the title band (y = cy - radius - 25 < margin.top/2 + 18).
    const margin = { top: 60, right: 80, bottom: 60, left: 80 };
    const titled = mount({ margin, width: 800 });
    const untitled = mount({ margin, width: 800, title: undefined });
    const topLabelY = (host: HTMLElement) =>
      Math.min(
        ...Array.from(host.querySelectorAll<SVGTextElement>(".pole-label")).map((t) =>
          Number(t.getAttribute("y")),
        ),
      );
    // With a title (baseline at margin.top/2) the top label may not climb into it.
    expect(topLabelY(titled.host)).toBeGreaterThanOrEqual(margin.top / 2 + 18);
    // Without a title the label keeps its natural radius+25 overshoot position.
    expect(topLabelY(untitled.host)).toBeLessThan(margin.top / 2 + 18);
    titled.chart.destroy();
    titled.host.remove();
    untitled.chart.destroy();
    untitled.host.remove();
  });

  it("renders a polar grid (rings + spokes + axis labels)", () => {
    const { host, chart } = mount({ rings: 4 });
    expect(host.querySelectorAll(".mv-radar-grid circle").length).toBe(4); // 4 rings (dashed circles)
    expect(host.querySelectorAll(".mv-radar-grid line").length).toBe(5); // 5 spokes
    expect(host.querySelectorAll(".mv-radar-grid .pole-label").length).toBe(5); // 5 axis (pole) labels
    expect(host.querySelectorAll(".mv-radar-grid .radial-label").length).toBe(4); // 4 ring-value labels
    chart.destroy();
    host.remove();
  });

  it("excludes disabled series", () => {
    const { host, chart } = mount({ disabledItems: ["Model B"] });
    expect(host.querySelectorAll("polygon.radar-area").length).toBe(1);
    chart.destroy();
    host.remove();
  });

  it("builds an a11y mirror with one row per series + axis columns", () => {
    const { host, chart } = mount();
    expect(host.querySelectorAll(".mv-a11y table tbody tr").length).toBe(2);
    const headers = Array.from(host.querySelectorAll(".mv-a11y table thead th")).map(
      (t) => t.textContent,
    );
    expect(headers).toEqual(["Series", ...axes]);
    chart.destroy();
    host.remove();
  });

  it("exposes a radar context, identical in SVG and canvas (renderer aside)", () => {
    const a = mount({ renderer: "svg" });
    const b = mount({ renderer: "canvas" });
    const ca = a.chart.getContext()!;
    const cb = b.chart.getContext()!;
    expect(ca.chartType).toBe("radar-chart");
    if (ca.chartType === "radar-chart") {
      expect(ca.axes).toEqual(axes);
      const mA = ca.series.find((s) => s.label === "Model A")!;
      expect(mA.peakAxis).toBe("Agility"); // value 9 is highest
    }
    const strip = (c: typeof ca) => ({ ...c, renderer: undefined });
    expect(strip(ca)).toEqual(strip(cb));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });

  it("warns on too-few axes and update/destroy work", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    let warned: unknown[] = [];
    mountRadarChart(host, {
      series,
      axes: ["A", "B"],
      width: 400,
      height: 400,
      onDataWarning: (w) => (warned = w),
    });
    expect(warned.some((w) => (w as { type: string }).type === "empty-dataset")).toBe(true);
    host.remove();

    const m = mount();
    m.chart.update({ series: series.slice(0, 1), axes, width: 500, height: 500 });
    expect(m.host.querySelectorAll("polygon.radar-area").length).toBe(1);
    m.chart.destroy();
    expect(m.host.querySelectorAll("svg").length).toBe(0);
    m.host.remove();
  });
});

describe("mountRadarChart - drop-in features (data shape, colours, hover)", () => {
  it("derives values[] from a legacy data:[{date,value}] series aligned to axes", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountRadarChart(host, {
      series: [
        {
          label: "Legacy",
          data: [
            { date: "Power", value: 9 },
            { date: "Speed", value: 3 },
          ],
        } as RadarDataItem,
      ],
      axes,
      width: 500,
      height: 500,
      renderer: "svg",
    });
    const ctx = chart.getContext()!;
    if (ctx.chartType === "radar-chart") {
      const s = ctx.series.find((x) => x.label === "Legacy")!;
      expect(s.byAxis.find((b) => b.axis === "Power")!.value).toBe(9);
      expect(s.byAxis.find((b) => b.axis === "Speed")!.value).toBe(3);
      expect(s.byAxis.find((b) => b.axis === "Range")!.value).toBe(0); // missing date → 0
    }
    chart.destroy();
    host.remove();
  });

  it("resolves a year-suffixed series colour from the base label in colorsMapping", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountRadarChart(host, {
      series: [{ label: "China-2024", values: [1, 2, 3, 4, 5] }],
      axes,
      width: 500,
      height: 500,
      colorsMapping: { China: "#abcdef" },
      renderer: "svg",
    });
    const poly = host.querySelector<SVGPolygonElement>("polygon.radar-area")!;
    expect(poly.getAttribute("stroke")).toBe("#abcdef");
    chart.destroy();
    host.remove();
  });

  it("emits legendData on the context (one row per colour-mapped label)", () => {
    const { host, chart } = mount({ colorsMapping: { "Model A": "#f00", "Model B": "#00f" } });
    const ctx = chart.getContext()!;
    expect(ctx.legendData!.map((l) => l.label)).toEqual(
      expect.arrayContaining(["Model A", "Model B"]),
    );
    chart.destroy();
    host.remove();
  });

  it("derives axes from legacy poles.labels when axes is omitted", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountRadarChart(host, {
      series,
      poles: { labels: axes },
      width: 500,
      height: 500,
    } as RadarChartProps);
    const ctx = chart.getContext()!;
    if (ctx.chartType === "radar-chart") expect(ctx.axes).toEqual(axes);
    chart.destroy();
    host.remove();
  });

  it("canvas hover: setupRadarCanvasHover fires onEnter near a vertex of the active series", async () => {
    const { setupRadarCanvasHover } = await import("../src/radarChart/renderCanvas");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
    svg.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        right: 350,
        bottom: 350,
        width: 350,
        height: 350,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;
    document.body.appendChild(svg);
    const onEnter = vi.fn();
    const onLeave = vi.fn();
    const model = {
      grid: {
        cx: 175,
        cy: 175,
        radius: 100,
        rings: [],
        spokes: [],
        axisLabels: [],
        radialLabels: [],
      },
      series: [
        {
          label: "Active",
          safe: "Active",
          color: "#f00",
          points: "",
          dimmed: false,
          poles: [
            { x: 175, y: 75, value: 100, axisIndex: 0 },
            { x: 242, y: 218, value: 80, axisIndex: 1 },
            { x: 108, y: 218, value: 60, axisIndex: 2 },
          ],
        },
        {
          label: "Dim",
          safe: "Dim",
          color: "#00f",
          points: "",
          dimmed: true,
          poles: [
            { x: 175, y: 100, value: 70, axisIndex: 0 },
            { x: 225, y: 200, value: 50, axisIndex: 1 },
            { x: 125, y: 200, value: 40, axisIndex: 2 },
          ],
        },
      ],
    };
    const teardown = setupRadarCanvasHover(svg, model as never, {
      onEnter,
      onLeave,
      onClick: vi.fn(),
    });
    // Exactly on the Active series' top vertex (175,75).
    svg.dispatchEvent(new MouseEvent("mousemove", { clientX: 175, clientY: 75, bubbles: true }));
    expect(onEnter).toHaveBeenCalledWith("Active", 0, expect.any(MouseEvent));
    // Far from every vertex/polygon → onLeave.
    onLeave.mockClear();
    svg.dispatchEvent(new MouseEvent("mousemove", { clientX: 5, clientY: 5, bubbles: true }));
    expect(onLeave).toHaveBeenCalled();
    teardown();
    document.body.removeChild(svg);
  });
});

describe("RadarChart chrome (loading/no-data quad)", () => {
  it("isLoading: shows the loading overlay, data-mv-state=loading", () => {
    const { host, chart } = mount({ isLoading: true });
    expect(host.getAttribute("data-mv-state")).toBe("loading");
    expect(host.querySelector(".mv-loading")).not.toBeNull();
    chart.destroy();
    host.remove();
  });

  it("nodata (empty series): no polygons, data-mv-state=nodata, default overlay text", () => {
    const { host, chart } = mount({ series: [] });
    expect(host.getAttribute("data-mv-state")).toBe("nodata");
    expect(host.querySelectorAll("polygon.radar-area").length).toBe(0);
    const overlay = host.querySelector(".mv-nodata");
    expect(overlay).not.toBeNull();
    expect(overlay!.textContent).toBe("No data available");
    chart.destroy();
    host.remove();
  });

  it("noDataLabel overrides the default no-data text", () => {
    const { host, chart } = mount({ series: [], noDataLabel: "Nothing to show" });
    expect(host.querySelector(".mv-nodata")!.textContent).toBe("Nothing to show");
    chart.destroy();
    host.remove();
  });

  it("suppressDefaultOverlay hides the default overlay while data-mv-state is still set", () => {
    const { host, chart } = mount({ series: [], suppressDefaultOverlay: true });
    expect(host.getAttribute("data-mv-state")).toBe("nodata");
    expect(host.querySelector(".mv-nodata")).toBeNull();
    chart.destroy();
    host.remove();
  });

  it("ready: non-empty series, no overlay, data-mv-state=ready", () => {
    const { host, chart } = mount();
    expect(host.getAttribute("data-mv-state")).toBe("ready");
    expect(host.querySelector(".mv-loading")).toBeNull();
    expect(host.querySelector(".mv-nodata")).toBeNull();
    chart.destroy();
    host.remove();
  });

  // isNodata forced true with a NON-empty series (e.g. a wrapper's custom
  // isNodataComponent evaluating some other condition): the grid + polygons must
  // not draw underneath the overlay - state is stamped, overlay renders, chart doesn't.
  it("isNodata=true with non-empty series: no grid/polygons drawn, overlay still shown (svg)", () => {
    const { host, chart } = mount({ isNodata: true });
    expect(host.getAttribute("data-mv-state")).toBe("nodata");
    expect(host.querySelectorAll("polygon.radar-area").length).toBe(0);
    expect(host.querySelectorAll(".mv-radar-grid circle").length).toBe(0);
    expect(host.querySelector(".mv-nodata")).not.toBeNull();
    chart.destroy();
    host.remove();
  });

  it("isNodata=true with non-empty series: no canvas painted (canvas renderer)", () => {
    const { host, chart } = mount({ isNodata: true, renderer: "canvas" });
    expect(host.getAttribute("data-mv-state")).toBe("nodata");
    expect(host.querySelector("canvas")).toBeNull();
    expect(host.querySelectorAll("polygon.radar-area").length).toBe(0);
    chart.destroy();
    host.remove();
  });
});
