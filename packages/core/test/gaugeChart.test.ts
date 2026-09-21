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

  it("defaults to a full circle, so existing consumers are unchanged", () => {
    const { host, chart } = mount({ dataSet: [{ label: "A", value: 50 }], max: 100 });
    const track = host.querySelector<SVGPathElement>("path.gauge-track")!;
    // A full-circle track needs no dashing at all - the attribute is absent,
    // exactly matching pre-sweepAngle rendering (no avoidable DOM change on
    // the default path).
    expect(track.getAttribute("stroke-dasharray")).toBeNull();
    chart.destroy();
    host.remove();
  });

  it("sweepAngle 180 draws a half track, and a full-value arc fills exactly that half", () => {
    const { host, chart } = mount({
      dataSet: [{ label: "A", value: 100 }],
      max: 100,
      sweepAngle: 180,
      startAngle: -90,
    });
    const track = host.querySelector<SVGPathElement>("path.gauge-track")!;
    const arc = host.querySelector<SVGPathElement>("path.gauge-arc")!;
    const trackDrawn = Number(track.getAttribute("stroke-dasharray")!.split(" ")[0]);
    const arcDrawn = Number(arc.getAttribute("stroke-dasharray")!.split(" ")[0]);
    // value === max, so the arc covers the whole track.
    expect(arcDrawn).toBeCloseTo(trackDrawn, 1);
    chart.destroy();
    host.remove();
  });

  it("scales the arc against the SWEEP, not the circumference", () => {
    const { host, chart } = mount({
      dataSet: [{ label: "A", value: 50 }],
      max: 100,
      sweepAngle: 180,
      startAngle: -90,
    });
    const track = host.querySelector<SVGPathElement>("path.gauge-track")!;
    const arc = host.querySelector<SVGPathElement>("path.gauge-arc")!;
    const trackDrawn = Number(track.getAttribute("stroke-dasharray")!.split(" ")[0]);
    const arcDrawn = Number(arc.getAttribute("stroke-dasharray")!.split(" ")[0]);
    // Half the value over a half sweep = a quarter of the circle, i.e. half the track.
    expect(arcDrawn).toBeCloseTo(trackDrawn / 2, 1);
    chart.destroy();
    host.remove();
  });

  it("emits a linearGradient with one stop per colour and strokes the arc with it", () => {
    const { host, chart } = mount({
      dataSet: [{ label: "A", value: 70, gradient: ["#c00", "#fd0", "#3a3"] }],
      max: 100,
    });
    const stops = host.querySelectorAll("defs linearGradient stop");
    expect(stops.length).toBe(3);
    expect(stops[0].getAttribute("stop-color")).toBe("#c00");
    expect(host.querySelector("path.gauge-arc")!.getAttribute("stroke")).toMatch(/^url\(#/);
    chart.destroy();
    host.remove();
  });

  it("keeps the gradient axis horizontal regardless of startAngle, so SVG matches canvas/webgpu", () => {
    // The exact recipe the half-gauge use case needs (startAngle: -90, sweepAngle: 180):
    // the ring's <g> gets rotated, and userSpaceOnUse resolves in that REFERENCING
    // element's user space, so an uncorrected gradient would rotate along with it -
    // vertical in SVG while canvas/webgpu (which never rotate) stay horizontal.
    const { host, chart } = mount({
      dataSet: [{ label: "A", value: 70, gradient: ["#c00", "#3a3"] }],
      max: 100,
      startAngle: -90,
      sweepAngle: 180,
    });
    const ringTransform = host.querySelector("g.gauge-ring-cell")!.getAttribute("transform")!;
    const ringDeg = Number(ringTransform.match(/rotate\(([-\d.]+)/)![1]);
    const gradientTransform = host
      .querySelector("defs linearGradient")!
      .getAttribute("gradientTransform")!;
    const gradDeg = Number(gradientTransform.match(/rotate\(([-\d.]+)/)![1]);
    // The gradient's own rotation must exactly cancel the ring's, so the net
    // rotation applied to its x1->x2 axis is zero: it stays horizontal.
    expect(ringDeg + gradDeg).toBeCloseTo(0, 5);
    chart.destroy();
    host.remove();
  });

  it("gives each mounted gauge its own gradient id, so two on a page cannot collide", () => {
    const a = mount({ dataSet: [{ label: "A", value: 1, gradient: ["#c00", "#3a3"] }], max: 4 });
    const b = mount({ dataSet: [{ label: "A", value: 1, gradient: ["#00c", "#0c0"] }], max: 4 });
    const idOf = (h: HTMLElement) => h.querySelector("defs linearGradient")!.getAttribute("id");
    expect(idOf(a.host)).not.toBe(idOf(b.host));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });

  it("a ring gradient wins over the chart-level gradient", () => {
    const { host, chart } = mount({
      dataSet: [{ label: "A", value: 1, gradient: ["#111", "#222"] }],
      gradient: ["#999", "#aaa"],
      max: 4,
    });
    expect(host.querySelector("defs linearGradient stop")!.getAttribute("stop-color")).toBe("#111");
    chart.destroy();
    host.remove();
  });

  it("exposes min on the context with a min-aware fraction", () => {
    const { host, chart } = mount({
      dataSet: [{ label: "Greece", value: 7836.69 }],
      min: 5377.05,
      max: 16757.58,
    });
    const ctx = chart.getContext() as GaugeChartContext;
    expect(ctx.min).toBe(5377.05);
    expect(ctx.max).toBe(16757.58);
    expect(ctx.rings[0].fraction).toBeCloseTo(0.22, 2);
    chart.destroy();
    host.remove();
  });

  // Positioning props. A 360x210 box with margin 0 centres at (180,105) with
  // outerRadius 105; the single ring's centreline is 105 - 18/2 = 96.
  const range = { min: 3.3, max: 16, startAngle: -90, sweepAngle: 180, width: 360, height: 210 };
  const angleAt = (value: number) => ((-90 + ((value - 3.3) / (16 - 3.3)) * 180) * Math.PI) / 180;
  const at = (r: number, a: number) => [180 + r * Math.sin(a), 105 - r * Math.cos(a)];

  it("draws a value marker on the ring centreline at the min-aware fraction (svg)", () => {
    const { host, chart } = mount({
      ...range,
      dataSet: [{ label: "Greece", value: 7.6, color: "#0d5eaf" }],
      valueMarker: true,
    });
    const marker = host.querySelector<SVGCircleElement>(
      "g.gauge-chart-content circle.mv-gauge-marker",
    )!;
    expect(marker).not.toBeNull();
    const [x, y] = at(96, angleAt(7.6));
    expect(Number(marker.getAttribute("cx"))).toBeCloseTo(x, 6);
    expect(Number(marker.getAttribute("cy"))).toBeCloseTo(y, 6);
    expect(marker.getAttribute("fill")).toBe("#0d5eaf");
    expect(marker.getAttribute("data-label")).toBe("Greece");
    expect(marker.getAttribute("data-label-safe")).toBe("Greece");
    const tick = host.querySelector<SVGLineElement>("line.mv-gauge-marker-tick")!;
    expect(tick.getAttribute("stroke")).toBe("#1a1a1a");
    expect(host.querySelectorAll("svg")).toHaveLength(1); // no overlay in svg mode
    chart.destroy();
    host.remove();
  });

  it("renders ticks and end labels with consumer strings, falling back to valueFormatter", () => {
    const { host, chart } = mount({
      ...range,
      dataSet: [{ label: "Greece", value: 7.6 }],
      ticks: [{ value: 7.27, label: "AVG" }],
      endLabels: { min: { label: "MIN" }, max: { label: "MAX", valueLabel: "16.0" } },
      valueFormatter: (v) => `${v}k`,
    });
    const texts = Array.from(host.querySelectorAll("g.gauge-annotations text")).map(
      (t) => t.textContent,
    );
    expect(texts).toEqual(["AVG", "7.27k", "MIN", "3.3k", "MAX", "16.0"]);
    const line = host.querySelector<SVGLineElement>("line.mv-gauge-tick")!;
    const [x1, y1] = at(105 + 2, angleAt(7.27));
    expect(Number(line.getAttribute("x1"))).toBeCloseTo(x1, 6);
    expect(Number(line.getAttribute("y1"))).toBeCloseTo(y1, 6);
    const caption = host.querySelector<SVGTextElement>("text.mv-gauge-tick-label")!;
    expect(caption.getAttribute("text-anchor")).toBe("middle");
    const [, labelY] = at(105 + 26, angleAt(7.27));
    expect(Number(caption.getAttribute("y"))).toBeCloseTo(labelY - 6, 6);
    const endCaption = host.querySelector<SVGTextElement>(
      "text.mv-gauge-end-label.mv-gauge-tick-label",
    )!;
    // Start end of the centreline (96) is (84, 105); the label hangs 20px below.
    expect(Number(endCaption.getAttribute("x"))).toBeCloseTo(84, 6);
    expect(Number(endCaption.getAttribute("y"))).toBeCloseTo(125, 6);
    chart.destroy();
    host.remove();
  });

  it("suppresses a value line for an empty valueLabel and draws ticks for a null ring", () => {
    const { host, chart } = mount({
      ...range,
      dataSet: [{ label: "Greece", value: null }],
      ticks: [{ value: 7.27, label: "AVG", valueLabel: "" }],
      valueMarker: true,
    });
    const texts = Array.from(host.querySelectorAll("g.gauge-annotations text")).map(
      (t) => t.textContent,
    );
    expect(texts).toEqual(["AVG"]);
    expect(host.querySelector("circle.mv-gauge-marker")).toBeNull();
    chart.destroy();
    host.remove();
  });

  it("skips end labels on a full ring and clamps an out-of-range tick, warning for both", () => {
    const onDataWarning = vi.fn();
    const { host, chart } = mount({
      dataSet: [{ label: "A", value: 50 }],
      max: 100,
      ticks: [{ value: 150, label: "OVER" }],
      endLabels: true,
      onDataWarning,
    });
    expect(host.querySelector("text.mv-gauge-end-label")).toBeNull();
    const line = host.querySelector<SVGLineElement>("line.mv-gauge-tick")!;
    // Clamped to max on a full ring = back at 12 o'clock: x1 = cx = 100.
    expect(Number(line.getAttribute("x1"))).toBeCloseTo(100, 6);
    const types = onDataWarning.mock.calls[0][0].map((w: { type: string }) => w.type);
    expect(types).toContain("non-finite-value");
    expect(types).toContain("layout-overflow");
    chart.destroy();
    host.remove();
  });

  it("without the positioning props the DOM is unchanged (no annotation group, one svg)", () => {
    const { host, chart } = mount();
    expect(host.querySelector("g.gauge-annotations")).toBeNull();
    expect(host.querySelector(".mv-gauge-marker")).toBeNull();
    expect(host.querySelectorAll("svg")).toHaveLength(1);
    expect(host.querySelectorAll("path.gauge-track")).toHaveLength(3);
    expect(host.querySelectorAll("path.gauge-arc")).toHaveLength(3);
    chart.destroy();
    host.remove();
  });

  // The track path starts at the ring's top point: "M cx (cy - centrelineRadius) ...".
  const trackTop = (host: HTMLElement) => {
    const d = host.querySelector<SVGPathElement>("path.gauge-track")!.getAttribute("d")!;
    const m = d.match(/^M (\S+) (\S+)/)!;
    return { x: Number(m[1]), y: Number(m[2]) };
  };

  it("sweepFit moves the ring centre onto the swept box while the readout stays at the box middle", () => {
    const base = {
      dataSet: [{ label: "A", value: 50 }],
      startAngle: -90,
      sweepAngle: 180,
      width: 360,
      height: 300,
    };
    const plain = mount(base);
    // Plain centring: cy 150, outerRadius 150, centreline 141 -> top y 9; readout at 150.
    expect(trackTop(plain.host)).toEqual({ x: 180, y: 9 });
    expect(plain.host.querySelector<HTMLElement>(".mv-gauge-center")!.style.top).toBe("150px");
    plain.chart.destroy();
    plain.host.remove();

    const fitted = mount({ ...base, sweepFit: true });
    // Fitted: outerRadius 180, box top 60, cy 240, centreline 171 -> top y 69; readout at 60 + 90.
    expect(trackTop(fitted.host)).toEqual({ x: 180, y: 69 });
    expect(fitted.host.querySelector<HTMLElement>(".mv-gauge-center")!.style.top).toBe("150px");
    expect(fitted.host.querySelector<HTMLElement>(".mv-gauge-center")!.style.left).toBe("180px");
    fitted.chart.destroy();
    fitted.host.remove();
  });

  it("sweepFit reserves 36px on every side while ticks or end labels exist", () => {
    const { host, chart } = mount({
      dataSet: [{ label: "A", value: 50 }],
      startAngle: -90,
      sweepAngle: 180,
      width: 360,
      height: 300,
      sweepFit: true,
      ticks: [{ value: 25 }],
    });
    // availW 288, availH 228 -> outerRadius 144; box top 36 + (228 - 144) / 2 = 78; cy 222;
    // centreline 135 -> top y 87.
    expect(trackTop(host)).toEqual({ x: 180, y: 87 });
    chart.destroy();
    host.remove();
  });

  it("sweepFit is a no-op for a full ring and lets an explicit outerRadius win", () => {
    const full = mount({ dataSet: [{ label: "A", value: 50 }], sweepFit: true });
    expect(trackTop(full.host)).toEqual({ x: 100, y: 9 }); // identical to plain centring
    full.chart.destroy();
    full.host.remove();

    const forced = mount({
      dataSet: [{ label: "A", value: 50 }],
      startAngle: -90,
      sweepAngle: 180,
      width: 360,
      height: 300,
      sweepFit: true,
      outerRadius: 100,
    });
    // Box 200x100 centred: left 80, top 100 -> cx 180, cy 200, centreline 91 -> top y 109.
    expect(trackTop(forced.host)).toEqual({ x: 180, y: 109 });
    forced.chart.destroy();
    forced.host.remove();
  });
});
