import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mountSankeyChart } from "../src/engine/sankeyChart";
import { processSankeyData } from "../src/sankeyChart/data";
import { buildSankeyColors } from "../src/sankeyChart/colors";
import { layoutSankey } from "../src/sankeyChart/layout";
import { buildSankeyRenderModel, type SankeyRenderModel } from "../src/sankeyChart/renderModel";
import {
  sankeyEmphasis,
  sankeyLitState,
  sankeyLinkAlpha,
  sankeyNodeAlpha,
  SANKEY_DIM,
} from "../src/sankeyChart/emphasis";
import type { Margin, SankeyChartProps, SankeyNodeItem, SankeyLinkItem } from "../src/types";

// hoverHighlight: hover a node -> it, its links and the nodes at their other ends
// stay lit; hover a link -> only that link and its two end nodes. Everything else
// dims to the highlightItems levels (links linkOpacity x 0.25, nodes 0.25). svg
// updates in place, canvas/webgpu repaint; one pure helper decides for all three.

// ---- pure layer -------------------------------------------------------------

// Three columns. A only sends, X/Y only receive, B skips the hub for Y.
const pNodes: SankeyNodeItem[] = [{ id: "A" }, { id: "B" }, { id: "H" }, { id: "X" }, { id: "Y" }];
const pLinks: SankeyLinkItem[] = [
  { source: "A", target: "H", value: 10 }, // 0
  { source: "B", target: "H", value: 5 }, // 1
  { source: "H", target: "X", value: 9 }, // 2
  { source: "H", target: "Y", value: 6 }, // 3
  { source: "B", target: "Y", value: 3 }, // 4
];

function modelFor(
  nodesIn: SankeyNodeItem[],
  linksIn: SankeyLinkItem[],
  highlightItems: string[] = [],
): SankeyRenderModel {
  const processed = processSankeyData(nodesIn, linksIn);
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
    linkOpacity: 0.45,
    showLabels: true,
    highlightItems,
  });
}

const sorted = <T>(s: ReadonlySet<T>): T[] => Array.from(s).sort();

describe("sankeyEmphasis (pure)", () => {
  const model = modelFor(pNodes, pLinks);

  it("a node lights every link into or out of it and the nodes at their other ends", () => {
    const e = sankeyEmphasis(model, { kind: "node", id: "H" })!;
    expect(sorted(e.links)).toEqual([0, 1, 2, 3]);
    expect(sorted(e.nodes)).toEqual(["A", "B", "H", "X", "Y"]);
  });

  it("a node with only outgoing links lights just those links and their targets", () => {
    const e = sankeyEmphasis(model, { kind: "node", id: "A" })!;
    expect(sorted(e.links)).toEqual([0]);
    expect(sorted(e.nodes)).toEqual(["A", "H"]);
  });

  it("a node with only incoming links lights just those links and their sources", () => {
    const e = sankeyEmphasis(model, { kind: "node", id: "Y" })!;
    expect(sorted(e.links)).toEqual([3, 4]);
    expect(sorted(e.nodes)).toEqual(["B", "H", "Y"]);
  });

  it("a link lights only itself and its two end nodes (not every link touching them)", () => {
    const e = sankeyEmphasis(model, { kind: "link", index: 4, sourceId: "B", targetId: "Y" })!;
    expect(sorted(e.links)).toEqual([4]);
    expect(sorted(e.nodes)).toEqual(["B", "Y"]);
  });

  it("a stale link index is re-resolved by its source/target ids", () => {
    const e = sankeyEmphasis(model, { kind: "link", index: 0, sourceId: "B", targetId: "Y" })!;
    expect(sorted(e.links)).toEqual([4]);
  });

  it("a missing target (or none) gives no emphasis", () => {
    expect(sankeyEmphasis(model, { kind: "node", id: "Nowhere" })).toBeNull();
    expect(
      sankeyEmphasis(model, { kind: "link", index: 42, sourceId: "Q", targetId: "R" }),
    ).toBeNull();
    expect(sankeyEmphasis(model, null)).toBeNull();
  });
});

