import { describe, it, expect } from "vitest";
import { mountComparableVerticalBarChart } from "../src/engine/comparableVerticalBarChart";
import { createComparableVerticalBarScales } from "../src/comparableVerticalBar/scales";
import { processComparableVerticalBarData } from "../src/comparableVerticalBar/data";
import { sanitizeForClassName } from "../src/math/sanitize";
import { computeComparableVerticalDelta } from "../src/comparableVerticalBar/delta";
import type { ComparableVerticalBarChartProps, ComparableBarDataPoint } from "../src/types";

const dataSet: ComparableBarDataPoint[] = [
  { label: "Alpha One", valueBased: 10, valueCompared: 18 },
  { label: "Beta", valueBased: 30, valueCompared: 22 },
  { label: "Gamma", valueBased: 15, valueCompared: 15 },
];

function mount(extra: Partial<ComparableVerticalBarChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountComparableVerticalBarChart(host, {
    dataSet,
    title: "Demo",
    width: 600,
    height: 300,
    ...extra,
  });
  return { host, chart };
}

describe("mountComparableVerticalBarChart (jsdom)", () => {
  it("renders two bars per category (based + compared) with data-label-safe", () => {
    const { host, chart } = mount();
    const bars = host.querySelectorAll<SVGRectElement>("rect.bar");
    expect(bars.length).toBe(6); // 3 categories x 2 sub-bars
    expect(host.querySelectorAll("rect.bar.value-based").length).toBe(3);
    expect(host.querySelectorAll("rect.bar.value-compared").length).toBe(3);
    const safes = Array.from(bars).map((b) => b.getAttribute("data-label-safe"));
    expect(safes).toContain(sanitizeForClassName("Alpha One")); // "Alpha_One"
    chart.destroy();
    host.remove();
  });

  it("applies the based/compared opacities", () => {
    const { host, chart } = mount({ valueBasedOpacity: 0.4, valueComparedOpacity: 0.95 });
    const based = host.querySelector("rect.bar.value-based")!;
    const compared = host.querySelector("rect.bar.value-compared")!;
    expect(based.getAttribute("opacity")).toBe("0.4");
    expect(compared.getAttribute("opacity")).toBe("0.95");
    chart.destroy();
    host.remove();
  });

  it("full-bandwidth overlap: based and compared share the SAME x and width for a column", () => {
    const { host, chart } = mount();
    const g = host.querySelector('g.data-group[data-label="Alpha One"]')!;
    const based = g.querySelector("rect.value-based")!;
    const compared = g.querySelector("rect.value-compared")!;
    expect(Number(based.getAttribute("x"))).toBe(Number(compared.getAttribute("x")));
    expect(Number(based.getAttribute("width"))).toBe(Number(compared.getAttribute("width")));
    expect(Number(based.getAttribute("width"))).toBeGreaterThan(0);
    chart.destroy();
    host.remove();
  });

  it("draws the shorter sub-bar on top so both stay visible, per row (mirrors ComparableHorizontalBarChart's comparableDrawOrder)", () => {
    const order = (host: HTMLElement, label: string) => {
      const rects = Array.from(
        host.querySelectorAll<SVGRectElement>(`g.data-group[data-label="${label}"] rect.bar`)
      );
      return rects.map((r) => (r.classList.contains("value-based") ? "based" : "compared"));
    };
    const { host, chart } = mount();
    // Alpha One grew (10 -> 18): the shorter "based" bar must be drawn LAST (on top).
    expect(order(host, "Alpha One")).toEqual(["compared", "based"]);
    // Beta shrank (30 -> 22): the shorter "compared" bar stays on top (legacy default).
    expect(order(host, "Beta")).toEqual(["based", "compared"]);
    chart.destroy();
    host.remove();
  });

  it("fills the value-based sub-bar from colorsBasedMapping (legacy tint hook)", () => {
    const { host, chart } = mount({
      colorsMapping: { "Alpha One": "#c0392b" },
      colorsBasedMapping: { "Alpha One": "#e9bab5" },
    });
    const g = host.querySelector('g.data-group[data-label="Alpha One"]')!;
    expect(g.querySelector("rect.value-based")!.getAttribute("fill")).toBe("#e9bab5");
    expect(g.querySelector("rect.value-compared")!.getAttribute("fill")).toBe("#c0392b");
    chart.destroy();
    host.remove();
  });

  it("excludes disabled labels and applies top-N filter", () => {
    const off = mount({ disabledItems: ["Gamma"] });
    expect(off.host.querySelectorAll("rect.bar").length).toBe(4); // 2 labels x 2
    off.chart.destroy();
    off.host.remove();

    const filtered = mount({ filter: { limit: 1, criteria: "valueBased", sortingDir: "desc" } });
    const ctx = filtered.chart.getContext()!;
    if (ctx.chartType === "comparable-vertical-bar-chart") {
      expect(ctx.series.map((s) => s.label)).toEqual(["Beta"]); // highest valueBased
    }
    filtered.chart.destroy();
    filtered.host.remove();
  });

  it("builds an a11y mirror with one row per category (4 columns, no deltaIndicator)", () => {
    const { host, chart } = mount();
    expect(host.querySelectorAll(".mv-a11y table tbody tr").length).toBe(3);
    const headers = Array.from(host.querySelectorAll(".mv-a11y table thead th")).map((t) => t.textContent);
    expect(headers).toEqual(["Label", "Based", "Compared", "Difference"]);
    chart.destroy();
    host.remove();
  });

  it("exposes a comparable-vertical-bar-chart context, identical in SVG and canvas (renderer aside)", () => {
    const a = mount({ renderer: "svg" });
    const b = mount({ renderer: "canvas" });
    const ca = a.chart.getContext()!;
    const cb = b.chart.getContext()!;
    expect(ca.chartType).toBe("comparable-vertical-bar-chart");
    if (ca.chartType === "comparable-vertical-bar-chart") {
      expect(ca.stats.count).toBe(3);
      expect(ca.series.find((s) => s.label === "Alpha One")!.difference).toBe(8); // 18-10
      expect(ca.stats.grew).toBe(1);
      expect(ca.stats.shrank).toBe(1);
      expect(ca.stats.unchanged).toBe(1);
    }
    const strip = (c: typeof ca) => ({ ...c, renderer: undefined });
    expect(strip(ca)).toEqual(strip(cb));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });

  it("fires onDataWarning for a non-finite value and update/destroy work", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    let warned: unknown[] = [];
    const chart = mountComparableVerticalBarChart(host, {
      dataSet: [{ label: "Bad", valueBased: NaN, valueCompared: 1 }],
      width: 400,
      height: 200,
      onDataWarning: (w) => (warned = w),
    });
    expect(warned.some((w) => (w as { type: string }).type === "non-finite-value")).toBe(true);
    chart.update({ dataSet: dataSet.slice(0, 1), width: 400, height: 200 });
    expect(host.querySelectorAll("rect.bar").length).toBe(2);
    chart.destroy();
    expect(host.querySelectorAll("svg").length).toBe(0);
    host.remove();
  });

  it("emits legendData (label/color/dataLabelSafe) on the context - the colour-authority hook", () => {
    const { host, chart } = mount({ colorsMapping: { Beta: "#abcdef" } });
    const ctx = chart.getContext()!;
    expect(Array.isArray(ctx.legendData)).toBe(true);
    expect(ctx.legendData!.map((l) => l.label)).toEqual(["Alpha One", "Beta", "Gamma"]);
    const beta = ctx.legendData!.find((l) => l.label === "Beta")!;
    expect(beta.color).toBe("#abcdef");
    expect(beta.dataLabelSafe).toBe(sanitizeForClassName("Beta"));
    chart.destroy();
    host.remove();
  });

  it("onChartDataProcessed is idempotent - fires once per distinct context (no dispatch loop)", () => {
    let calls = 0;
    const onChartDataProcessed = () => {
      calls++;
    };
    const { host, chart } = mount({ onChartDataProcessed });
    expect(calls).toBe(1); // initial
    chart.update({ dataSet, title: "Demo", width: 600, height: 300, onChartDataProcessed }); // same data
    expect(calls).toBe(1); // unchanged context -> NOT re-emitted
    chart.update({ dataSet: dataSet.slice(0, 2), title: "Demo", width: 600, height: 300, onChartDataProcessed });
    expect(calls).toBe(2); // changed -> emitted
    chart.destroy();
    host.remove();
  });

  it("yAxisDomain overrides the derived y-axis domain", () => {
    const { host, chart } = mount({ yAxisDomain: [-50, 50] });
    const ctx = chart.getContext()!;
    expect(ctx.chartType).toBe("comparable-vertical-bar-chart");
    if (ctx.chartType === "comparable-vertical-bar-chart") {
      expect(ctx.yAxis.domain).toEqual([-50, 50]);
    }
    chart.destroy();
    host.remove();
  });

  it("hitTest hover fires onHighlightItem in canvas mode (host-level hit-test uses column x + top/bottom of the two sub-bars)", () => {
    const highlighted: string[][] = [];
    const { host, chart } = mount({
      renderer: "canvas",
      onHighlightItem: (labels) => highlighted.push(labels),
    });
    // jsdom getBoundingClientRect() is all-zero, so clientX/clientY map straight to
    // the model's pixel coordinates. width=600, default margin left=60,right=50 puts
    // the first (of 3) columns roughly in [60, 236]; y near the bottom baseline.
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 200, bubbles: true }));
    expect(highlighted.length).toBeGreaterThan(0);
    chart.destroy();
    host.remove();
  });
});

