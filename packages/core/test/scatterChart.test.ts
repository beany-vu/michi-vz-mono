import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { mountScatterChart } from "../src/engine/scatterChart";
import { buildScatterContext } from "../src/context/buildScatterContext";
import { sanitizeForClassName } from "../src/math/sanitize";
import type { ScatterChartProps, ScatterDataPoint } from "../src/types";

const dataSet: ScatterDataPoint[] = [
  { label: "Point A", x: 1, y: 2, d: 5 },
  { label: "Beta", x: 3, y: 6, d: 10 },
  { label: "Gamma", x: 5, y: 10, d: 2 },
  { label: "Delta", x: 7, y: 14, d: 8 },
];

function mount(extra: Partial<ScatterChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountScatterChart(host, {
    dataSet,
    title: "Demo",
    width: 600,
    height: 300,
    xAxisDataType: "number",
    ...extra,
  });
  return { host, chart };
}

describe("buildScatterContext", () => {
  it("computes a Pearson correlation (perfectly linear => ~1)", () => {
    const ctx = buildScatterContext({
      renderer: "svg",
      xAxisDataType: "number",
      xAxisDomain: [0, 7],
      yAxisDomain: [0, 14],
      points: dataSet,
      colorsMapping: {},
    });
    // y = 2x exactly -> correlation 1
    expect(ctx.stats.correlation).toBe(1);
    expect(ctx.summary).toContain("correlation");
  });

  it("emits legendData (one row per unique point label, with dataLabelSafe) - colour-authority hook", () => {
    const ctx = buildScatterContext({
      renderer: "svg",
      xAxisDataType: "number",
      xAxisDomain: [0, 7],
      yAxisDomain: [0, 14],
      points: dataSet,
      colorsMapping: {},
    });
    expect(ctx.legendData!.map((l) => l.label)).toEqual(["Point A", "Beta", "Gamma", "Delta"]);
    const a = ctx.legendData!.find((l) => l.label === "Point A")!;
    expect(a.dataLabelSafe).toBe(sanitizeForClassName("Point A")); // "Point_A"
  });
});

describe("mountScatterChart (jsdom)", () => {
  it("renders one mark per point carrying data-label-safe", () => {
    const { host, chart } = mount();
    const marks = host.querySelectorAll(".scatter-point");
    expect(marks.length).toBe(4);
    const safes = Array.from(marks).map((m) => m.getAttribute("data-label-safe"));
    expect(safes).toContain(sanitizeForClassName("Point A")); // "Point_A"
    chart.destroy();
    host.remove();
  });

  it("excludes disabled points", () => {
    const { host, chart } = mount({ disabledItems: ["Beta", "Gamma"] });
    expect(host.querySelectorAll(".scatter-point").length).toBe(2);
    chart.destroy();
    host.remove();
  });

  it("scales bubble radius by the d value (bigger d => bigger r)", () => {
    const { host, chart } = mount();
    const circles = Array.from(host.querySelectorAll<SVGCircleElement>("circle.scatter-point"));
    const beta = circles.find((c) => c.getAttribute("data-label") === "Beta")!; // d=10 (max)
    const gamma = circles.find((c) => c.getAttribute("data-label") === "Gamma")!; // d=2 (min)
    expect(Number(beta.getAttribute("r"))).toBeGreaterThan(Number(gamma.getAttribute("r")));
    chart.destroy();
    host.remove();
  });

  it("builds an a11y mirror with one row per point", () => {
    const { host, chart } = mount();
    expect(host.querySelectorAll(".mv-a11y table tbody tr").length).toBe(4);
    expect(host.querySelector(".mv-a11y")!.getAttribute("aria-label")).toContain("Scatter plot");
    chart.destroy();
    host.remove();
  });

  it("exposes a scatter context, identical in SVG and canvas (renderer aside)", () => {
    const a = mount({ renderer: "svg" });
    const b = mount({ renderer: "canvas" });
    const ca = a.chart.getContext()!;
    const cb = b.chart.getContext()!;
    expect(ca.chartType).toBe("scatter-plot-chart");
    if (ca.chartType === "scatter-plot-chart") expect(ca.pointCount).toBe(4);
    const strip = (c: typeof ca) => ({ ...c, renderer: undefined });
    expect(strip(ca)).toEqual(strip(cb));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });

  it("fires onDataWarning for a non-finite coordinate", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    let warned: unknown[] = [];
    const chart = mountScatterChart(host, {
      dataSet: [{ label: "Bad", x: NaN, y: 1 }],
      width: 400,
      height: 200,
      onDataWarning: (w) => (warned = w),
    });
    expect(warned.some((w) => (w as { type: string }).type === "non-finite-value")).toBe(true);
    chart.destroy();
    host.remove();
  });

  it("update() re-renders and destroy() cleans up", () => {
    const { host, chart } = mount();
    chart.update({ dataSet: dataSet.slice(0, 2), width: 600, height: 300, xAxisDataType: "number" });
    expect(host.querySelectorAll(".scatter-point").length).toBe(2);
    chart.destroy();
    expect(host.querySelectorAll("svg").length).toBe(0);
    host.remove();
  });
});

