import { describe, it, expect } from "vitest";
import { mountSankeyChart } from "../src/engine/sankeyChart";
import { sanitizeForClassName } from "../src/math/sanitize";
import type { SankeyChartProps, SankeyNodeItem, SankeyLinkItem } from "../src/types";

const nodes: SankeyNodeItem[] = [{ id: "France" }, { id: "Germany" }, { id: "EU" }, { id: "Asia" }];
const links: SankeyLinkItem[] = [
  { source: "France", target: "EU", value: 40 },
  { source: "France", target: "Asia", value: 20 },
  { source: "Germany", target: "EU", value: 30 },
  { source: "Germany", target: "Asia", value: 10 },
];

function mount(
  props: Partial<SankeyChartProps> & { nodes: SankeyNodeItem[]; links: SankeyLinkItem[] },
) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountSankeyChart(host, { width: 600, height: 400, title: "Trade", ...props });
  return { host, chart };
}

describe("mountSankeyChart (jsdom)", () => {
  it("renders one rect per node and one path per link with colour-contract attrs", () => {
    const { host, chart } = mount({ nodes, links });
    expect(host.querySelectorAll("rect.node").length).toBe(4);
    const paths = host.querySelectorAll<SVGPathElement>("path.link");
    expect(paths.length).toBe(4);
    const safes = Array.from(host.querySelectorAll("rect.node")).map((n) =>
      n.getAttribute("data-label-safe"),
    );
    expect(safes).toContain(sanitizeForClassName("France"));
    expect(paths[0].getAttribute("d")).toBeTruthy();
    expect(paths[0].getAttribute("data-source")).toBeTruthy();
    chart.destroy();
    host.remove();
  });

  it("exposes a sankey context with node/link/flow stats", () => {
    const { host, chart } = mount({ nodes, links });
    const ctx = chart.getContext()!;
    expect(ctx.chartType).toBe("sankey-chart");
    if (ctx.chartType === "sankey-chart") {
      expect(ctx.nodes.length).toBe(4);
      expect(ctx.links.length).toBe(4);
      expect(ctx.stats.totalFlow).toBe(100);
      expect(ctx.stats.columnCount).toBe(2);
      expect(ctx.stats.largestLink).toEqual({ source: "France", target: "EU", value: 40 });
      // EU receives 40 + 30 = 70 (busiest).
      expect(ctx.stats.busiestNode).toEqual({ id: "EU", value: 70 });
    }
    chart.destroy();
    host.remove();
  });

  it("produces identical context in SVG and canvas (renderer aside)", () => {
    const a = mount({ nodes, links, renderer: "svg" });
    const b = mount({ nodes, links, renderer: "canvas" });
    const ca = a.chart.getContext()!;
    const cb = b.chart.getContext()!;
    const strip = (c: typeof ca) => ({ ...c, renderer: undefined });
    expect(strip(ca)).toEqual(strip(cb));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });

  it("a11y table lists the links (Source/Target/Value); summary mentions Sankey", () => {
    const { host, chart } = mount({ nodes, links });
    const ctx = chart.getContext()!;
    if (ctx.chartType === "sankey-chart") {
      expect(ctx.a11yTable.headers).toEqual(["Source", "Target", "Value"]);
      expect(ctx.a11yTable.rows.length).toBe(4);
      expect(ctx.summary).toContain("Sankey");
    }
    expect(host.querySelector(".mv-a11y")!.getAttribute("aria-label")).toContain("Sankey");
    chart.destroy();
    host.remove();
  });

  it("nodeRadius rounds the node rect corners (and 0 = square)", () => {
    const round = mount({ nodes, links, nodeRadius: 6 });
    const rect = round.host.querySelector<SVGRectElement>("rect.node")!;
    // rx is clamped to half the node's shorter side (nodes are ~18px wide).
    const rx = Number(rect.getAttribute("rx"));
    expect(rx).toBeGreaterThan(0);
    expect(rx).toBeLessThanOrEqual(6);
    round.chart.destroy();
    round.host.remove();

    const square = mount({ nodes, links, nodeRadius: 0 });
    expect(Number(square.host.querySelector("rect.node")!.getAttribute("rx"))).toBe(0);
    square.chart.destroy();
    square.host.remove();
  });

  it("link width is proportional to value (France→EU thicker than France→Asia)", () => {
    const { host, chart } = mount({ nodes, links });
    const big = host.querySelector<SVGPathElement>(
      'path.link[data-source="France"][data-target="EU"]',
    )!;
    const small = host.querySelector<SVGPathElement>(
      'path.link[data-source="France"][data-target="Asia"]',
    )!;
    expect(Number(big.getAttribute("data-width"))).toBeGreaterThan(
      Number(small.getAttribute("data-width")),
    );
    chart.destroy();
    host.remove();
  });

  it("flows render as filled ribbons (closed path, fill not stroke)", () => {
    const { host, chart } = mount({ nodes, links, linkRadius: 6 });
    const link = host.querySelector<SVGPathElement>("path.link")!;
    const d = link.getAttribute("d")!;
    expect(d.endsWith("Z")).toBe(true); // closed ribbon outline
    expect(link.getAttribute("fill")).not.toBe("none"); // filled, not stroked
    expect(link.getAttribute("stroke")).toBe("none");
    expect(d).toContain("Q"); // rounded corners (quadratic arcs)
    chart.destroy();
    host.remove();
  });

  it("disabledItems drops a node and its links", () => {
    const { host, chart } = mount({ nodes, links, disabledItems: ["Germany"] });
    expect(host.querySelectorAll("rect.node").length).toBe(3);
    // Germany's two links are gone → 2 links remain.
    expect(host.querySelectorAll("path.link").length).toBe(2);
    const ctx = chart.getContext()!;
    if (ctx.chartType === "sankey-chart") {
      expect(ctx.nodes.map((n) => n.id)).not.toContain("Germany");
      expect(ctx.stats.totalFlow).toBe(60);
    }
    chart.destroy();
    host.remove();
  });

  it("warns on empty nodes and on a link to an unknown node", () => {
    let warned: unknown[] = [];
    const a = mount({ nodes: [], links: [], onDataWarning: (w) => (warned = w) });
    expect(warned.some((w) => (w as { type: string }).type === "empty-dataset")).toBe(true);
    a.chart.destroy();
    a.host.remove();

    let warned2: unknown[] = [];
    const b = mount({
      nodes: [{ id: "A" }, { id: "B" }],
      links: [{ source: "A", target: "Z", value: 5 }],
      onDataWarning: (w) => (warned2 = w),
    });
    expect(
      warned2.some((w) => (w as { message: string }).message.includes("unknown target node")),
    ).toBe(true);
    b.chart.destroy();
    b.host.remove();
  });

  it("fires onChartDataProcessed with the sankey context", () => {
    let ctxType = "";
    const { host, chart } = mount({
      nodes,
      links,
      onChartDataProcessed: (c) => (ctxType = c.chartType),
    });
    expect(ctxType).toBe("sankey-chart");
    chart.destroy();
    host.remove();
  });

  it("update() re-renders and destroy() cleans up", () => {
    const { host, chart } = mount({ nodes, links });
    chart.update({
      nodes: [{ id: "A" }, { id: "B" }],
      links: [{ source: "A", target: "B", value: 7 }],
      width: 600,
      height: 400,
    });
    expect(host.querySelectorAll("rect.node").length).toBe(2);
    expect(host.querySelectorAll("path.link").length).toBe(1);
    chart.destroy();
    expect(host.querySelectorAll("svg").length).toBe(0);
    host.remove();
  });
});

