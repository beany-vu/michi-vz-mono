import { describe, it, expect } from "vitest";
import { mountTreemapChart } from "../src/engine/treemapChart";
import { sanitizeForClassName } from "../src/math/sanitize";
import type { TreemapChartProps, TreemapNode } from "../src/types";

const flat: TreemapNode[] = [
  { label: "Coffee", value: 100, partial: 72 },
  { label: "Tea", value: 60, partial: 30 },
  { label: "Cocoa", value: 40, partial: 10 },
];

const nested: TreemapNode[] = [
  {
    label: "Beverages",
    children: [
      { label: "Coffee", value: 100, partial: 72 },
      { label: "Tea", value: 60, partial: 30 },
    ],
  },
  { label: "Confectionery", children: [{ label: "Cocoa", value: 40, partial: 10 }] },
];

function mount(props: Partial<TreemapChartProps> & { dataSet: TreemapNode[] }) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountTreemapChart(host, { width: 600, height: 400, title: "Demo", ...props });
  return { host, chart };
}

describe("mountTreemapChart (jsdom)", () => {
  it("renders one tile per leaf with the colour-contract attributes", () => {
    const { host, chart } = mount({ dataSet: flat, showSplit: false });
    const tiles = host.querySelectorAll<SVGRectElement>("rect.tile");
    expect(tiles.length).toBe(3); // single-fill: one rect per leaf
    const safes = Array.from(tiles).map((t) => t.getAttribute("data-label-safe"));
    expect(safes).toContain(sanitizeForClassName("Coffee"));
    expect(tiles[0].getAttribute("data-leaf")).toBeTruthy();
    chart.destroy();
    host.remove();
  });

  it("overlays a white veil on the untapped part when partial is present", () => {
    const { host, chart } = mount({ dataSet: flat });
    // One solid base tile per leaf (veil is a separate .tile-veil rect).
    expect(host.querySelectorAll("rect.tile").length).toBe(3);
    const veils = host.querySelectorAll<SVGRectElement>("rect.tile-veil");
    expect(veils.length).toBe(3);
    // The veil covers the untapped (right) fraction: it starts after realizedWidth
    // and is narrower than the full tile.
    for (const v of Array.from(veils)) {
      const base = host.querySelector<SVGRectElement>(`rect.tile[data-leaf="${v.getAttribute("data-leaf")}"]`)!;
      expect(Number(v.getAttribute("x"))).toBeGreaterThanOrEqual(Number(base.getAttribute("x")));
      expect(Number(v.getAttribute("width"))).toBeLessThan(Number(base.getAttribute("width")));
      expect(v.getAttribute("fill")).toBe("#ffffff");
    }
    chart.destroy();
    host.remove();
  });

  it("exposes a treemap context with split + remainder stats", () => {
    const { host, chart } = mount({ dataSet: flat });
    const ctx = chart.getContext()!;
    expect(ctx.chartType).toBe("treemap-chart");
    if (ctx.chartType === "treemap-chart") {
      expect(ctx.leaves.length).toBe(3);
      expect(ctx.stats.grandTotal).toBe(200);
      expect(ctx.stats.totalPartial).toBe(112);
      expect(ctx.stats.totalRemainder).toBe(88);
      expect(ctx.stats.largestLeaf).toEqual({ label: "Coffee", value: 100 });
      // Tea & Cocoa both have remainder 30; first max wins (Tea).
      expect(ctx.stats.largestRemainder).toEqual({ label: "Tea", remainder: 30 });
      const coffee = ctx.leaves.find((l) => l.label === "Coffee")!;
      expect(coffee.partialPct).toBeCloseTo(0.72, 5);
      expect(coffee.remainder).toBe(28);
    }
    chart.destroy();
    host.remove();
  });

  it("carries legendData with the veiled paleColor companion when a split is active", () => {
    const withSplit = mount({ dataSet: flat, colorsMapping: { Coffee: "#c0392b" } });
    const ctx = withSplit.chart.getContext()!;
    if (ctx.chartType === "treemap-chart") {
      const coffee = ctx.legendData!.find((l) => l.label === "Coffee")!;
      expect(coffee.color).toBe("#c0392b");
      // splitOpacity default 0.35 -> veil 0.65 -> the exact white-mix the renderer paints.
      expect(coffee.paleColor).toBe("#e9bab5");
    }
    withSplit.chart.destroy();
    withSplit.host.remove();

    const noSplit = mount({ dataSet: flat, showSplit: false });
    const ctx2 = noSplit.chart.getContext()!;
    if (ctx2.chartType === "treemap-chart") {
      expect(ctx2.legendData!.every((l) => l.paleColor === undefined)).toBe(true);
    }
    noSplit.chart.destroy();
    noSplit.host.remove();
  });

  it("produces identical context in SVG and canvas (renderer aside)", () => {
    const a = mount({ dataSet: nested, renderer: "svg" });
    const b = mount({ dataSet: nested, renderer: "canvas" });
    const ca = a.chart.getContext()!;
    const cb = b.chart.getContext()!;
    const strip = (c: typeof ca) => ({ ...c, renderer: undefined });
    expect(strip(ca)).toEqual(strip(cb));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });

  it("renders parent containers and reports nesting depth + path", () => {
    const { host, chart } = mount({ dataSet: nested });
    expect(host.querySelectorAll("rect.tile-group").length).toBe(2); // Beverages, Confectionery
    const ctx = chart.getContext()!;
    if (ctx.chartType === "treemap-chart") {
      expect(ctx.depth).toBe(2);
      expect(ctx.leaves.find((l) => l.label === "Coffee")!.path).toEqual(["Beverages", "Coffee"]);
    }
    chart.destroy();
    host.remove();
  });

  it("flows custom splitLabels into the context + a11y table headers", () => {
    const { host, chart } = mount({ dataSet: flat, splitLabels: ["Realized", "Untapped"] });
    const ctx = chart.getContext()!;
    if (ctx.chartType === "treemap-chart") {
      expect(ctx.splitLabels).toEqual(["Realized", "Untapped"]);
      expect(ctx.a11yTable.headers).toEqual(["Label", "Value", "Realized", "Untapped", "%"]);
      expect(ctx.summary).toContain("Treemap");
    }
    expect(host.querySelector(".mv-a11y")!.getAttribute("aria-label")).toContain("Treemap");
    chart.destroy();
    host.remove();
  });

  it("a11y table without split has just Label + Value", () => {
    const { host, chart } = mount({ dataSet: [{ label: "A", value: 5 }, { label: "B", value: 3 }] });
    const ctx = chart.getContext()!;
    if (ctx.chartType === "treemap-chart") expect(ctx.a11yTable.headers).toEqual(["Label", "Value"]);
    chart.destroy();
    host.remove();
  });

  it("disabledItems drops a node; filter keeps the top-N leaves", () => {
    const disabled = mount({ dataSet: flat, disabledItems: ["Cocoa"] });
    expect(disabled.chart.getContext()!.chartType).toBe("treemap-chart");
    const dctx = disabled.chart.getContext()!;
    if (dctx.chartType === "treemap-chart") expect(dctx.leaves.map((l) => l.label)).toEqual(["Coffee", "Tea"]);
    disabled.chart.destroy();
    disabled.host.remove();

    const top = mount({ dataSet: flat, filter: { limit: 2, sortingDir: "desc" } });
    const tctx = top.chart.getContext()!;
    if (tctx.chartType === "treemap-chart") {
      expect(tctx.leaves.map((l) => l.label).sort()).toEqual(["Coffee", "Tea"]);
    }
    top.chart.destroy();
    top.host.remove();
  });

  it("fires onChartDataProcessed and warns on empty data / partial>value", () => {
    let ctxType = "";
    const a = mount({ dataSet: flat, onChartDataProcessed: (c) => (ctxType = c.chartType) });
    expect(ctxType).toBe("treemap-chart");
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

  it("stack layout: full-width rows, height ∝ value, split preserved", () => {
    const { host, chart } = mount({ dataSet: flat, layout: "stack", width: 360, height: 600 });
    const ctx = chart.getContext()!;
    if (ctx.chartType === "treemap-chart") expect(ctx.layout).toBe("stack");
    const rows = Array.from(host.querySelectorAll<SVGRectElement>("rect.tile"));
    expect(rows.length).toBe(3);
    // Every row spans the full plot width.
    const widths = rows.map((r) => Number(r.getAttribute("width")));
    expect(new Set(widths).size).toBe(1);
    // Coffee (value 100) is taller than Cocoa (value 40).
    const coffee = host.querySelector<SVGRectElement>(`rect.tile[data-leaf="Coffee"]`)!;
    const cocoa = host.querySelector<SVGRectElement>(`rect.tile[data-leaf="Cocoa"]`)!;
    expect(Number(coffee.getAttribute("height"))).toBeGreaterThan(Number(cocoa.getAttribute("height")));
    // Split still rendered (one veil per leaf).
    expect(host.querySelectorAll("rect.tile-veil").length).toBe(3);
    chart.destroy();
    host.remove();
  });

  it("layout 'auto' switches to stack below stackBreakpoint", () => {
    const wide = mount({ dataSet: flat, layout: "auto", width: 900, stackBreakpoint: 480 });
    const narrow = mount({ dataSet: flat, layout: "auto", width: 360, stackBreakpoint: 480 });
    const cw = wide.chart.getContext()!;
    const cn = narrow.chart.getContext()!;
    if (cw.chartType === "treemap-chart") expect(cw.layout).toBe("squarify");
    if (cn.chartType === "treemap-chart") expect(cn.layout).toBe("stack");
    wide.chart.destroy();
    wide.host.remove();
    narrow.chart.destroy();
    narrow.host.remove();
  });

  it("update() re-renders and destroy() cleans up", () => {
    const { host, chart } = mount({ dataSet: flat, showSplit: false });
    chart.update({ dataSet: flat.slice(0, 2), width: 600, height: 400, showSplit: false });
    expect(host.querySelectorAll("rect.tile").length).toBe(2);
    chart.destroy();
    expect(host.querySelectorAll("svg").length).toBe(0);
    host.remove();
  });
});

describe("TreemapChart chrome (loading/no-data quad)", () => {
  it("isLoading: shows the loading overlay, data-mv-state=loading", () => {
    const { host, chart } = mount({ dataSet: flat, isLoading: true });
    expect(host.getAttribute("data-mv-state")).toBe("loading");
    expect(host.querySelector(".mv-loading")).not.toBeNull();
    chart.destroy();
    host.remove();
  });

  it("nodata (empty dataSet): no tiles, data-mv-state=nodata, default overlay text", () => {
    const { host, chart } = mount({ dataSet: [] });
    expect(host.getAttribute("data-mv-state")).toBe("nodata");
    expect(host.querySelectorAll("rect.tile").length).toBe(0);
    const overlay = host.querySelector(".mv-nodata");
    expect(overlay).not.toBeNull();
    expect(overlay!.textContent).toBe("No data available");
    chart.destroy();
    host.remove();
  });

  it("noDataLabel overrides the default no-data text", () => {
    const { host, chart } = mount({ dataSet: [], noDataLabel: "Nothing to show" });
    expect(host.querySelector(".mv-nodata")!.textContent).toBe("Nothing to show");
    chart.destroy();
    host.remove();
  });

  it("suppressDefaultOverlay hides the default overlay while data-mv-state is still set", () => {
    const { host, chart } = mount({ dataSet: [], suppressDefaultOverlay: true });
    expect(host.getAttribute("data-mv-state")).toBe("nodata");
    expect(host.querySelector(".mv-nodata")).toBeNull();
    chart.destroy();
    host.remove();
  });

  it("ready: non-empty dataSet, no overlay, data-mv-state=ready", () => {
    const { host, chart } = mount({ dataSet: flat });
    expect(host.getAttribute("data-mv-state")).toBe("ready");
    expect(host.querySelector(".mv-loading")).toBeNull();
    expect(host.querySelector(".mv-nodata")).toBeNull();
    chart.destroy();
    host.remove();
  });
});

describe("tileValueLabels (default-off, second line reusing the existing tile-size gate)", () => {
  // 600x400, 3 leaves -> generous tiles (294x358 / 175x358 / 117x358 at showSplit
  // false), comfortably over BOTH the name gate (h>=24 && w>=30) and the second-line
  // gate this feature reuses (w>=48 && h>=34, the same one the split-pct line uses).
  const big = flat; // Coffee 100, Tea 60, Cocoa 40 -> grandTotal 200

  it("absent prop: zero .tile-value-label nodes and tile/name/pct markup is byte-identical to a mount with no tileValueLabels key at all", () => {
    const withoutKey = mount({ dataSet: big });
    const withFalse = mount({ dataSet: big, tileValueLabels: false });
    expect(withoutKey.host.querySelectorAll(".tile-value-label").length).toBe(0);
    expect(withFalse.host.querySelectorAll(".tile-value-label").length).toBe(0);
    const cellAttrs = (host: HTMLElement) =>
      Array.from(host.querySelectorAll(".tile-cell")).map((c) => c.outerHTML);
    expect(cellAttrs(withFalse.host)).toEqual(cellAttrs(withoutKey.host));
    withoutKey.chart.destroy();
    withoutKey.host.remove();
    withFalse.chart.destroy();
    withFalse.host.remove();
  });

  it("true: renders '{value} ({pct}%)' as a second line when the tile is big enough", () => {
    const { host, chart } = mount({ dataSet: big, showSplit: false, tileValueLabels: true });
    const coffee = host.querySelector('rect.tile[data-leaf="Coffee"]')!.closest(".tile-cell")!;
    const valueLabel = coffee.querySelector(".tile-value-label")!;
    expect(valueLabel).not.toBeNull();
    // value=100, grandTotal=200 -> 50% share.
    expect(valueLabel.textContent).toBe("100 (50%)");
    chart.destroy();
    host.remove();
  });

  it("custom formatter receives (value, fractionOfTotal, leafContext)", () => {
    const seen: Array<[number, number, string]> = [];
    const { host, chart } = mount({
      dataSet: big,
      showSplit: false,
      tileValueLabels: {
        formatter: (value, fractionOfTotal, d) => {
          seen.push([value, fractionOfTotal, d.label]);
          return `V=${value}`;
        },
      },
    });
    const coffeeLabel = host
      .querySelector('rect.tile[data-leaf="Coffee"]')!
      .closest(".tile-cell")!
      .querySelector(".tile-value-label")!;
    expect(coffeeLabel.textContent).toBe("V=100");
    expect(seen).toContainEqual([100, 0.5, "Coffee"]);
    chart.destroy();
    host.remove();
  });

  it("no second line when the tile is too small for it, even though the name still fits", () => {
    // 20 same-sized leaves in a small canvas -> some tiles pass the name gate
    // (h>=24 && w>=30) but fail the larger second-line gate (w>=48 && h>=34).
    const many: TreemapNode[] = Array.from({ length: 20 }, (_, i) => ({ label: `L${i}`, value: 10 + i }));
    const { host, chart } = mount({ dataSet: many, width: 300, height: 150, showSplit: false, tileValueLabels: true });
    const small = host.querySelector('rect.tile[data-leaf="L0"]')!; // 31x24 in this layout
    expect(Number(small.getAttribute("width"))).toBeLessThan(48);
    const smallCell = small.closest(".tile-cell")!;
    expect(smallCell.querySelector(".tile-label")).not.toBeNull(); // name still shows
    expect(smallCell.querySelector(".tile-value-label")).toBeNull(); // value label does not
    chart.destroy();
    host.remove();
  });

  it("stacks below the split percent line when both are shown for the same tile", () => {
    const { host, chart } = mount({ dataSet: big, tileValueLabels: true }); // showSplit defaults true (partial present)
    const coffee = host.querySelector('rect.tile[data-leaf="Coffee"]')!.closest(".tile-cell")!;
    const pct = coffee.querySelector(".tile-pct")!;
    const valueLabel = coffee.querySelector(".tile-value-label")!;
    expect(pct).not.toBeNull();
    expect(valueLabel).not.toBeNull();
    expect(Number(valueLabel.getAttribute("y"))).toBeGreaterThan(Number(pct.getAttribute("y")));
    chart.destroy();
    host.remove();
  });
});