describe("sankeyLitState (pure, shared by svg/canvas/webgpu)", () => {
  it("no emphasis, no highlightItems: everything lit", () => {
    const lit = sankeyLitState(modelFor(pNodes, pLinks), null);
    expect(lit.links.every(Boolean)).toBe(true);
    expect(lit.nodes.every(Boolean)).toBe(true);
  });

  it("no emphasis: the highlightItems rule is unchanged (links touching, node itself)", () => {
    const model = modelFor(pNodes, pLinks, ["A"]);
    const lit = sankeyLitState(model, null);
    expect(lit.links).toEqual([true, false, false, false, false]);
    expect(model.nodes.filter((_, i) => lit.nodes[i]).map((n) => n.id)).toEqual(["A"]);
  });

  it("an emphasis wins over highlightItems", () => {
    const model = modelFor(pNodes, pLinks, ["A"]);
    const lit = sankeyLitState(model, sankeyEmphasis(model, { kind: "node", id: "Y" }));
    expect(lit.links).toEqual([false, false, false, true, true]);
    expect(model.nodes.filter((_, i) => lit.nodes[i]).map((n) => n.id)).toEqual(["B", "H", "Y"]);
  });

  it("dim levels match highlightItems: links x 0.25, nodes 0.25", () => {
    expect(SANKEY_DIM).toBe(0.25);
    expect(sankeyLinkAlpha(0.45, true)).toBe(0.45);
    expect(sankeyLinkAlpha(0.45, false)).toBeCloseTo(0.1125);
    expect(sankeyNodeAlpha(true)).toBe(1);
    expect(sankeyNodeAlpha(false)).toBe(0.25);
  });
});

// ---- engine: svg ------------------------------------------------------------

const nodes: SankeyNodeItem[] = [{ id: "France" }, { id: "Germany" }, { id: "EU" }, { id: "Asia" }];
const links: SankeyLinkItem[] = [
  { source: "France", target: "EU", value: 40 },
  { source: "France", target: "Asia", value: 20 },
  { source: "Germany", target: "EU", value: 30 },
  { source: "Germany", target: "Asia", value: 10 },
];
const LIT = 0.45;
const DIM = 0.45 * 0.25;

function mount(extra: Partial<SankeyChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const props: SankeyChartProps = { nodes, links, width: 600, height: 400, title: "T", ...extra };
  const chart = mountSankeyChart(host, props);
  return { host, chart, props };
}

const linkEl = (host: HTMLElement, s: string, t: string) =>
  host.querySelector<SVGPathElement>(`path.link[data-source="${s}"][data-target="${t}"]`)!;
const nodeEl = (host: HTMLElement, id: string) =>
  host.querySelector<SVGRectElement>(`rect.node[data-label="${id}"]`)!.parentNode as SVGGElement;
const linkAlpha = (host: HTMLElement, s: string, t: string) =>
  Number(linkEl(host, s, t).getAttribute("fill-opacity"));
const nodeAlpha = (host: HTMLElement, id: string) =>
  Number(nodeEl(host, id).getAttribute("opacity"));
const enter = (el: Element) => el.dispatchEvent(new MouseEvent("mouseenter"));
const leave = (el: Element) => el.dispatchEvent(new MouseEvent("mouseleave"));
const click = (el: Element) => el.dispatchEvent(new MouseEvent("click", { bubbles: true }));

function expectNormal(host: HTMLElement) {
  for (const l of links) expect(linkAlpha(host, l.source, l.target)).toBeCloseTo(LIT);
  for (const n of nodes) expect(nodeAlpha(host, n.id)).toBe(1);
}