describe("createComparableVerticalBarScales - maxBarWidth cap", () => {
  const margin = { top: 50, right: 10, bottom: 50, left: 20 };

  it("caps the band thickness and centres the bands when few columns would balloon", () => {
    const labels = ["Africa", "Rest of the World"];
    const uncapped = createComparableVerticalBarScales(labels, [0, 100], 600, 500, margin);
    expect(uncapped.xScale.bandwidth()).toBeGreaterThan(120); // 2 columns over ~570px = huge

    const capped = createComparableVerticalBarScales(labels, [0, 100], 600, 500, margin, 60);
    expect(capped.xScale.bandwidth()).toBeLessThanOrEqual(60 + 0.5);
    const left = capped.xScale(labels[0])!;
    const right = capped.xScale(labels[1])! + capped.xScale.bandwidth();
    const plotMid = (margin.left + (600 - margin.right)) / 2;
    expect((left + right) / 2).toBeCloseTo(plotMid, 1);
  });

  it("is a no-op for dense charts whose natural bandwidth is already below the cap", () => {
    const labels = Array.from({ length: 20 }, (_, i) => `col${i}`);
    const plain = createComparableVerticalBarScales(labels, [0, 100], 600, 500, margin);
    const withCap = createComparableVerticalBarScales(labels, [0, 100], 600, 500, margin, 60);
    expect(withCap.xScale.bandwidth()).toBeCloseTo(plain.xScale.bandwidth(), 5);
  });
});

