import { describe, it, expect, vi } from "vitest";
import { mountRadialTreeChart } from "../src/engine/radialTreeChart";
import { sanitizeForClassName } from "../src/math/sanitize";
import type { RadialTreeChartProps, RadialTreeNode } from "../src/types";

const dataSet: RadialTreeNode[] = [
  {
    label: "Sectors",
    children: [
      { label: "Coffee", value: 10 },
      { label: "Tea", value: 30 },
    ],
  },
  {
    label: "Regions",
    children: [
      { label: "Africa", value: 5 },
      { label: "Asia", value: 55 },
    ],
  },
];

function mount(extra: Partial<RadialTreeChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountRadialTreeChart(host, {
    dataSet,
    title: "Demo",
    width: 600,
    height: 400,
    ...extra,
  });
  return { host, chart };
}

describe("mountRadialTreeChart (jsdom, svg renderer)", () => {
  it("renders one circle per node (2 groups + 4 leaves)", () => {
    const { host, chart } = mount();
    const circles = host.querySelectorAll<SVGCircleElement>("circle.radial-tree-node-circle");
    expect(circles.length).toBe(6);
    chart.destroy();
    host.remove();
  });

  it("carries the colour-contract attributes keyed by the GROUP label", () => {
    const { host, chart } = mount();
    const coffeeCircle = host.querySelector<SVGCircleElement>('circle[data-label="Sectors"]');
    expect(coffeeCircle).not.toBeNull();
    const safes = Array.from(host.querySelectorAll("circle.radial-tree-node-circle")).map((c) =>
      c.getAttribute("data-label-safe"),
    );
    expect(safes).toContain(sanitizeForClassName("Sectors"));
    chart.destroy();
    host.remove();
  });

  it("renders a link path per node", () => {
    const { host, chart } = mount();
    expect(host.querySelectorAll("path.radial-tree-link").length).toBe(6);
    chart.destroy();
    host.remove();
  });

  it("shows full name + value labels at low leaf density", () => {
    const { host, chart } = mount();
    const labels = Array.from(host.querySelectorAll("tspan.radial-tree-label-name")).map(
      (t) => t.textContent,
    );
    expect(labels).toContain("Coffee");
    chart.destroy();
    host.remove();
  });

  it("draws no centre circle/label by default", () => {
    const { host, chart } = mount();
    expect(host.querySelector(".radial-tree-center-circle")).toBeNull();
    expect(host.querySelector(".radial-tree-center-label")).toBeNull();
    chart.destroy();
    host.remove();
  });

  it("draws a centre circle + word-wrapped label when centerLabel is set", () => {
    const { host, chart } = mount({ centerLabel: "Total Merchandise Trade" });
    expect(host.querySelector(".radial-tree-center-circle")).not.toBeNull();
    const tspans = Array.from(host.querySelectorAll(".radial-tree-center-label tspan")).map(
      (t) => t.textContent,
    );
    expect(tspans).toEqual(["Total", "Merchandise", "Trade"]);
    chart.destroy();
    host.remove();
  });

  it("hides all labels once past the hideAbove leaf-density threshold", () => {
    const manyLeaves: RadialTreeNode[] = [
      {
        label: "G",
        children: Array.from({ length: 101 }, (_, i) => ({ label: `L${i}`, value: i + 1 })),
      },
    ];
    const { host, chart } = mount({ dataSet: manyLeaves });
    expect(host.querySelectorAll("text.radial-tree-label").length).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("abbreviates + rotates labels once past the rotateAbove leaf-density threshold", () => {
    const manyLeaves: RadialTreeNode[] = [
      {
        label: "G",
        children: Array.from({ length: 25 }, (_, i) => ({ label: `Leaf${i}`, value: i + 1 })),
      },
    ];
    const { host, chart } = mount({ dataSet: manyLeaves });
    const names = Array.from(host.querySelectorAll("tspan.radial-tree-label-name")).map(
      (t) => t.textContent,
    );
    // Every label (group "G" and every "LeafN") is abbreviated to its own first
    // 3 characters + "." - so nothing longer than 4 characters should appear.
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((n) => /^.{1,3}\.$/.test(n ?? ""))).toBe(true);
    expect(names).toContain("Lea.");
    chart.destroy();
    host.remove();
  });

  it("honours custom labelDensityThresholds", () => {
    const manyLeaves: RadialTreeNode[] = [
      {
        label: "G",
        children: Array.from({ length: 6 }, (_, i) => ({ label: `Leaf${i}`, value: i + 1 })),
      },
    ];
    const { host, chart } = mount({
      dataSet: manyLeaves,
      labelDensityThresholds: { rotateAbove: 5, hideAbove: 5 },
    });
    expect(host.querySelectorAll("text.radial-tree-label").length).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("dims non-highlighted nodes when highlightItems is set", () => {
    const { host, chart } = mount({ highlightItems: ["Sectors"] });
    const nodes = Array.from(host.querySelectorAll<SVGGElement>("g.radial-tree-node"));
    const coffeeNode = nodes.find((g) => g.querySelector('circle[data-label="Sectors"]'));
    const africaNode = nodes.find((g) =>
      Array.from(g.querySelectorAll("tspan.radial-tree-label-name")).some(
        (t) => t.textContent === "Africa",
      ),
    );
    expect(coffeeNode!.style.opacity).toBe("1");
    expect(africaNode!.style.opacity).toBe("0.3");
    chart.destroy();
    host.remove();
  });

  it("passes a RadialTreeNode-shaped object to the tooltip formatter", () => {
    const formatter = vi.fn((d: RadialTreeNode) => "tip");
    const { host, chart } = mount({ tooltipFormatter: formatter });
    const g = Array.from(host.querySelectorAll<SVGGElement>("g.radial-tree-node")).find((el) =>
      el.querySelector('circle[data-label="Sectors"]'),
    )!;
    g.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    expect(formatter).toHaveBeenCalled();
    const arg = formatter.mock.calls[0][0];
    expect(arg.label).toBe("Sectors");
    expect(arg.value).toBe(40);
    chart.destroy();
    host.remove();
  });

  it("exposes a radial-tree-chart context with stats + a11yTable", () => {
    const { host, chart } = mount();
    const ctx = chart.getContext()!;
    expect(ctx.chartType).toBe("radial-tree-chart");
    if (ctx.chartType === "radial-tree-chart") {
      expect(ctx.stats.leafCount).toBe(4);
      expect(ctx.stats.groupCount).toBe(2);
      expect(ctx.nodes.length).toBe(6);
      expect(ctx.a11yTable.rows.length).toBe(6);
    }
    chart.destroy();
    host.remove();
  });

  it("emits onDataWarning for an empty children array", () => {
    const onDataWarning = vi.fn();
    const { host, chart } = mount({
      dataSet: [...dataSet, { label: "Empty", children: [] }],
      onDataWarning,
    });
    expect(onDataWarning).toHaveBeenCalled();
    const warnings = onDataWarning.mock.calls[0][0];
    expect(warnings.some((w: { type: string }) => w.type === "empty-group")).toBe(true);
    chart.destroy();
    host.remove();
  });
});

describe("mountRadialTreeChart (jsdom, canvas renderer)", () => {
  it("paints to a <canvas> and renders no SVG marks", () => {
    const { host, chart } = mount({ renderer: "canvas" });
    expect(host.querySelector("canvas")).not.toBeNull();
    expect(host.querySelectorAll("circle.radial-tree-node-circle").length).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("reports renderer: 'canvas' in getContext()", () => {
    const { host, chart } = mount({ renderer: "canvas" });
    expect(chart.getContext()!.renderer).toBe("canvas");
    chart.destroy();
    host.remove();
  });

  it("host-level point-in-circle hit-test fires onHighlightItem", () => {
    const svgMount = mount({ renderer: "svg" });
    const circle = svgMount.host.querySelector<SVGCircleElement>('circle[data-label="Sectors"]')!;
    const cx = Number(circle.getAttribute("cx"));
    const cy = Number(circle.getAttribute("cy"));
    svgMount.chart.destroy();
    svgMount.host.remove();

    // Reconstruct the absolute clientX/clientY the real host-level hit-test expects:
    // svgRect.left/top are 0 in jsdom; margin.left/top default to 10/36; centerX/centerY
    // are innerWidth/2, innerHeight/2 for a 600x400 chart with that default margin.
    const marginLeft = 10;
    const marginTop = 36;
    const centerX = (600 - marginLeft - 10) / 2;
    const centerY = (400 - marginTop - 10) / 2;

    const highlighted: string[][] = [];
    const { host, chart } = mount({
      renderer: "canvas",
      onHighlightItem: (labels) => highlighted.push(labels),
    });
    host.dispatchEvent(
      new MouseEvent("mousemove", {
        clientX: marginLeft + centerX + cx,
        clientY: marginTop + centerY + cy,
        bubbles: true,
      }),
    );
    expect(highlighted.some((h) => h.length > 0)).toBe(true);
    chart.destroy();
    host.remove();
  });
});

describe("mountRadialTreeChart - chrome quad", () => {
  it("isLoading sets data-mv-state=loading", () => {
    const { host, chart } = mount({ isLoading: true });
    expect(host.getAttribute("data-mv-state")).toBe("loading");
    chart.destroy();
    host.remove();
  });

  it("isNodata (empty dataSet default) sets data-mv-state=nodata and skips marks", () => {
    const { host, chart } = mount({ dataSet: [] });
    expect(host.getAttribute("data-mv-state")).toBe("nodata");
    expect(host.querySelectorAll("circle.radial-tree-node-circle").length).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("noDataLabel customises the no-data overlay text", () => {
    const { host, chart } = mount({ dataSet: [], noDataLabel: "Nothing here" });
    expect(host.textContent).toContain("Nothing here");
    chart.destroy();
    host.remove();
  });

  it("suppressDefaultOverlay hides the built-in overlays even in nodata state", () => {
    const { host, chart } = mount({ dataSet: [], suppressDefaultOverlay: true });
    expect(host.querySelector(".mv-nodata")).toBeNull();
    chart.destroy();
    host.remove();
  });
});

describe("mountRadialTreeChart - svg vs canvas parity", () => {
  it("resolves the same colorsMapping in both renderers", () => {
    const svgMount = mount({ renderer: "svg" });
    const canvasMount = mount({ renderer: "canvas" });
    expect(svgMount.chart.getContext()!.colorsMapping).toEqual(
      canvasMount.chart.getContext()!.colorsMapping,
    );
    svgMount.chart.destroy();
    svgMount.host.remove();
    canvasMount.chart.destroy();
    canvasMount.host.remove();
  });

  it("getContext() is identical in SVG vs canvas (renderer aside)", () => {
    const svgMount = mount({ renderer: "svg" });
    const canvasMount = mount({ renderer: "canvas" });
    const a = JSON.stringify({ ...svgMount.chart.getContext(), renderer: 0 });
    const b = JSON.stringify({ ...canvasMount.chart.getContext(), renderer: 0 });
    expect(a).toBe(b);
    svgMount.chart.destroy();
    svgMount.host.remove();
    canvasMount.chart.destroy();
    canvasMount.host.remove();
  });
});

describe("mountRadialTreeChart - update/destroy", () => {
  it("update() re-renders with new props", () => {
    const { host, chart } = mount();
    chart.update({ dataSet, title: "Updated", width: 600, height: 400 });
    expect(host.querySelector("text.title")?.textContent).toBe("Updated");
    chart.destroy();
    host.remove();
  });

  it("destroy() removes all chart DOM and the michi-vz classes", () => {
    const { host, chart } = mount();
    chart.destroy();
    expect(host.classList.contains("michi-vz")).toBe(false);
    expect(host.children.length).toBe(0);
  });

  it("two independent mounts of the same props produce IDENTICAL context (deterministic layout)", () => {
    const a = mount();
    const b = mount();
    expect(a.chart.getContext()).toEqual(b.chart.getContext());
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });
});