function expectFranceEmphasis(host: HTMLElement) {
  expect(linkAlpha(host, "France", "EU")).toBeCloseTo(LIT);
  expect(linkAlpha(host, "France", "Asia")).toBeCloseTo(LIT);
  expect(linkAlpha(host, "Germany", "EU")).toBeCloseTo(DIM);
  expect(linkAlpha(host, "Germany", "Asia")).toBeCloseTo(DIM);
  expect(nodeAlpha(host, "France")).toBe(1);
  expect(nodeAlpha(host, "EU")).toBe(1);
  expect(nodeAlpha(host, "Asia")).toBe(1);
  expect(nodeAlpha(host, "Germany")).toBe(0.25);
}

describe("hoverHighlight - svg engine (in place)", () => {
  it("mouseenter on a node dims unrelated links/nodes and keeps related ones at full", () => {
    const { host, chart } = mount({ hoverHighlight: true });
    expectNormal(host);
    enter(nodeEl(host, "France"));
    expectFranceEmphasis(host);
    chart.destroy();
    host.remove();
  });

  it("mouseleave restores the normal state", () => {
    const { host, chart } = mount({ hoverHighlight: true });
    const france = nodeEl(host, "France");
    enter(france);
    leave(france);
    expectNormal(host);
    chart.destroy();
    host.remove();
  });

  it("a link hover lights only that link and its two end nodes", () => {
    const { host, chart } = mount({ hoverHighlight: true });
    enter(linkEl(host, "France", "EU"));
    expect(linkAlpha(host, "France", "EU")).toBeCloseTo(LIT);
    // France->Asia touches France and Germany->EU touches EU: both still dim.
    expect(linkAlpha(host, "France", "Asia")).toBeCloseTo(DIM);
    expect(linkAlpha(host, "Germany", "EU")).toBeCloseTo(DIM);
    expect(linkAlpha(host, "Germany", "Asia")).toBeCloseTo(DIM);
    expect(nodeAlpha(host, "France")).toBe(1);
    expect(nodeAlpha(host, "EU")).toBe(1);
    expect(nodeAlpha(host, "Germany")).toBe(0.25);
    expect(nodeAlpha(host, "Asia")).toBe(0.25);
    chart.destroy();
    host.remove();
  });

  it("the hovered element is the SAME DOM element afterwards (no re-render)", () => {
    const { host, chart } = mount({ hoverHighlight: true });
    const france = nodeEl(host, "France");
    const bigLink = linkEl(host, "France", "EU");
    // Watch the chart svg (the tooltip beside it rewrites its own innerHTML).
    const observer = new MutationObserver(() => {});
    observer.observe(host.querySelector("svg")!, { childList: true, subtree: true });
    enter(france);
    leave(france);
    enter(bigLink);
    const structural = observer.takeRecords().filter((r) => r.type === "childList");
    observer.disconnect();
    expect(structural).toEqual([]);
    expect(nodeEl(host, "France")).toBe(france);
    expect(linkEl(host, "France", "EU")).toBe(bigLink);
    chart.destroy();
    host.remove();
  });

  it("default (hoverHighlight off) changes nothing on hover", () => {
    const seen: string[][] = [];
    const { host, chart } = mount({ onHighlightItem: (l) => seen.push(l) });
    enter(nodeEl(host, "France"));
    expectNormal(host);
    enter(linkEl(host, "Germany", "Asia"));
    expectNormal(host);
    expect(seen).toEqual([["France"], ["Germany", "Asia"]]);
    chart.destroy();
    host.remove();
  });

  it("onHighlightItem keeps firing exactly as before", () => {
    const seen: string[][] = [];
    const { host, chart } = mount({ hoverHighlight: true, onHighlightItem: (l) => seen.push(l) });
    const france = nodeEl(host, "France");
    enter(france);
    leave(france);
    const link = linkEl(host, "France", "EU");
    enter(link);
    leave(link);
    expect(seen).toEqual([["France"], [], ["France", "EU"], []]);
    chart.destroy();
    host.remove();
  });

  it("hover wins over highlightItems; leaving restores the highlightItems state", () => {
    const { host, chart } = mount({ hoverHighlight: true, highlightItems: ["Germany"] });
    const before = {
      links: links.map((l) => linkAlpha(host, l.source, l.target)),
      nodes: nodes.map((n) => nodeAlpha(host, n.id)),
    };
    expect(before.links).toEqual([DIM, DIM, LIT, LIT].map((v) => expect.closeTo(v)));
    expect(before.nodes).toEqual([0.25, 1, 0.25, 0.25]);

    const france = nodeEl(host, "France");
    enter(france);
    expectFranceEmphasis(host);
    leave(france);
    expect(links.map((l) => linkAlpha(host, l.source, l.target))).toEqual(
      before.links.map((v) => expect.closeTo(v)),
    );
    expect(nodes.map((n) => nodeAlpha(host, n.id))).toEqual(before.nodes);
    chart.destroy();
    host.remove();
  });

  it("a pinned tooltip keeps its emphasis until it is dismissed", () => {
    const { host, chart } = mount({ hoverHighlight: true });
    const france = nodeEl(host, "France");
    enter(france);
    click(france); // pin
    leave(france);
    expectFranceEmphasis(host);
    enter(nodeEl(host, "Germany")); // ignored while pinned
    expectFranceEmphasis(host);
    click(document.body); // click outside -> sticky-dismiss
    expectNormal(host);
    expect(host.querySelector<HTMLElement>(".tooltip")!.style.visibility).toBe("hidden");
    chart.destroy();
    host.remove();
  });

  it("the emphasis survives a consumer update() mid-hover", () => {
    const { host, chart, props } = mount({ hoverHighlight: true });
    enter(nodeEl(host, "France"));
    chart.update({ ...props });
    expectFranceEmphasis(host);
    chart.destroy();
    host.remove();
  });

  it("turning hoverHighlight off mid-hover drops the emphasis", () => {
    const { host, chart, props } = mount({ hoverHighlight: true });
    enter(nodeEl(host, "France"));
    chart.update({ ...props, hoverHighlight: false });
    expectNormal(host);
    chart.destroy();
    host.remove();
  });

  it("a hovered node that disappears (disabledItems) drops the emphasis", () => {
    const { host, chart, props } = mount({ hoverHighlight: true });
    enter(nodeEl(host, "France"));
    chart.update({ ...props, disabledItems: ["France"] });
    expect(linkAlpha(host, "Germany", "EU")).toBeCloseTo(LIT);
    expect(nodeAlpha(host, "Germany")).toBe(1);
    chart.destroy();
    host.remove();
  });

  it("links transition fill-opacity (the in-place change) unless enableTransitions is false", () => {
    const on = mount({ hoverHighlight: true });
    expect(linkEl(on.host, "France", "EU").style.transition).toContain("fill-opacity");
    on.chart.destroy();
    on.host.remove();
    const off = mount({ hoverHighlight: true, enableTransitions: false });
    expect(linkEl(off.host, "France", "EU").style.transition).toBe("none");
    off.chart.destroy();
    off.host.remove();
  });
});