describe("processComparableVerticalBarData - symmetricYDomain", () => {
  it("forces a symmetric domain [-M, M] with M = max(|min|, |max|)", () => {
    const data: ComparableBarDataPoint[] = [
      { label: "a", valueBased: -25, valueCompared: -25 },
      { label: "b", valueBased: 32, valueCompared: 32 },
    ];
    const sym = processComparableVerticalBarData(data, { symmetric: true });
    expect(sym.yAxisDomain).toEqual([-32, 32]); // 0 centred, sides mirror
    const asym = processComparableVerticalBarData(data, {});
    expect(asym.yAxisDomain).toEqual([-25, 32]);
  });
});

describe("deltaIndicator", () => {
  // Alpha One: 10 -> 18 (diff = valueCompared - valueBased = +8)
  // Beta:      30 -> 22 (diff = -8)
  // Gamma:     15 -> 15 (diff = 0)

  it("absent prop: zero .mv-delta nodes and bar markup is byte-identical to a mount with no deltaIndicator key at all", () => {
    const withoutKey = mount();
    const withShowFalse = mount({ deltaIndicator: { show: false } });
    expect(withoutKey.host.querySelectorAll(".mv-delta").length).toBe(0);
    expect(withShowFalse.host.querySelectorAll(".mv-delta").length).toBe(0);
    const rectAttrs = (host: HTMLElement) =>
      Array.from(host.querySelectorAll("rect.bar")).map((r) => r.outerHTML);
    expect(rectAttrs(withShowFalse.host)).toEqual(rectAttrs(withoutKey.host));
    withoutKey.chart.destroy();
    withoutKey.host.remove();
    withShowFalse.chart.destroy();
    withShowFalse.host.remove();
  });

  it("show:true renders one .mv-delta per category with the formatted label", () => {
    const { host, chart } = mount({ deltaIndicator: { show: true } });
    const deltas = host.querySelectorAll(".mv-delta");
    expect(deltas.length).toBe(3);
    const alpha = host.querySelector('.mv-delta[data-label="Alpha One"]')!;
    expect(alpha.querySelector(".mv-delta-label")!.textContent).toBe("+8");
    expect(alpha.querySelector(".mv-delta-arrow")).toBeTruthy();
    chart.destroy();
    host.remove();
  });

  it("geometry: the label anchor sits BELOW the glyph anchor (vertical stack, unlike the horizontal chart's glyph-then-label-to-the-right layout), both ABOVE the taller bar", () => {
    const based = { x: 10, width: 40, y: 100, height: 50 }; // top=100
    const compared = { x: 10, width: 40, y: 80, height: 70 }; // top=80 (taller)
    const model = computeComparableVerticalDelta(
      { label: "X", valueBased: 10, valueCompared: 18 },
      based,
      compared,
      10,
      40,
      { positiveIsGood: true, positiveIsUp: true, formatter: (d) => String(d) }
    );
    expect(model.labelY).toBeGreaterThan(model.y); // label below the glyph
    expect(model.y).toBeLessThan(80); // glyph above the taller (compared) bar's top
    expect(model.x).toBeCloseTo(10 + 40 / 2, 5); // centred on the column, not the legacy bandwidth/3
  });

  it.each([
    [true, true, "up", true, "down", false],
    [true, false, "down", true, "up", false],
    [false, true, "up", false, "down", true],
    [false, false, "down", false, "up", true],
  ])(
    "positiveIsGood=%s positiveIsUp=%s -> Alpha(+8)=%s/good:%s, Beta(-8)=%s/good:%s",
    (positiveIsGood, positiveIsUp, alphaDir, alphaGood, betaDir, betaGood) => {
      const { host, chart } = mount({ deltaIndicator: { show: true, positiveIsGood, positiveIsUp } });
      const GOOD = "#009688";
      const BAD = "#e91e63";
      const alphaArrow = host.querySelector('.mv-delta[data-label="Alpha One"] .mv-delta-arrow')!;
      expect(alphaArrow.classList.contains(`mv-delta-arrow--${alphaDir}`)).toBe(true);
      expect(alphaArrow.getAttribute("fill")).toBe(alphaGood ? GOOD : BAD);

      const betaArrow = host.querySelector('.mv-delta[data-label="Beta"] .mv-delta-arrow')!;
      expect(betaArrow.classList.contains(`mv-delta-arrow--${betaDir}`)).toBe(true);
      expect(betaArrow.getAttribute("fill")).toBe(betaGood ? GOOD : BAD);

      const gammaArrow = host.querySelector('.mv-delta[data-label="Gamma"] .mv-delta-arrow')!;
      expect(gammaArrow.classList.contains("mv-delta-arrow--flat")).toBe(true);
      expect(gammaArrow.getAttribute("fill")).toBe("#B2B2B2");

      chart.destroy();
      host.remove();
    }
  );

  it("context reflects the delta (unlike ComparableHorizontalBarChart): per-series deltaDirection/deltaColor/deltaLabel + improved/worsened stats + a 5th a11y column", () => {
    const { host, chart } = mount({ deltaIndicator: { show: true } });
    const ctx = chart.getContext()!;
    expect(ctx.chartType).toBe("comparable-vertical-bar-chart");
    if (ctx.chartType === "comparable-vertical-bar-chart") {
      const alpha = ctx.series.find((s) => s.label === "Alpha One")!;
      expect(alpha.deltaDirection).toBe("up");
      expect(alpha.deltaColor).toBe("#009688");
      expect(alpha.deltaLabel).toBe("+8");
      expect(ctx.stats.improved).toBe(1); // Alpha grew (good, default mapping)
      expect(ctx.stats.worsened).toBe(1); // Beta shrank (bad, default mapping)
      expect(ctx.a11yTable.headers).toEqual(["Label", "Based", "Compared", "Difference", "Change"]);
    }
    chart.destroy();
    host.remove();
  });

  it("formatter override takes full control of the label (no automatic +/- prefix)", () => {
    const { host, chart } = mount({
      deltaIndicator: { show: true, formatter: (diff) => `Δ${diff}` },
    });
    const alpha = host.querySelector('.mv-delta[data-label="Alpha One"] .mv-delta-label')!;
    expect(alpha.textContent).toBe("Δ8");
    chart.destroy();
    host.remove();
  });

  it("default formatter uses yAxisFormat when provided", () => {
    const { host, chart } = mount({
      deltaIndicator: { show: true },
      yAxisFormat: (d) => `${d}kg`,
    });
    const alpha = host.querySelector('.mv-delta[data-label="Alpha One"] .mv-delta-label')!;
    expect(alpha.textContent).toBe("+8kg");
    chart.destroy();
    host.remove();
  });
});