describe("mountScatterChart - band x-axis (ByPattern contract)", () => {
  // Two points per label (TMax square + TMin triangle) sharing a band slot, exactly
  // like ByPattern's filteredData. Marks are positioned by `label`, not `x`.
  const bandDataSet: ScatterDataPoint[] = [
    { label: "Alpha", x: 0, y: 12.5, d: 32, shape: "square", color: "#e63946", label2: "Max" },
    { label: "Alpha", x: 0, y: 8.3, d: 32, shape: "triangle", color: "#e63946", label2: "Min" },
    { label: "Beta", x: 1, y: 15.0, d: 32, shape: "square", color: "#457b9d", label2: "Max" },
    { label: "Beta", x: 1, y: 10.2, d: 32, shape: "triangle", color: "#457b9d", label2: "Min" },
  ];

  function mountBand(extra: Partial<ScatterChartProps> = {}) {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountScatterChart(host, {
      dataSet: bandDataSet,
      width: 600,
      height: 300,
      xAxisDataType: "band",
      // ByPattern passes Object.keys(labelsMapping); the engine derives the domain from
      // the visible points' labels (legacy parity), so this is accepted but not required.
      xAxisDomain: ["Alpha", "Beta"],
      yAxisDomain: [0, 20],
      renderer: "svg",
      ...extra,
    });
    return { host, chart };
  }

  it("draws a <rect> for square + a <path> for triangle (no <circle>)", () => {
    const { host, chart } = mountBand();
    expect(host.querySelectorAll("rect.scatter-point").length).toBe(2);
    expect(host.querySelectorAll("path.scatter-point").length).toBe(2);
    expect(host.querySelectorAll("circle.scatter-point").length).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("centres each label in its band slot - Beta sits to the right of Alpha", () => {
    const { host, chart } = mountBand();
    const rectX = (label: string): number =>
      Number(
        Array.from(host.querySelectorAll<SVGRectElement>("rect.scatter-point"))
          .find((r) => r.getAttribute("data-label") === label)!
          .getAttribute("x")
      );
    expect(rectX("Beta")).toBeGreaterThan(rectX("Alpha"));
    chart.destroy();
    host.remove();
  });

  it("renders one band tick label per category", () => {
    const { host, chart } = mountBand();
    const labels = Array.from(host.querySelectorAll(".mv-x-axis-band .mv-axis-label")).map(
      (t) => t.textContent
    );
    expect(labels).toContain("Alpha");
    expect(labels).toContain("Beta");
    chart.destroy();
    host.remove();
  });

  it("marks carry data-label-safe (the canvas colour-probe hook)", () => {
    const { host, chart } = mountBand();
    const safes = Array.from(host.querySelectorAll(".scatter-point")).map((m) =>
      m.getAttribute("data-label-safe")
    );
    expect(safes).toContain(sanitizeForClassName("Alpha"));
    chart.destroy();
    host.remove();
  });

  it("band context: no Pearson correlation, category domain, category summary", () => {
    const { host, chart } = mountBand();
    const ctx = chart.getContext()!;
    expect(ctx.chartType).toBe("scatter-plot-chart");
    if (ctx.chartType === "scatter-plot-chart") {
      expect(ctx.stats.correlation).toBeNull();
      expect(ctx.xAxis.domain).toEqual(["Alpha", "Beta"]);
      expect(ctx.summary).toContain("categories");
    }
    chart.destroy();
    host.remove();
  });
});

describe("mountScatterChart - URP features (crosshair / dScaleLegend / grid / ticks / children)", () => {
  it("renders a .michi-vz-legend group when dScaleLegend is provided, none otherwise", () => {
    const a = mount({ dScaleLegend: { title: "Trade", valueFormatter: (d) => `${Math.round(d)}` } });
    expect(a.host.querySelector(".michi-vz-legend")).not.toBeNull();
    a.chart.destroy();
    a.host.remove();
    const b = mount();
    expect(b.host.querySelector(".michi-vz-legend")).toBeNull();
    b.chart.destroy();
    b.host.remove();
  });

  it("suppresses y grid lines when showGrid.y=false", () => {
    const { host, chart } = mount({ showGrid: { x: true, y: false } });
    const yAxis = host.querySelector(".mv-y-axis")!;
    expect(yAxis.querySelectorAll(".mv-grid").length).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("honours yTicksQty for the y-axis tick count (fewer < more)", () => {
    const few = mount({ yTicksQty: 2 });
    const many = mount({ yTicksQty: 10 });
    const count = (h: HTMLElement): number => h.querySelectorAll(".mv-y-axis .mv-axis-label").length;
    expect(count(few.host)).toBeLessThan(count(many.host));
    few.chart.destroy();
    few.host.remove();
    many.chart.destroy();
    many.host.remove();
  });

  it("injects svgChildren into a .mv-svg-children group", () => {
    const { host, chart } = mount({ svgChildren: '<text x="10" y="20">Hello</text>' });
    const g = host.querySelector(".mv-svg-children")!;
    expect(g).not.toBeNull();
    expect(g.querySelector("text")!.textContent).toBe("Hello");
    chart.destroy();
    host.remove();
  });

  it("creates a .mv-crosshair overlay in canvas mode when showCrosshair=true, none otherwise", () => {
    const on = mount({ renderer: "canvas", showCrosshair: true });
    expect(on.host.querySelector(".mv-crosshair")).not.toBeNull();
    on.chart.destroy();
    on.host.remove();
    const off = mount({ renderer: "canvas" });
    expect(off.host.querySelector(".mv-crosshair")).toBeNull();
    off.chart.destroy();
    off.host.remove();
  });

  it("makes the dScaleLegend draggable (grab cursor + inline transform)", () => {
    const { host, chart } = mount({
      dScaleLegend: { title: "T", valueFormatter: (d) => `${Math.round(d)}` },
    });
    const legend = host.querySelector(".michi-vz-legend") as SVGGElement;
    expect(legend).not.toBeNull();
    expect(legend.style.cursor).toBe("grab");
    expect(legend.style.transform).toContain("translate");
    chart.destroy();
    host.remove();
  });
});

describe("canvas-mode hover throttle (rAF)", () => {
  // The hit-test is O(points) per event; real mice fire mousemove several
  // times per frame. The handler processes the FIRST event of a burst
  // synchronously (so single dispatches - and these tests - stay sync) and
  // collapses the rest of the frame into one trailing rAF pass.
  const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

  // Freeze performance.now so every dispatch after the first deterministically
  // lands inside the 16ms leading-edge window, however slow the test machine is.
  // jsdom's rAF runs on its own clock, so `frame()` still resolves normally.
  let nowSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    nowSpy = vi.spyOn(performance, "now").mockReturnValue(100_000);
  });
  afterEach(() => {
    nowSpy.mockRestore();
  });

  function pointPixel(label: string) {
    // Read pixel coords from an SVG mount (same scales/model as canvas).
    const svgMount = mountFor({ renderer: "svg" });
    const dot = Array.from(
      svgMount.host.querySelectorAll<SVGCircleElement>("circle.scatter-point")
    ).find((c) => c.getAttribute("data-label") === label)!;
    const cx = Number(dot.getAttribute("cx"));
    const cy = Number(dot.getAttribute("cy"));
    svgMount.chart.destroy();
    svgMount.host.remove();
    return { cx, cy };
  }

  const throttleData: ScatterDataPoint[] = [
    { label: "Point A", x: 1, y: 2, d: 5 },
    { label: "Beta", x: 3, y: 6, d: 10 },
    { label: "Gamma", x: 5, y: 10, d: 2 },
    { label: "Delta", x: 7, y: 14, d: 8 },
  ];

  function mountFor(extra: Partial<ScatterChartProps> = {}) {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountScatterChart(host, {
      dataSet: throttleData,
      title: "Demo",
      width: 600,
      height: 300,
      xAxisDataType: "number",
      ...extra,
    });
    return { host, chart };
  }

  it("processes the first move of a burst synchronously, trailing moves on the next frame", async () => {
    const { cx, cy } = pointPixel("Point A");
    const highlighted: string[][] = [];
    const { host, chart } = mountFor({
      renderer: "canvas",
      onHighlightItem: (labels) => highlighted.push(labels),
    });
    // Leading edge: first event in >16ms is synchronous (jsdom rects are all
    // zero, so clientX/Y map straight to model coords).
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: cx, clientY: cy, bubbles: true }));
    expect(highlighted.some((h) => h.includes("Point A"))).toBe(true);

    // Burst: an immediate second move (a miss) is deferred to the next frame.
    const callsAfterLeading = highlighted.length;
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: 599, clientY: 1, bubbles: true }));
    expect(highlighted.length).toBe(callsAfterLeading); // not yet processed
    await frame();
    expect(highlighted[highlighted.length - 1]).toEqual([]); // trailing miss processed
    chart.destroy();
    host.remove();
  });

  it("collapses many same-frame moves into one trailing hit-test (latest event wins)", async () => {
    const { cx, cy } = pointPixel("Beta");
    const highlighted: string[][] = [];
    const { host, chart } = mountFor({
      renderer: "canvas",
      onHighlightItem: (labels) => highlighted.push(labels),
    });
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: 1, clientY: 1, bubbles: true })); // leading miss
    const afterLeading = highlighted.length;
    for (let i = 0; i < 20; i++) {
      host.dispatchEvent(new MouseEvent("mousemove", { clientX: 2 + i, clientY: 1, bubbles: true }));
    }
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: cx, clientY: cy, bubbles: true })); // latest = hit
    await frame();
    // Exactly ONE trailing pass ran (not 21), and it saw the latest event.
    expect(highlighted.length).toBe(afterLeading + 1);
    expect(highlighted[highlighted.length - 1]).toContain("Beta");
    chart.destroy();
    host.remove();
  });

  it("destroy() cancels a pending trailing hit-test (no callback after destroy)", async () => {
    const highlighted: string[][] = [];
    const { host, chart } = mountFor({
      renderer: "canvas",
      onHighlightItem: (labels) => highlighted.push(labels),
    });
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: 1, clientY: 1, bubbles: true }));
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: 2, clientY: 1, bubbles: true })); // pending
    const before = highlighted.length;
    chart.destroy();
    await frame();
    expect(highlighted.length).toBe(before); // nothing fired after destroy
    host.remove();
  });
});

