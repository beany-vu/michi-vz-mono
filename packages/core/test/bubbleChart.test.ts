import { describe, it, expect } from "vitest";
import { mountBubbleChart } from "../src/engine/bubbleChart";
import { sanitizeForClassName } from "../src/math/sanitize";
import type { BubbleChartProps, BubbleDataItem } from "../src/types";

const data: BubbleDataItem[] = [
  { label: "Germany", value: 100, partial: 72 },
  { label: "France", value: 60, partial: 30 },
  { label: "Spain", value: 40, partial: 10 },
];

function mount(props: Partial<BubbleChartProps> & { dataSet: BubbleDataItem[] }) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountBubbleChart(host, { width: 600, height: 480, title: "Demo", ...props });
  return { host, chart };
}

describe("mountBubbleChart (jsdom)", () => {
  it("renders one circle per bubble with the colour-contract attributes", () => {
    const { host, chart } = mount({ dataSet: data, showSplit: false });
    const bubbles = host.querySelectorAll<SVGCircleElement>("circle.bubble");
    expect(bubbles.length).toBe(3);
    const safes = Array.from(bubbles).map((b) => b.getAttribute("data-label-safe"));
    expect(safes).toContain(sanitizeForClassName("Germany"));
    expect(bubbles[0].getAttribute("data-label")).toBeTruthy();
    // Radius is area-proportional: Germany (100) bigger than Spain (40).
    const g = host.querySelector<SVGCircleElement>('circle.bubble[data-label="Germany"]')!;
    const s = host.querySelector<SVGCircleElement>('circle.bubble[data-label="Spain"]')!;
    expect(Number(g.getAttribute("r"))).toBeGreaterThan(Number(s.getAttribute("r")));
    chart.destroy();
    host.remove();
  });

  it("draws a realized core + white veil when partial is present", () => {
    const { host, chart } = mount({ dataSet: data });
    expect(host.querySelectorAll("circle.bubble").length).toBe(3);
    const veils = host.querySelectorAll<SVGCircleElement>("circle.bubble-veil");
    const cores = host.querySelectorAll<SVGCircleElement>("circle.bubble-realized");
    expect(veils.length).toBe(3);
    expect(cores.length).toBe(3);
    // The realized core is smaller than the full bubble and is full-colour.
    for (const core of Array.from(cores)) {
      const safe = core.getAttribute("data-label-safe");
      const base = host.querySelector<SVGCircleElement>(`circle.bubble[data-label-safe="${safe}"]`)!;
      expect(Number(core.getAttribute("r"))).toBeLessThan(Number(base.getAttribute("r")));
    }
    for (const v of Array.from(veils)) expect(v.getAttribute("fill")).toBe("#ffffff");
    chart.destroy();
    host.remove();
  });

  it("exposes a bubble context with split + remainder stats", () => {
    const { host, chart } = mount({ dataSet: data });
    const ctx = chart.getContext()!;
    expect(ctx.chartType).toBe("bubble-chart");
    if (ctx.chartType === "bubble-chart") {
      expect(ctx.bubbles.length).toBe(3);
      expect(ctx.stats.total).toBe(200);
      expect(ctx.stats.totalPartial).toBe(112);
      expect(ctx.stats.totalRemainder).toBe(88);
      expect(ctx.stats.largestBubble).toEqual({ label: "Germany", value: 100 });
      expect(ctx.stats.largestRemainder).toEqual({ label: "France", remainder: 30 });
      const germany = ctx.bubbles.find((b) => b.label === "Germany")!;
      expect(germany.partialPct).toBeCloseTo(0.72, 5);
      expect(germany.remainder).toBe(28);
    }
    chart.destroy();
    host.remove();
  });

  it("produces identical context in SVG and canvas (renderer aside)", () => {
    const a = mount({ dataSet: data, renderer: "svg" });
    const b = mount({ dataSet: data, renderer: "canvas" });
    const ca = a.chart.getContext()!;
    const cb = b.chart.getContext()!;
    const strip = (c: typeof ca) => ({ ...c, renderer: undefined });
    expect(strip(ca)).toEqual(strip(cb));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });

  it("settles to a deterministic, reproducible layout", () => {
    const a = mount({ dataSet: data });
    const b = mount({ dataSet: data });
    const pos = (h: HTMLElement) =>
      Array.from(h.querySelectorAll<SVGCircleElement>("circle.bubble")).map((c) => [
        Number(c.getAttribute("cx")),
        Number(c.getAttribute("cy")),
        Number(c.getAttribute("r")),
      ]);
    expect(pos(a.host)).toEqual(pos(b.host));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });

  it("keeps every bubble inside the plot box", () => {
    const { host, chart } = mount({ dataSet: data, width: 600, height: 480 });
    for (const c of Array.from(host.querySelectorAll<SVGCircleElement>("circle.bubble"))) {
      const cx = Number(c.getAttribute("cx"));
      const cy = Number(c.getAttribute("cy"));
      const r = Number(c.getAttribute("r"));
      expect(cx - r).toBeGreaterThanOrEqual(-0.5);
      expect(cx + r).toBeLessThanOrEqual(600.5);
      expect(cy - r).toBeGreaterThanOrEqual(-0.5);
      expect(cy + r).toBeLessThanOrEqual(480.5);
    }
    chart.destroy();
    host.remove();
  });

  it("custom splitLabels flow into context + a11y headers; no-split has Label+Value", () => {
    const split = mount({ dataSet: data, splitLabels: ["Used", "Spare"] });
    const sctx = split.chart.getContext()!;
    if (sctx.chartType === "bubble-chart") {
      expect(sctx.splitLabels).toEqual(["Used", "Spare"]);
      expect(sctx.a11yTable.headers).toEqual(["Label", "Value", "Used", "Spare", "%"]);
    }
    split.chart.destroy();
    split.host.remove();

    const plain = mount({ dataSet: [{ label: "A", value: 5 }, { label: "B", value: 3 }] });
    const pctx = plain.chart.getContext()!;
    if (pctx.chartType === "bubble-chart") expect(pctx.a11yTable.headers).toEqual(["Label", "Value"]);
    plain.chart.destroy();
    plain.host.remove();
  });

  it("disabledItems drops a bubble; filter keeps the top-N", () => {
    const disabled = mount({ dataSet: data, disabledItems: ["Spain"] });
    const dctx = disabled.chart.getContext()!;
    if (dctx.chartType === "bubble-chart") {
      expect(dctx.bubbles.map((b) => b.label).sort()).toEqual(["France", "Germany"]);
    }
    disabled.chart.destroy();
    disabled.host.remove();

    const top = mount({ dataSet: data, filter: { limit: 2, sortingDir: "desc" } });
    const tctx = top.chart.getContext()!;
    if (tctx.chartType === "bubble-chart") {
      expect(tctx.bubbles.map((b) => b.label).sort()).toEqual(["France", "Germany"]);
    }
    top.chart.destroy();
    top.host.remove();
  });

  it("fires onChartDataProcessed and warns on empty / partial>value", () => {
    let ctxType = "";
    const a = mount({ dataSet: data, onChartDataProcessed: (c) => (ctxType = c.chartType) });
    expect(ctxType).toBe("bubble-chart");
    a.chart.destroy();
    a.host.remove();

    let warned: unknown[] = [];
    const b = mount({ dataSet: [], onDataWarning: (w) => (warned = w) });
    expect(warned.some((w) => (w as { type: string }).type === "empty-dataset")).toBe(true);
    b.chart.destroy();
    b.host.remove();

    let warned2: unknown[] = [];
    const c = mount({
      dataSet: [{ label: "X", value: 10, partial: 20 }],
      onDataWarning: (w) => (warned2 = w),
    });
    expect(warned2.some((w) => (w as { type: string }).type === "difference-mismatch")).toBe(true);
    c.chart.destroy();
    c.host.remove();
  });

  it("update() re-renders and destroy() cleans up", () => {
    const { host, chart } = mount({ dataSet: data, showSplit: false });
    chart.update({ dataSet: data.slice(0, 2), width: 600, height: 480, showSplit: false });
    expect(host.querySelectorAll("circle.bubble").length).toBe(2);
    chart.destroy();
    expect(host.querySelectorAll("svg").length).toBe(0);
    host.remove();
  });

  it("packs bubbles with no overlap on several datasets", () => {
    const datasets: BubbleDataItem[][] = [
      data,
      [{ label: "A", value: 100 }, { label: "B", value: 60 }, { label: "C", value: 40 }],
      [{ label: "Big", value: 400 }, { label: "Tiny", value: 8 }],
      Array.from({ length: 20 }, (_, i) => ({ label: `m${i}`, value: ((i * 37) % 140) + 12 })),
    ];
    for (const ds of datasets) {
      const { host, chart } = mount({ dataSet: ds, showSplit: false, width: 700, height: 520 });
      const circles = Array.from(
        host.querySelectorAll<SVGCircleElement>("circle.bubble")
      ).map((c) => ({
        x: Number(c.getAttribute("cx")),
        y: Number(c.getAttribute("cy")),
        r: Number(c.getAttribute("r")),
      }));
      expect(circles.length).toBe(ds.length);
      for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
          const a = circles[i];
          const b = circles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          // Centre distance must be at least the sum of radii (1px tolerance).
          expect(dist).toBeGreaterThanOrEqual(a.r + b.r - 1);
        }
      }
      chart.destroy();
      host.remove();
    }
  });
});