describe("chrome quad: isLoading / isNodata / noDataLabel / suppressDefaultOverlay", () => {
  it("ready: bars drawn, data-mv-state=ready", () => {
    const { host, chart } = mount();
    expect(host.getAttribute("data-mv-state")).toBe("ready");
    expect(host.querySelectorAll("rect.bar").length).toBeGreaterThan(0);
    chart.destroy();
    host.remove();
  });

  it("nodata (empty dataSet): no bars, data-mv-state=nodata, .mv-nodata overlay with noDataLabel text", () => {
    const { host, chart } = mount({ dataSet: [], noDataLabel: "Nothing to compare yet" });
    expect(host.getAttribute("data-mv-state")).toBe("nodata");
    expect(host.querySelectorAll("rect.bar").length).toBe(0);
    const overlay = host.querySelector(".mv-nodata");
    expect(overlay).not.toBeNull();
    expect(overlay!.textContent).toBe("Nothing to compare yet");
    chart.destroy();
    host.remove();
  });

  it("isLoading: data-mv-state=loading, .mv-loading overlay, stale bars hidden", () => {
    const { host, chart } = mount({ isLoading: true });
    expect(host.getAttribute("data-mv-state")).toBe("loading");
    expect(host.querySelector(".mv-loading")).not.toBeNull();
    chart.destroy();
    host.remove();
  });

  it("suppressDefaultOverlay: nodata state is still stamped, but no .mv-nodata DOM node (a wrapper renders its own)", () => {
    const { host, chart } = mount({ dataSet: [], suppressDefaultOverlay: true });
    expect(host.getAttribute("data-mv-state")).toBe("nodata");
    expect(host.querySelector(".mv-nodata")).toBeNull();
    chart.destroy();
    host.remove();
  });
});

describe("SVG pattern fill (patternsMapping) - real <defs><pattern>", () => {
  it("emits a <pattern> in <defs> and the value-based rect fills with url(#id) for a mapped label", () => {
    const { host, chart } = mount({ patternsMapping: { "Alpha One": "data:image/svg+xml,<svg/>" } });
    const pattern = host.querySelector("defs.mv-pattern-defs pattern");
    expect(pattern).toBeTruthy();
    expect(pattern!.querySelector("image")!.getAttribute("href")).toBe("data:image/svg+xml,<svg/>");
    const g = host.querySelector('g.data-group[data-label="Alpha One"]')!;
    const based = g.querySelector("rect.value-based")!;
    expect(based.getAttribute("fill")).toBe(`url(#${pattern!.id})`);
    // Unmapped labels keep their flat colour fill.
    const beta = host.querySelector('g.data-group[data-label="Beta"] rect.value-based')!;
    expect(beta.getAttribute("fill")!.startsWith("url(")).toBe(false);
    chart.destroy();
    host.remove();
  });
});
