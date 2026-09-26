import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// The GPU never runs in jsdom, so the mark layer is replaced by a recorder: each
// emptyBatch() starts a paint, each markColor(css, opacity) call is one mark (links
// first, then nodes, in model order), and drawMarksWebgpu reports "GPU painted"
// when `gpuReady` is set - the state where the 2D fallback canvas is removed.
const rec = vi.hoisted(() => ({ paints: [] as number[][], gpuReady: false }));
vi.mock("../src/webgpu/marks", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../src/webgpu/marks")>();
  return {
    ...mod,
    emptyBatch: () => {
      rec.paints.push([]);
      return mod.emptyBatch();
    },
    markColor: (css: string | null | undefined, opacity?: number) => {
      rec.paints[rec.paints.length - 1]?.push(opacity ?? 1);
      return mod.markColor(css, opacity);
    },
    drawMarksWebgpu: () => rec.gpuReady,
  };
});

import { mountSankeyChart } from "../src/engine/sankeyChart";
import { drawSankeyWebgpu } from "../src/sankeyChart/renderWebgpu";
import { processSankeyData } from "../src/sankeyChart/data";
import { buildSankeyColors } from "../src/sankeyChart/colors";
import { layoutSankey } from "../src/sankeyChart/layout";
import { buildSankeyRenderModel } from "../src/sankeyChart/renderModel";
import { sankeyEmphasis } from "../src/sankeyChart/emphasis";
import { __resetGPUDeviceForTest } from "../src/webgpu/device";
import type { Margin, SankeyChartProps, SankeyNodeItem, SankeyLinkItem } from "../src/types";

const nodes: SankeyNodeItem[] = [{ id: "France" }, { id: "Germany" }, { id: "EU" }, { id: "Asia" }];
const links: SankeyLinkItem[] = [
  { source: "France", target: "EU", value: 40 },
  { source: "France", target: "Asia", value: 20 },
  { source: "Germany", target: "EU", value: 30 },
  { source: "Germany", target: "Asia", value: 10 },
];
const LIT = 0.45;
const DIM = 0.45 * 0.25;
const MARGIN: Margin = { top: 60, right: 40, bottom: 20, left: 90 };

function model() {
  const processed = processSankeyData(nodes, links);
  const colors = buildSankeyColors(processed.nodeKeys, [], processed.nodeColors);
  const laid = layoutSankey(
    { nodes: processed.nodes, links: processed.links },
    { x0: 10, y0: 10, x1: 590, y1: 390, nodeWidth: 18, nodePadding: 12 },
  );
  return buildSankeyRenderModel(laid, colors, {
    width: 600,
    nodeKeys: processed.nodeKeys,
    nodeRadius: 2,
    linkRadius: 2,
    linkColorMode: "source",
    linkOpacity: LIT,
    showLabels: true,
    highlightItems: [],
  });
}

/** Split the last paint into link and node opacities keyed by id. */
function lastPaint(m: {
  links: { sourceId: string; targetId: string }[];
  nodes: { id: string }[];
}) {
  const p = rec.paints[rec.paints.length - 1];
  const out = { links: {} as Record<string, number>, nodes: {} as Record<string, number> };
  m.links.forEach((l, i) => (out.links[`${l.sourceId}>${l.targetId}`] = p[i]));
  m.nodes.forEach((n, i) => (out.nodes[n.id] = p[m.links.length + i]));
  return out;
}

function setGpu(present: boolean): void {
  if (present) Object.defineProperty(navigator, "gpu", { value: {}, configurable: true });
  else delete (navigator as unknown as { gpu?: unknown }).gpu;
}