describe("pointLabels (default-off, right-of-point + overlap-hide)", () => {
  // Uniform `d` (equal radius) -> buildScatterRenderModel skips its size sort
  // (uniformR), so draw order == input order - makes label-order assertions
  // below unambiguous and independent of the drawOrder feature.
  const spread: ScatterDataPoint[] = [
    { label: "Point A", x: 1, y: 2, d: 5 },
    { label: "Beta", x: 3, y: 6, d: 5 },
    { label: "Gamma", x: 5, y: 10, d: 5 },
    { label: "Delta", x: 7, y: 14, d: 5 },
  ];

  it("absent prop: zero .mv-point-label nodes and mark markup is byte-identical to a mount with no pointLabels key at all", () => {
    const withoutKey = mount({ dataSet: spread });
    const withFalse = mount({ dataSet: spread, pointLabels: false });
    expect(withoutKey.host.querySelectorAll(".mv-point-label").length).toBe(0);
    expect(withFalse.host.querySelectorAll(".mv-point-label").length).toBe(0);
    const markAttrs = (host: HTMLElement) =>
      Array.from(host.querySelectorAll(".scatter-point")).map((m) => m.outerHTML);
    expect(markAttrs(withFalse.host)).toEqual(markAttrs(withoutKey.host));
    withoutKey.chart.destroy();
    withoutKey.host.remove();
    withFalse.chart.destroy();
    withFalse.host.remove();
  });

  it("true: renders one label per point (using the point's label) when they don't collide", () => {
    const { host, chart } = mount({ dataSet: spread, pointLabels: true });
    const labels = host.querySelectorAll(".mv-point-label");
    expect(labels.length).toBe(4);
    const texts = Array.from(labels).map((g) => g.querySelector(".mv-point-label-text")!.textContent);
    expect(texts).toEqual(["Point A", "Beta", "Gamma", "Delta"]);
    const first = labels[0];
    expect(first.getAttribute("data-label")).toBe("Point A");
    expect(first.getAttribute("data-label-safe")).toBe(sanitizeForClassName("Point A"));
    chart.destroy();
    host.remove();
  });

  it("custom formatter overrides the default label-name text", () => {
    const { host, chart } = mount({
      dataSet: spread,
      pointLabels: { formatter: (d) => `${d.label}!` },
    });
    const texts = Array.from(host.querySelectorAll(".mv-point-label-text")).map((t) => t.textContent);
    expect(texts).toEqual(["Point A!", "Beta!", "Gamma!", "Delta!"]);
    chart.destroy();
    host.remove();
  });

  it("a formatter returning '' suppresses just that point's label", () => {
    const { host, chart } = mount({
      dataSet: spread,
      pointLabels: { formatter: (d) => (d.label === "Gamma" ? "" : d.label) },
    });
    const texts = Array.from(host.querySelectorAll(".mv-point-label-text")).map((t) => t.textContent);
    expect(texts).not.toContain("Gamma");
    expect(texts.length).toBe(3);
    chart.destroy();
    host.remove();
  });

  it("overlap-hide: two same-position points - only the earlier one (draw order) gets a label", () => {
    const overlapping: ScatterDataPoint[] = [
      { label: "First", x: 4, y: 8, d: 5 },
      { label: "Second", x: 4, y: 8, d: 5 }, // identical pixel position -> guaranteed box overlap
    ];
    const { host, chart } = mount({ dataSet: overlapping, pointLabels: true });
    const texts = Array.from(host.querySelectorAll(".mv-point-label-text")).map((t) => t.textContent);
    expect(texts).toEqual(["First"]); // "Second"'s label box collides with "First"'s and is skipped
    chart.destroy();
    host.remove();
  });

  it("overlap-hide is deterministic across repeated mounts (same input -> same visible labels)", () => {
    const overlapping: ScatterDataPoint[] = [
      { label: "First", x: 4, y: 8, d: 5 },
      { label: "Second", x: 4, y: 8, d: 5 },
      { label: "Third", x: 4, y: 8, d: 5 },
    ];
    const run = () => {
      const { host, chart } = mount({ dataSet: overlapping, pointLabels: true });
      const texts = Array.from(host.querySelectorAll(".mv-point-label-text")).map((t) => t.textContent);
      chart.destroy();
      host.remove();
      return texts;
    };
    expect(run()).toEqual(["First"]);
    expect(run()).toEqual(run());
  });
});

