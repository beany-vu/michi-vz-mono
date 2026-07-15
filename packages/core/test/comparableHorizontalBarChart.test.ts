import { describe, it, expect } from "vitest";
import { mountComparableHorizontalBarChart } from "../src/engine/comparableHorizontalBarChart";
import { createComparableBarScales } from "../src/comparableBar/scales";
import { processComparableBarData } from "../src/comparableBar/data";
import { sanitizeForClassName } from "../src/math/sanitize";
import type { ComparableBarChartProps, ComparableBarDataPoint } from "../src/types";

const dataSet: ComparableBarDataPoint[] = [
  { label: "Alpha One", valueBased: 10, valueCompared: 18 },
  { label: "Beta", valueBased: 30, valueCompared: 22 },
  { label: "Gamma", valueBased: 15, valueCompared: 15 },
];

function mount(extra: Partial<ComparableBarChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountComparableHorizontalBarChart(host, {
    dataSet,
    title: "Demo",
    width: 600,
    height: 300,
    ...extra,
  });
  return { host, chart };
}

describe("mountComparableHorizontalBarChart (jsdom)", () => {
  it("renders two bars per label (based + compared) with data-label-safe", () => {
    const { host, chart } = mount();
    const bars = host.querySelectorAll<SVGRectElement>("rect.bar");
    expect(bars.length).toBe(6); // 3 labels x 2 sub-bars
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

  it("draws the shorter sub-bar on top so both stay visible (legacy z-order)", () => {
    const { host, chart } = mount();
    const order = (label: string) => {
      const rects = Array.from(
        host.querySelectorAll<SVGRectElement>(`g.data-group[data-label="${label}"] rect.bar`),
      );
      return rects.map((r) => (r.classList.contains("value-based") ? "based" : "compared"));
    };
    // Alpha One grew (10 -> 18): the shorter "based" bar must be drawn LAST (on top).
    expect(order("Alpha One")).toEqual(["compared", "based"]);
    // Beta shrank (30 -> 22): the shorter "compared" bar stays on top (legacy default).
    expect(order("Beta")).toEqual(["based", "compared"]);
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
    // Unmapped labels keep the row colour for both sub-bars.
    const beta = host.querySelector('g.data-group[data-label="Beta"]')!;
    expect(beta.querySelector("rect.value-based")!.getAttribute("fill")).toBe(
      beta.querySelector("rect.value-compared")!.getAttribute("fill"),
    );
    chart.destroy();
    host.remove();
  });

  it("interactiveRowLabels: scrubbing the gutter draws a leader line and shows the tooltip", () => {
    const { host, chart } = mount({ interactiveRowLabels: true });
    const strip = host.querySelector<SVGRectElement>(".mv-row-scrub")!;
    strip.dispatchEvent(new MouseEvent("pointermove", { clientY: 60, bubbles: true }));
    expect(host.querySelector(".mv-row-leader")).toBeTruthy();
    expect(host.querySelector<HTMLDivElement>(".tooltip")!.style.visibility).toBe("visible");
    strip.dispatchEvent(new MouseEvent("pointerleave", { bubbles: true }));
    expect(host.querySelector(".mv-row-leader")).toBeNull();
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
    if (ctx.chartType === "comparable-horizontal-bar-chart") {
      expect(ctx.series.map((s) => s.label)).toEqual(["Beta"]); // highest valueBased
    }
    filtered.chart.destroy();
    filtered.host.remove();
  });

  it("builds an a11y mirror with one row per label", () => {
    const { host, chart } = mount();
    expect(host.querySelectorAll(".mv-a11y table tbody tr").length).toBe(3);
    const headers = Array.from(host.querySelectorAll(".mv-a11y table thead th")).map(
      (t) => t.textContent,
    );
    expect(headers).toEqual(["Label", "Based", "Compared", "Difference"]);
    chart.destroy();
    host.remove();
  });

  it("exposes a comparable-bar context, identical in SVG and canvas (renderer aside)", () => {
    const a = mount({ renderer: "svg" });
    const b = mount({ renderer: "canvas" });
    const ca = a.chart.getContext()!;
    const cb = b.chart.getContext()!;
    expect(ca.chartType).toBe("comparable-horizontal-bar-chart");
    if (ca.chartType === "comparable-horizontal-bar-chart") {
      expect(ca.stats.count).toBe(3);
      expect(ca.series.find((s) => s.label === "Alpha One")!.difference).toBe(8); // 18-10
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
    const chart = mountComparableHorizontalBarChart(host, {
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
    // Without legendData, thd's setMetadata early-returns and every bar resolves
    // transparent. dataLabelSafe must equal sanitizeForClassName(label).
    const { host, chart } = mount({ colorsMapping: { Beta: "#abcdef" } });
    const ctx = chart.getContext()!;
    expect(Array.isArray(ctx.legendData)).toBe(true);
    expect(ctx.legendData!.map((l) => l.label)).toEqual(["Alpha One", "Beta", "Gamma"]);
    const beta = ctx.legendData!.find((l) => l.label === "Beta")!;
    expect(beta.color).toBe("#abcdef");
    expect(beta.dataLabelSafe).toBe(sanitizeForClassName("Beta"));
    const alpha = ctx.legendData!.find((l) => l.label === "Alpha One")!;
    expect(alpha.dataLabelSafe).toBe(sanitizeForClassName("Alpha One")); // "Alpha_One"
    chart.destroy();
    host.remove();
  });

  it("onChartDataProcessed is idempotent - fires once per distinct context (no dispatch loop)", () => {
    // A consumer colour authority dispatches into redux on every call; re-firing an
    // unchanged context every render is the "Maximum update depth" loop.
    let calls = 0;
    const onChartDataProcessed = () => {
      calls++;
    };
    const { host, chart } = mount({ onChartDataProcessed });
    expect(calls).toBe(1); // initial
    chart.update({ dataSet, title: "Demo", width: 600, height: 300, onChartDataProcessed }); // same data
    expect(calls).toBe(1); // unchanged context → NOT re-emitted
    chart.update({
      dataSet: dataSet.slice(0, 2),
      title: "Demo",
      width: 600,
      height: 300,
      onChartDataProcessed,
    });
    expect(calls).toBe(2); // changed → emitted
    chart.destroy();
    host.remove();
  });

  it("xAxisPredefinedDomain (legacy alias) overrides the derived x-axis domain", () => {
    const { host, chart } = mount({ xAxisPredefinedDomain: [-50, 50] });
    const ctx = chart.getContext()!;
    expect(ctx.chartType).toBe("comparable-horizontal-bar-chart");
    if (ctx.chartType === "comparable-horizontal-bar-chart") {
      expect(ctx.xAxis.domain).toEqual([-50, 50]);
    }
    chart.destroy();
    host.remove();
  });
});

describe("SVG pattern fill (patternsMapping) - backported from ComparableVerticalBarChart", () => {
  it("emits a <pattern> in <defs> and the value-based rect fills with url(#id) for a mapped label", () => {
    const { host, chart } = mount({
      patternsMapping: { "Alpha One": "data:image/svg+xml,<svg/>" },
    });
    const pattern = host.querySelector("defs.mv-pattern-defs pattern");
    expect(pattern).toBeTruthy();
    expect(pattern!.querySelector("image")!.getAttribute("href")).toBe("data:image/svg+xml,<svg/>");
    const g = host.querySelector('g.data-group[data-label="Alpha One"]')!;
    const based = g.querySelector("rect.value-based")!;
    expect(based.getAttribute("fill")).toBe(`url(#${pattern!.id})`);
    const beta = host.querySelector('g.data-group[data-label="Beta"] rect.value-based')!;
    expect(beta.getAttribute("fill")!.startsWith("url(")).toBe(false);
    chart.destroy();
    host.remove();
  });

  it("canvas mode is unaffected (still tiles via ctx.createPattern, no <defs> needed)", () => {
    const { host, chart } = mount({
      patternsMapping: { "Alpha One": "data:image/svg+xml,<svg/>" },
      renderer: "canvas",
    });
    expect(host.querySelector("defs.mv-pattern-defs")).toBeNull();
    chart.destroy();
    host.remove();
  });
});

describe("layout: overlay (default) vs grouped", () => {
  it("default (layout omitted) keeps overlay geometry: based/compared share the full band", () => {
    const { host, chart } = mount();
    const g = host.querySelector('g.data-group[data-label="Alpha One"]')!;
    const based = g.querySelector("rect.value-based")!;
    const compared = g.querySelector("rect.value-compared")!;
    const basedY = Number(based.getAttribute("y"));
    const basedH = Number(based.getAttribute("height"));
    const comparedY = Number(compared.getAttribute("y"));
    const comparedH = Number(compared.getAttribute("height"));
    expect(basedY).toBe(comparedY);
    expect(basedH).toBe(comparedH);
    expect(basedH).toBeGreaterThan(0);
    chart.destroy();
    host.remove();
  });

  it('layout: "overlay" (explicit) is byte-identical to the default', () => {
    const a = mount();
    const b = mount({ layout: "overlay" });
    const rectAttrs = (host: HTMLElement) =>
      Array.from(host.querySelectorAll("rect.bar")).map((r) => r.outerHTML);
    expect(rectAttrs(a.host)).toEqual(rectAttrs(b.host));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });

  it('layout: "grouped" splits the band: valueBased on top half, valueCompared on bottom half, no overlap', () => {
    const { host, chart } = mount({ layout: "grouped" });
    const g = host.querySelector('g.data-group[data-label="Alpha One"]')!;
    const based = g.querySelector("rect.value-based")!;
    const compared = g.querySelector("rect.value-compared")!;
    const basedY = Number(based.getAttribute("y"));
    const basedH = Number(based.getAttribute("height"));
    const comparedY = Number(compared.getAttribute("y"));
    const comparedH = Number(compared.getAttribute("height"));

    // Halves are equal thickness and exactly half the (unsplit) band.
    expect(basedH).toBeCloseTo(comparedH, 5);
    // based occupies the TOP half, compared the BOTTOM half, contiguous (no gap, no overlap).
    expect(basedY).toBeLessThan(comparedY);
    expect(comparedY).toBeCloseTo(basedY + basedH, 5);

    // The full row band (from the default/overlay mount) equals based+compared height combined.
    const overlayMount = mount();
    const overlayBased = overlayMount.host.querySelector(
      'g.data-group[data-label="Alpha One"] rect.value-based',
    )!;
    const fullBandHeight = Number(overlayBased.getAttribute("height"));
    expect(basedH + comparedH).toBeCloseTo(fullBandHeight, 5);
    expect(basedY).toBeCloseTo(Number(overlayBased.getAttribute("y")), 5);
    overlayMount.chart.destroy();
    overlayMount.host.remove();

    chart.destroy();
    host.remove();
  });

  it('layout: "grouped" keeps the sub-bar DOM/probe contract identical (g.data-group[data-label-safe] > rect.bar.value-based/.value-compared)', () => {
    const { host, chart } = mount({ layout: "grouped" });
    const bars = host.querySelectorAll<SVGRectElement>("rect.bar");
    expect(bars.length).toBe(6); // 3 labels x 2 sub-bars, same as overlay
    expect(host.querySelectorAll("rect.bar.value-based").length).toBe(3);
    expect(host.querySelectorAll("rect.bar.value-compared").length).toBe(3);
    const g = host.querySelector('g.data-group[data-label="Alpha One"]')!;
    expect(g.getAttribute("data-label-safe")).toBe(sanitizeForClassName("Alpha One"));
    for (const rect of g.querySelectorAll("rect.bar")) {
      expect(rect.getAttribute("data-label-safe")).toBe(sanitizeForClassName("Alpha One"));
    }
    chart.destroy();
    host.remove();
  });

  it('layout: "grouped" respects maxBarHeight: caps the FULL band, halves are half of the capped value', () => {
    const capped = mount({ layout: "grouped", maxBarHeight: 60 });
    const g = capped.host.querySelector('g.data-group[data-label="Alpha One"]')!;
    const basedH = Number(g.querySelector("rect.value-based")!.getAttribute("height"));
    const comparedH = Number(g.querySelector("rect.value-compared")!.getAttribute("height"));
    expect(basedH).toBeCloseTo(comparedH, 5);
    expect(basedH).toBeLessThanOrEqual(30 + 0.5); // half of the 60px cap
    capped.chart.destroy();
    capped.host.remove();
  });

  it('layout: "grouped" still honours colorsBasedMapping, opacities, and the legacy z-order (same fields as overlay)', () => {
    const { host, chart } = mount({
      layout: "grouped",
      colorsMapping: { "Alpha One": "#c0392b" },
      colorsBasedMapping: { "Alpha One": "#e9bab5" },
      valueBasedOpacity: 0.4,
      valueComparedOpacity: 0.95,
    });
    const g = host.querySelector('g.data-group[data-label="Alpha One"]')!;
    expect(g.querySelector("rect.value-based")!.getAttribute("fill")).toBe("#e9bab5");
    expect(g.querySelector("rect.value-compared")!.getAttribute("fill")).toBe("#c0392b");
    expect(g.querySelector("rect.value-based")!.getAttribute("opacity")).toBe("0.4");
    expect(g.querySelector("rect.value-compared")!.getAttribute("opacity")).toBe("0.95");
    chart.destroy();
    host.remove();
  });

  it('layout: "grouped" exposes a comparable-bar context identical in SVG and canvas (extends the svg-vs-canvas parity test above to grouped mode)', () => {
    const a = mount({ layout: "grouped", renderer: "svg" });
    const b = mount({ layout: "grouped", renderer: "canvas" });
    const ca = a.chart.getContext()!;
    const cb = b.chart.getContext()!;
    expect(ca.chartType).toBe("comparable-horizontal-bar-chart");
    if (ca.chartType === "comparable-horizontal-bar-chart") {
      expect(ca.stats.count).toBe(3);
      expect(ca.series.find((s) => s.label === "Alpha One")!.difference).toBe(8); // 18-10
    }
    const strip = (c: typeof ca) => ({ ...c, renderer: undefined });
    expect(strip(ca)).toEqual(strip(cb));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });
});

describe("numeric x-axis tick collision avoidance (autoRotate)", () => {
  it("rotates -45deg tick labels when a narrow width would otherwise collide", () => {
    const { host, chart } = mount({
      width: 260,
      xAxisFormat: (d) => `Value ${d} thousand units`,
    });
    const rotatedLabel = host.querySelector('.mv-x-axis text[transform*="rotate(-45)"]');
    expect(rotatedLabel).not.toBeNull();
    chart.destroy();
    host.remove();
  });

  it("keeps labels horizontal (no rotation) when they comfortably fit", () => {
    const { host, chart } = mount({ width: 900 });
    const rotatedLabel = host.querySelector('.mv-x-axis text[transform*="rotate(-45)"]');
    expect(rotatedLabel).toBeNull();
    chart.destroy();
    host.remove();
  });
});

describe("showZeroLineForXAxis draws independent of showGrid (default showGrid:false)", () => {
  it("draws only the solid zero line, with no other x-axis grid lines, when showGrid is left at its default (false)", () => {
    const { host, chart } = mount({ showZeroLineForXAxis: true });
    const lines = Array.from(host.querySelectorAll(".mv-x-axis line.mv-grid"));
    expect(lines.length).toBe(1);
    expect(lines[0].getAttribute("class")).toContain("mv-tick-zero");
    expect(lines[0].getAttribute("stroke-dasharray")).toBe("none");
    chart.destroy();
    host.remove();
  });

  it("draws no x-axis line at all when showZeroLineForXAxis is left at its default (false)", () => {
    const { host, chart } = mount();
    expect(host.querySelectorAll(".mv-x-axis line.mv-grid").length).toBe(0);
    chart.destroy();
    host.remove();
  });
});

describe("y-band gridlines respect showGrid (no phantom horizontal lines)", () => {
  it("draws NO .mv-y-axis .mv-grid line (the engine passes y-band showGrid:false)", () => {
    // Regression: the old `stroke=transparent` fallback was overridden by the
    // `.mv-grid { stroke }` CSS, so a dashed line drew under every bar despite showGrid:false.
    const { host, chart } = mount();
    expect(host.querySelectorAll(".mv-y-axis .mv-grid").length).toBe(0);
    chart.destroy();
    host.remove();
  });
});

describe("createComparableBarScales - maxBarHeight cap", () => {
  const margin = { top: 50, right: 10, bottom: 50, left: 20 };

  it("caps the band thickness and centres the bands when few rows would balloon", () => {
    const labels = ["Africa", "Rest of the World"];
    const uncapped = createComparableBarScales([0, 100], labels, 600, 500, margin);
    expect(uncapped.yScale.bandwidth()).toBeGreaterThan(120); // 2 rows over ~400px = huge

    const capped = createComparableBarScales([0, 100], labels, 600, 500, margin, undefined, 60);
    expect(capped.yScale.bandwidth()).toBeLessThanOrEqual(60 + 0.5);
    // centred: equal whitespace above the first band and below the last
    const top = capped.yScale(labels[0])!;
    const bottom = capped.yScale(labels[1])! + capped.yScale.bandwidth();
    const plotMid = (margin.top + (500 - margin.bottom)) / 2;
    expect((top + bottom) / 2).toBeCloseTo(plotMid, 1);
  });

  it("is a no-op for dense charts whose natural bandwidth is already below the cap", () => {
    const labels = Array.from({ length: 20 }, (_, i) => `row${i}`);
    const plain = createComparableBarScales([0, 100], labels, 600, 500, margin);
    const withCap = createComparableBarScales([0, 100], labels, 600, 500, margin, undefined, 60);
    expect(withCap.yScale.bandwidth()).toBeCloseTo(plain.yScale.bandwidth(), 5);
  });
});

describe("processComparableBarData - symmetricXDomain", () => {
  it("forces a symmetric domain [-M, M] with M = max(|min|, |max|)", () => {
    const data: ComparableBarDataPoint[] = [
      { label: "a", valueBased: -25, valueCompared: -25 },
      { label: "b", valueBased: 32, valueCompared: 32 },
    ];
    const sym = processComparableBarData(data, { symmetric: true });
    expect(sym.xAxisDomain).toEqual([-32, 32]); // 0 centred, sides mirror
    // asymmetric (default) keeps the raw [min, max] spanning zero
    const asym = processComparableBarData(data, {});
    expect(asym.xAxisDomain).toEqual([-25, 32]);
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

  it("show:true renders one .mv-delta per row with the formatted label", () => {
    const { host, chart } = mount({ deltaIndicator: { show: true } });
    const deltas = host.querySelectorAll(".mv-delta");
    expect(deltas.length).toBe(3);
    const alpha = host.querySelector('.mv-delta[data-label="Alpha One"]')!;
    expect(alpha.querySelector(".mv-delta-label")!.textContent).toBe("+8");
    chart.destroy();
    host.remove();
  });

  it.each([
    // [positiveIsGood, positiveIsUp, alphaDirection(+8), alphaColorIsGood, betaDirection(-8), betaColorIsGood]
    [true, true, "up", true, "down", false],
    [true, false, "down", true, "up", false],
    [false, true, "up", false, "down", true],
    [false, false, "down", false, "up", true],
  ])(
    "positiveIsGood=%s positiveIsUp=%s -> Alpha(+8)=%s/good:%s, Beta(-8)=%s/good:%s",
    (positiveIsGood, positiveIsUp, alphaDir, alphaGood, betaDir, betaGood) => {
      const { host, chart } = mount({
        deltaIndicator: { show: true, positiveIsGood, positiveIsUp },
      });
      const GOOD = "#009688";
      const BAD = "#e91e63";
      const alphaArrow = host.querySelector('.mv-delta[data-label="Alpha One"] .mv-delta-arrow')!;
      expect(alphaArrow.classList.contains(`mv-delta-arrow--${alphaDir}`)).toBe(true);
      expect(alphaArrow.getAttribute("fill")).toBe(alphaGood ? GOOD : BAD);

      const betaArrow = host.querySelector('.mv-delta[data-label="Beta"] .mv-delta-arrow')!;
      expect(betaArrow.classList.contains(`mv-delta-arrow--${betaDir}`)).toBe(true);
      expect(betaArrow.getAttribute("fill")).toBe(betaGood ? GOOD : BAD);

      // Zero delta (Gamma) is always neutral + flat, regardless of the flags.
      const gammaArrow = host.querySelector('.mv-delta[data-label="Gamma"] .mv-delta-arrow')!;
      expect(gammaArrow.classList.contains("mv-delta-arrow--flat")).toBe(true);
      expect(gammaArrow.getAttribute("fill")).toBe("#B2B2B2");

      chart.destroy();
      host.remove();
    },
  );

  it("formatter override takes full control of the label (no automatic +/- prefix)", () => {
    const { host, chart } = mount({
      deltaIndicator: { show: true, formatter: (diff) => `Δ${diff}` },
    });
    const alpha = host.querySelector('.mv-delta[data-label="Alpha One"] .mv-delta-label')!;
    expect(alpha.textContent).toBe("Δ8");
    const beta = host.querySelector('.mv-delta[data-label="Beta"] .mv-delta-label')!;
    expect(beta.textContent).toBe("Δ-8");
    chart.destroy();
    host.remove();
  });

  it("default formatter uses xAxisFormat when provided", () => {
    const { host, chart } = mount({
      deltaIndicator: { show: true },
      xAxisFormat: (d) => `${d}kg`,
    });
    const alpha = host.querySelector('.mv-delta[data-label="Alpha One"] .mv-delta-label')!;
    expect(alpha.textContent).toBe("+8kg");
    const beta = host.querySelector('.mv-delta[data-label="Beta"] .mv-delta-label')!;
    expect(beta.textContent).toBe("-8kg");
    chart.destroy();
    host.remove();
  });

  it("default formatter falls back to a locale number formatter when xAxisFormat is absent", () => {
    const { host, chart } = mount({ deltaIndicator: { show: true } });
    const alpha = host.querySelector('.mv-delta[data-label="Alpha One"] .mv-delta-label')!;
    expect(alpha.textContent).toBe("+8");
    chart.destroy();
    host.remove();
  });

  it("renders in both layout: overlay and layout: grouped", () => {
    const overlay = mount({ deltaIndicator: { show: true }, layout: "overlay" });
    const grouped = mount({ deltaIndicator: { show: true }, layout: "grouped" });
    expect(overlay.host.querySelectorAll(".mv-delta").length).toBe(3);
    expect(grouped.host.querySelectorAll(".mv-delta").length).toBe(3);
    overlay.chart.destroy();
    overlay.host.remove();
    grouped.chart.destroy();
    grouped.host.remove();
  });
});