// ---- engine: canvas (host mousemove path) -----------------------------------

// jsdom has no 2D context and no Path2D. A recording fake stands in: every frame
// starts at setupCanvas's clearRect; link ribbons arrive as fill(Path2D) keyed by
// their `d`, square nodes (nodeRadius 0) as fillRect keyed by "x,y". The link
// hit-test (isPointInPath) is steered by `hitD`.
interface PaintOp {
  kind: "link" | "node";
  key: string;
  alpha: number;
}
class FakePath2D {
  d: string;
  constructor(d?: string) {
    this.d = d ?? "";
  }
  moveTo(): void {}
  lineTo(): void {}
  arcTo(): void {}
  closePath(): void {}
}
const paint = { frames: [] as PaintOp[][], hitD: null as string | null };

function fakeContext() {
  const ctx = {
    globalAlpha: 1,
    fillStyle: "",
    font: "",
    textBaseline: "",
    textAlign: "",
    setTransform() {},
    save() {},
    restore() {},
    beginPath() {},
    rect() {},
    clip() {},
    fillText() {},
    clearRect() {
      paint.frames.push([]);
    },
    fill(p: FakePath2D) {
      paint.frames[paint.frames.length - 1]?.push({
        kind: "link",
        key: p.d,
        alpha: ctx.globalAlpha,
      });
    },
    fillRect(x: number, y: number) {
      paint.frames[paint.frames.length - 1]?.push({
        kind: "node",
        key: `${x},${y}`,
        alpha: ctx.globalAlpha,
      });
    },
    isPointInPath(p: FakePath2D) {
      return paint.hitD !== null && p.d === paint.hitD;
    },
  };
  return ctx;
}

