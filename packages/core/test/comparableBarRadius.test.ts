// barRadius on ComparableHorizontalBarChart + ComparableVerticalBarChart: the
// corner radius every bar is drawn with (default 5, the legacy look). SVG writes
// it as rx/ry, canvas passes it to roundRect (or the arcTo fallback); both clamp
// it to half the bar's width or height through the SAME helper so the two
// renderers can never disagree on a thin bar.
import { describe, it, expect, vi, afterEach } from "vitest";
import { mountComparableHorizontalBarChart } from "../src/engine/comparableHorizontalBarChart";
import { mountComparableVerticalBarChart } from "../src/engine/comparableVerticalBarChart";
import { clampBarRadius, resolveBarRadius } from "../src/comparableBar/barRadius";
import type {
  ComparableBarChartProps,
  ComparableBarDataPoint,
  ComparableVerticalBarChartProps,
} from "../src/types";

const dataSet: ComparableBarDataPoint[] = [
  { label: "Alpha One", valueBased: 10, valueCompared: 18 },
  { label: "Beta", valueBased: 30, valueCompared: 22 },
  { label: "Gamma", valueBased: 16, valueCompared: 24 },
];

type Kind = "horizontal" | "vertical";
type AnyProps = Partial<ComparableBarChartProps> & Partial<ComparableVerticalBarChartProps>;

function mount(kind: Kind, extra: AnyProps = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const base = { dataSet, title: "Demo", width: 600, height: 300 };
  const chart =
    kind === "horizontal"
      ? mountComparableHorizontalBarChart(host, { ...base, ...(extra as ComparableBarChartProps) })
      : mountComparableVerticalBarChart(host, {
          ...base,
          ...(extra as ComparableVerticalBarChartProps),
        });
  return { host, chart };
}

interface RectGeom {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
}

function svgRects(host: HTMLElement): (RectGeom & { rx: string | null; ry: string | null })[] {
  return Array.from(host.querySelectorAll<SVGRectElement>("rect.bar")).map((el) => ({
    x: Number(el.getAttribute("x")),
    y: Number(el.getAttribute("y")),
    w: Number(el.getAttribute("width")),
    h: Number(el.getAttribute("height")),
    r: Number(el.getAttribute("rx")),
    rx: el.getAttribute("rx"),
    ry: el.getAttribute("ry"),
  }));
}

// A recording 2D context handed ONLY to the chart's own bar layer canvas, so the
// axis-label measurer (which caches its own detached canvas) keeps jsdom's null.
const BAR_LAYERS = ["comparable-bar-canvas", "comparable-vertical-bar-canvas"];

function recordCanvas(opts: { roundRect: boolean }) {
  const roundRectCalls: RectGeom[] = [];
  const arcToRadii: number[] = [];
  const ctx: Record<string, unknown> = {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    arcTo: vi.fn((_x1: number, _y1: number, _x2: number, _y2: number, r: number) => {
      arcToRadii.push(r);
    }),
    fill: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    createPattern: vi.fn(() => null),
    measureText: vi.fn(() => ({ width: 0 })),
    fillText: vi.fn(),
    globalAlpha: 1,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
  };
  if (opts.roundRect) {
    ctx.roundRect = vi.fn((x: number, y: number, w: number, h: number, r: number) => {
      roundRectCalls.push({ x, y, w, h, r });
    });
  }
  const spy = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (
    this: HTMLCanvasElement,
  ) {
    return BAR_LAYERS.some((c) => this.classList.contains(c))
      ? (ctx as unknown as CanvasRenderingContext2D)
      : null;
  } as unknown as HTMLCanvasElement["getContext"]);
  return { ctx, spy, roundRectCalls, arcToRadii };
}

const round = (n: number) => Math.round(n * 1000) / 1000;
const key = (g: RectGeom) => [g.x, g.y, g.w, g.h, g.r].map(round).join(",");

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("clampBarRadius / resolveBarRadius (pure)", () => {
  it("never exceeds half the width or height, never goes negative", () => {
    expect(clampBarRadius(5, 100, 40)).toBe(5);
    expect(clampBarRadius(5, 100, 6)).toBe(3); // half the height
    expect(clampBarRadius(5, 4, 40)).toBe(2); // half the width
    expect(clampBarRadius(5, -8, 40)).toBe(4); // negative width measured by magnitude
    expect(clampBarRadius(0, 100, 40)).toBe(0);
    expect(clampBarRadius(-3, 100, 40)).toBe(0);
    expect(clampBarRadius(Infinity, 100, 12)).toBe(6); // a deliberate full pill
  });

  it("resolves the prop: default 5, negatives floor to 0, NaN falls back to 5", () => {
    expect(resolveBarRadius(5)).toBe(5);
    expect(resolveBarRadius(2)).toBe(2);
    expect(resolveBarRadius(0)).toBe(0);
    expect(resolveBarRadius(-4)).toBe(0);
    expect(resolveBarRadius(Number.NaN)).toBe(5);
  });
});