describe("drawOrder (default 'none', additive)", () => {
  const varyingSizes: ScatterDataPoint[] = [
    { label: "Small", x: 1, y: 1, d: 1 },
    { label: "Large", x: 5, y: 5, d: 20 },
    { label: "Medium", x: 3, y: 3, d: 10 },
  ];

  it("absent prop, 'none', and 'sizeDescending' are byte-identical (today's ordering already IS size-descending)", () => {
    const omitted = mount({ dataSet: varyingSizes });
    const none = mount({ dataSet: varyingSizes, drawOrder: "none" });
    const sizeDesc = mount({ dataSet: varyingSizes, drawOrder: "sizeDescending" });
    const markAttrs = (host: HTMLElement) =>
      Array.from(host.querySelectorAll(".scatter-point")).map((m) => m.outerHTML);
    expect(markAttrs(none.host)).toEqual(markAttrs(omitted.host));
    expect(markAttrs(sizeDesc.host)).toEqual(markAttrs(omitted.host));
    omitted.chart.destroy();
    omitted.host.remove();
    none.chart.destroy();
    none.host.remove();
    sizeDesc.chart.destroy();
    sizeDesc.host.remove();
  });

  it("draws the largest bubble first (behind) and the smallest last (on top), matching the documented contract", () => {
    const { host, chart } = mount({ dataSet: varyingSizes, drawOrder: "sizeDescending" });
    const marks = Array.from(host.querySelectorAll<SVGCircleElement>("circle.scatter-point"));
    const rs = marks.map((m) => Number(m.getAttribute("r")));
    // Strictly descending: each mark's radius >= the next one's (largest-first).
    for (let i = 1; i < rs.length; i++) expect(rs[i - 1]).toBeGreaterThanOrEqual(rs[i]);
    expect(marks[0].getAttribute("data-label")).toBe("Large");
    expect(marks[marks.length - 1].getAttribute("data-label")).toBe("Small");
    chart.destroy();
    host.remove();
  });
});