const MARGIN: Margin = { top: 60, right: 40, bottom: 20, left: 90 };
// The svg sits 15/25 px into the page: the engine must subtract the SVG's own
// offset, and must NOT subtract the margin again (layout coords already include it).
const SVG_OFFSET = { left: 15, top: 25 };

/** Geometry of the same chart, read from an svg twin (identical layout/model). */
function twinGeometry(extra: Partial<SankeyChartProps>) {
  const twin = mount({ ...extra, renderer: "svg" });
  const nodeBox: Record<string, { x: number; y: number; w: number; h: number }> = {};
  for (const n of nodes) {
    const r = twin.host.querySelector<SVGRectElement>(`rect.node[data-label="${n.id}"]`)!;
    nodeBox[n.id] = {
      x: Number(r.getAttribute("x")),
      y: Number(r.getAttribute("y")),
      w: Number(r.getAttribute("width")),
      h: Number(r.getAttribute("height")),
    };
  }
  const linkD: Record<string, string> = {};
  for (const l of links)
    linkD[`${l.source}>${l.target}`] = linkEl(twin.host, l.source, l.target).getAttribute("d")!;
  twin.chart.destroy();
  twin.host.remove();
  return { nodeBox, linkD };
}

function mountPainted(extra: Partial<SankeyChartProps>) {
  const m = mount(extra);
  const svg = m.host.querySelector("svg")!;
  svg.getBoundingClientRect = () =>
    ({ left: SVG_OFFSET.left, top: SVG_OFFSET.top, width: 600, height: 400 }) as DOMRect;
  const move = (x: number, y: number) =>
    m.host.dispatchEvent(
      new MouseEvent("mousemove", {
        clientX: SVG_OFFSET.left + x,
        clientY: SVG_OFFSET.top + y,
        bubbles: true,
      }),
    );
  return { ...m, move };
}

function lastFrame(geo: ReturnType<typeof twinGeometry>) {
  const frame = paint.frames[paint.frames.length - 1];
  const linkByD = new Map(Object.entries(geo.linkD).map(([k, d]) => [d, k]));
  const nodeByXY = new Map(
    Object.entries(geo.nodeBox).map(([id, b]) => [`${b.x},${b.y}`, id] as [string, string]),
  );
  const out = { links: {} as Record<string, number>, nodes: {} as Record<string, number> };
  for (const op of frame) {
    if (op.kind === "link") out.links[linkByD.get(op.key)!] = op.alpha;
    else out.nodes[nodeByXY.get(op.key)!] = op.alpha;
  }
  return out;
}