describe.each<Kind>(["horizontal", "vertical"])("%s comparable bar - barRadius (svg)", (kind) => {
  it("defaults to rx/ry 5 (unchanged legacy look)", () => {
    const { host, chart } = mount(kind);
    const rects = svgRects(host);
    expect(rects.length).toBe(6);
    for (const r of rects) {
      expect(r.rx).toBe("5");
      expect(r.ry).toBe("5");
    }
    chart.destroy();
  });

  it.each([0, 2])("barRadius: %i sets rx/ry on every bar", (barRadius) => {
    const { host, chart } = mount(kind, { barRadius });
    const rects = svgRects(host);
    expect(rects.length).toBe(6);
    for (const r of rects) {
      expect(r.rx).toBe(String(barRadius));
      expect(r.ry).toBe(String(barRadius));
    }
    chart.destroy();
  });

  it("clamps rx/ry to half the bar's width or height, like the canvas path", () => {
    const { host, chart } = mount(kind, { barRadius: 1000 });
    const rects = svgRects(host);
    expect(rects.length).toBe(6);
    for (const r of rects) {
      const expected = Math.min(Math.abs(r.w), Math.abs(r.h)) / 2;
      expect(Number(r.rx)).toBeCloseTo(expected, 6);
      expect(Number(r.ry)).toBeCloseTo(expected, 6);
    }
    chart.destroy();
  });

  it("follows barRadius on update()", () => {
    const { host, chart } = mount(kind);
    chart.update({ dataSet, title: "Demo", width: 600, height: 300, barRadius: 3 } as never);
    const rects = svgRects(host);
    expect(rects.length).toBe(6);
    for (const r of rects) expect(r.rx).toBe("3");
    chart.destroy();
  });
});

describe.each<Kind>(["horizontal", "vertical"])(
  "%s comparable bar - barRadius (canvas)",
  (kind) => {
    it("defaults to radius 5 in roundRect", () => {
      const { roundRectCalls } = recordCanvas({ roundRect: true });
      const { chart } = mount(kind, { renderer: "canvas" });
      expect(roundRectCalls.length).toBe(6);
      for (const c of roundRectCalls) expect(c.r).toBe(clampBarRadius(5, c.w, c.h));
      expect(roundRectCalls.some((c) => c.r === 5)).toBe(true);
      chart.destroy();
    });

    it.each([0, 2])("barRadius: %i reaches roundRect", (barRadius) => {
      const { roundRectCalls } = recordCanvas({ roundRect: true });
      const { chart } = mount(kind, { renderer: "canvas", barRadius });
      expect(roundRectCalls.length).toBe(6);
      for (const c of roundRectCalls) expect(c.r).toBe(barRadius);
      chart.destroy();
    });

    it("clamps to half the bar's width or height", () => {
      const { roundRectCalls } = recordCanvas({ roundRect: true });
      const { chart } = mount(kind, { renderer: "canvas", barRadius: 1000 });
      expect(roundRectCalls.length).toBe(6);
      for (const c of roundRectCalls) {
        expect(c.r).toBeCloseTo(Math.min(Math.abs(c.w), Math.abs(c.h)) / 2, 6);
      }
      chart.destroy();
    });

    it("uses barRadius in the arcTo fallback when roundRect is missing", () => {
      const { arcToRadii } = recordCanvas({ roundRect: false });
      const { chart } = mount(kind, { renderer: "canvas", barRadius: 0 });
      expect(arcToRadii.length).toBe(6 * 4); // four corners per bar
      expect(arcToRadii.every((r) => r === 0)).toBe(true);
      chart.destroy();
    });

    it("a webgpu request that falls back to canvas keeps barRadius", () => {
      const { roundRectCalls } = recordCanvas({ roundRect: true });
      const { chart } = mount(kind, { renderer: "webgpu", barRadius: 2 });
      expect(roundRectCalls.length).toBe(6);
      for (const c of roundRectCalls) expect(c.r).toBe(2);
      chart.destroy();
    });
  },
);

describe("svg and canvas draw the same corners", () => {
  // Thin bars are the case the clamp exists for: grouped half-bands on a short
  // horizontal chart (~5px), and narrow columns on a narrow vertical one (~3px).
  it.each<[Kind, AnyProps]>([
    ["horizontal", { layout: "grouped", height: 150, barRadius: 4 }],
    ["horizontal", { layout: "grouped", height: 150 }],
    ["vertical", { width: 120, barRadius: 3 }],
    ["vertical", { width: 120 }],
  ])("%s %o", (kind, extra) => {
    const svgMount = mount(kind, { ...extra, renderer: "svg" });
    const svgGeoms = svgRects(svgMount.host);
    svgMount.chart.destroy();
    // The clamp is really exercised: every bar here is thinner than 2 x radius.
    const requested = extra.barRadius ?? 5;
    expect(svgGeoms.length).toBe(6);
    expect(svgGeoms.every((g) => g.r < requested)).toBe(true);

    const { roundRectCalls } = recordCanvas({ roundRect: true });
    const { chart } = mount(kind, { ...extra, renderer: "canvas" });
    const fromCanvas = roundRectCalls.map(key).sort();
    chart.destroy();

    expect(fromCanvas).toEqual(svgGeoms.map(key).sort());
  });
});