describe("SankeyChart chrome (loading/no-data quad)", () => {
  it("isLoading: shows the loading overlay, data-mv-state=loading", () => {
    const { host, chart } = mount({ nodes, links, isLoading: true });
    expect(host.getAttribute("data-mv-state")).toBe("loading");
    expect(host.querySelector(".mv-loading")).not.toBeNull();
    chart.destroy();
    host.remove();
  });

  it("nodata (empty nodes): no rects, data-mv-state=nodata, default overlay text", () => {
    const { host, chart } = mount({ nodes: [], links: [] });
    expect(host.getAttribute("data-mv-state")).toBe("nodata");
    expect(host.querySelectorAll("rect.node").length).toBe(0);
    const overlay = host.querySelector(".mv-nodata");
    expect(overlay).not.toBeNull();
    expect(overlay!.textContent).toBe("No data available");
    chart.destroy();
    host.remove();
  });

  it("noDataLabel overrides the default no-data text", () => {
    const { host, chart } = mount({ nodes: [], links: [], noDataLabel: "Nothing to show" });
    expect(host.querySelector(".mv-nodata")!.textContent).toBe("Nothing to show");
    chart.destroy();
    host.remove();
  });

  it("suppressDefaultOverlay hides the default overlay while data-mv-state is still set", () => {
    const { host, chart } = mount({ nodes: [], links: [], suppressDefaultOverlay: true });
    expect(host.getAttribute("data-mv-state")).toBe("nodata");
    expect(host.querySelector(".mv-nodata")).toBeNull();
    chart.destroy();
    host.remove();
  });

  it("ready: non-empty nodes, no overlay, data-mv-state=ready", () => {
    const { host, chart } = mount({ nodes, links });
    expect(host.getAttribute("data-mv-state")).toBe("ready");
    expect(host.querySelector(".mv-loading")).toBeNull();
    expect(host.querySelector(".mv-nodata")).toBeNull();
    chart.destroy();
    host.remove();
  });

  // isNodata forced true with NON-empty nodes/links (e.g. a wrapper's custom
  // isNodataComponent evaluating some other condition): nodes/links must not
  // draw underneath the overlay - state is stamped, overlay renders, chart doesn't.
  it("isNodata=true with non-empty nodes/links: no rects/paths drawn, overlay still shown (svg)", () => {
    const { host, chart } = mount({ nodes, links, isNodata: true });
    expect(host.getAttribute("data-mv-state")).toBe("nodata");
    expect(host.querySelectorAll("rect.node").length).toBe(0);
    expect(host.querySelectorAll("path.link").length).toBe(0);
    expect(host.querySelector(".mv-nodata")).not.toBeNull();
    chart.destroy();
    host.remove();
  });

  it("isNodata=true with non-empty nodes/links: no canvas painted (canvas renderer)", () => {
    const { host, chart } = mount({ nodes, links, isNodata: true, renderer: "canvas" });
    expect(host.getAttribute("data-mv-state")).toBe("nodata");
    expect(host.querySelector("canvas")).toBeNull();
    chart.destroy();
    host.remove();
  });
});