describe("hoverHighlight - canvas engine (host mousemove, non-default margin)", () => {
  beforeEach(() => {
    paint.frames = [];
    paint.hitD = null;
    const contexts = new WeakMap<HTMLCanvasElement, ReturnType<typeof fakeContext>>();
    vi.stubGlobal("Path2D", FakePath2D);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (
      this: HTMLCanvasElement,
      type: string,
    ) {
      if (type !== "2d") return null;
      if (!contexts.has(this)) contexts.set(this, fakeContext());
      return contexts.get(this)!;
    } as unknown as HTMLCanvasElement["getContext"]);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const base: Partial<SankeyChartProps> = { margin: MARGIN, nodeRadius: 0 };
  const centre = (b: { x: number; y: number; w: number; h: number }) =>
    [b.x + b.w / 2, b.y + b.h / 2] as const;

  it("hovering a node repaints with the node's flows lit and the rest dimmed", () => {
    const geo = twinGeometry(base);
    const seen: string[][] = [];
    const { host, chart, move } = mountPainted({
      ...base,
      renderer: "canvas",
      hoverHighlight: true,
      onHighlightItem: (l) => seen.push(l),
    });
    const first = lastFrame(geo);
    expect(Object.values(first.links).every((a) => a === LIT)).toBe(true);

    move(...centre(geo.nodeBox.France));
    const f = lastFrame(geo);
    expect(f.links["France>EU"]).toBeCloseTo(LIT);
    expect(f.links["France>Asia"]).toBeCloseTo(LIT);
    expect(f.links["Germany>EU"]).toBeCloseTo(DIM);
    expect(f.links["Germany>Asia"]).toBeCloseTo(DIM);
    expect(f.nodes).toEqual({ France: 1, Germany: 0.25, EU: 1, Asia: 1 });
    expect(seen).toEqual([["France"]]);

    // Off every mark: restored.
    move(1, 1);
    const r = lastFrame(geo);
    expect(Object.values(r.links).every((a) => a === LIT)).toBe(true);
    expect(Object.values(r.nodes).every((a) => a === 1)).toBe(true);
    chart.destroy();
    host.remove();
  });

  it("hovering a link lights only that link and its two end nodes", () => {
    const geo = twinGeometry(base);
    const { host, chart, move } = mountPainted({
      ...base,
      renderer: "canvas",
      hoverHighlight: true,
    });
    paint.hitD = geo.linkD["France>EU"];
    move(300, 200); // between the columns: no node there, the link hit-test decides
    const f = lastFrame(geo);
    expect(f.links["France>EU"]).toBeCloseTo(LIT);
    expect(f.links["France>Asia"]).toBeCloseTo(DIM);
    expect(f.links["Germany>EU"]).toBeCloseTo(DIM);
    expect(f.nodes).toEqual({ France: 1, Germany: 0.25, EU: 1, Asia: 0.25 });
    chart.destroy();
    host.remove();
  });

  it("repaints only when the hovered target changes", () => {
    const geo = twinGeometry(base);
    const { host, chart, move } = mountPainted({
      ...base,
      renderer: "canvas",
      hoverHighlight: true,
    });
    const n0 = paint.frames.length;
    move(...centre(geo.nodeBox.France));
    move(...centre(geo.nodeBox.France));
    expect(paint.frames.length).toBe(n0 + 1);
    chart.destroy();
    host.remove();
  });

  it("default (hoverHighlight off): hovering does not repaint", () => {
    const geo = twinGeometry(base);
    const { host, chart, move } = mountPainted({ ...base, renderer: "canvas" });
    const n0 = paint.frames.length;
    move(...centre(geo.nodeBox.France));
    expect(paint.frames.length).toBe(n0);
    chart.destroy();
    host.remove();
  });

  it("a pinned tooltip keeps its emphasis; clicking again unpins and restores", () => {
    const geo = twinGeometry(base);
    const { host, chart, move } = mountPainted({
      ...base,
      renderer: "canvas",
      hoverHighlight: true,
    });
    move(...centre(geo.nodeBox.France));
    click(host); // pin
    move(1, 1); // ignored while pinned
    expect(lastFrame(geo).links["Germany>EU"]).toBeCloseTo(DIM);
    click(host); // unpin
    const r = lastFrame(geo);
    expect(Object.values(r.links).every((a) => a === LIT)).toBe(true);
    expect(Object.values(r.nodes).every((a) => a === 1)).toBe(true);
    chart.destroy();
    host.remove();
  });

  it("leaving the host clears the emphasis", () => {
    const geo = twinGeometry(base);
    const { host, chart, move } = mountPainted({
      ...base,
      renderer: "canvas",
      hoverHighlight: true,
    });
    move(...centre(geo.nodeBox.France));
    host.dispatchEvent(new MouseEvent("mouseleave"));
    expect(Object.values(lastFrame(geo).links).every((a) => a === LIT)).toBe(true);
    chart.destroy();
    host.remove();
  });
});