beforeEach(() => {
  rec.paints = [];
  rec.gpuReady = false;
  __resetGPUDeviceForTest();
});
afterEach(() => {
  setGpu(false);
  __resetGPUDeviceForTest();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("drawSankeyWebgpu - emphasis option", () => {
  it("paints the node emphasis with the shared dim levels", () => {
    const m = model();
    drawSankeyWebgpu(null, null, m, {
      width: 600,
      height: 400,
      emphasis: sankeyEmphasis(m, { kind: "node", id: "France" }),
    });
    const p = lastPaint(m);
    expect(p.links["France>EU"]).toBeCloseTo(LIT);
    expect(p.links["France>Asia"]).toBeCloseTo(LIT);
    expect(p.links["Germany>EU"]).toBeCloseTo(DIM);
    expect(p.links["Germany>Asia"]).toBeCloseTo(DIM);
    expect(p.nodes).toEqual({ France: 1, Germany: 0.25, EU: 1, Asia: 1 });
  });

  it("without an emphasis it paints the normal state", () => {
    const m = model();
    drawSankeyWebgpu(null, null, m, { width: 600, height: 400 });
    const p = lastPaint(m);
    expect(Object.values(p.links).every((a) => a === LIT)).toBe(true);
    expect(Object.values(p.nodes).every((a) => a === 1)).toBe(true);
  });
});

describe("hoverHighlight - webgpu engine (GPU painted, host mousemove, non-default margin)", () => {
  // Node geometry and link paths from an svg twin (same layout as the GPU model).
  function twin() {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountSankeyChart(host, {
      nodes,
      links,
      width: 600,
      height: 400,
      margin: MARGIN,
      renderer: "svg",
    });
    const box = (id: string) => {
      const r = host.querySelector<SVGRectElement>(`rect.node[data-label="${id}"]`)!;
      return {
        cx: Number(r.getAttribute("x")) + Number(r.getAttribute("width")) / 2,
        cy: Number(r.getAttribute("y")) + Number(r.getAttribute("height")) / 2,
      };
    };
    const d = (s: string, t: string) =>
      host
        .querySelector<SVGPathElement>(`path.link[data-source="${s}"][data-target="${t}"]`)!
        .getAttribute("d")!;
    const out = { france: box("France"), franceEuD: d("France", "EU") };
    chart.destroy();
    host.remove();
    return out;
  }

  function mountGpu(extra: Partial<SankeyChartProps> = {}) {
    setGpu(true);
    rec.gpuReady = true;
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountSankeyChart(host, {
      nodes,
      links,
      width: 600,
      height: 400,
      margin: MARGIN,
      renderer: "webgpu",
      hoverHighlight: true,
      ...extra,
    });
    const move = (x: number, y: number) =>
      host.dispatchEvent(new MouseEvent("mousemove", { clientX: x, clientY: y, bubbles: true }));
    const current = () => {
      const ctx = chart.getContext()!;
      if (ctx.chartType !== "sankey-chart") throw new Error("not a sankey");
      return {
        links: ctx.links.map((l) => ({ sourceId: l.source, targetId: l.target })),
        nodes: ctx.nodes.map((n) => ({ id: n.id })),
      };
    };
    return { host, chart, move, current };
  }

  it("hovering a node repaints the GPU marks with the emphasis", () => {
    const g = twin();
    const { host, chart, move, current } = mountGpu();
    expect(host.querySelector("canvas.sankey-chart-canvas")).toBeNull(); // GPU painted, no 2D fallback
    move(g.france.cx, g.france.cy);
    const p = lastPaint(current());
    expect(p.links["France>EU"]).toBeCloseTo(LIT);
    expect(p.links["Germany>Asia"]).toBeCloseTo(DIM);
    expect(p.nodes).toEqual({ France: 1, Germany: 0.25, EU: 1, Asia: 1 });
    move(1, 1);
    const r = lastPaint(current());
    expect(Object.values(r.links).every((a) => a === LIT)).toBe(true);
    chart.destroy();
    host.remove();
  });

  it("link hover still resolves once the 2D fallback canvas is gone (scratch hit canvas)", () => {
    const g = twin();
    class FakePath2D {
      d: string;
      constructor(d?: string) {
        this.d = d ?? "";
      }
    }
    vi.stubGlobal("Path2D", FakePath2D);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(((type: string) =>
      type === "2d"
        ? {
            save() {},
            restore() {},
            setTransform() {},
            isPointInPath: (p: FakePath2D) => p.d === g.franceEuD,
          }
        : null) as unknown as HTMLCanvasElement["getContext"]);
    const seen: string[][] = [];
    const { host, chart, move, current } = mountGpu({ onHighlightItem: (l) => seen.push(l) });
    move(300, 200); // between the columns: only the link hit-test can match
    expect(seen[seen.length - 1]).toEqual(["France", "EU"]);
    const p = lastPaint(current());
    expect(p.links["France>EU"]).toBeCloseTo(LIT);
    expect(p.links["France>Asia"]).toBeCloseTo(DIM);
    expect(p.nodes).toEqual({ France: 1, Germany: 0.25, EU: 1, Asia: 0.25 });
    chart.destroy();
    host.remove();
  });
});
