import { describe, it, expect, afterEach } from "vitest";
import { mountFountainChart } from "../src/engine/fountainChart";
import { createManualTicker, type ManualTicker } from "../src/animation/ticker";
import type { MotionPreference } from "../src/animation/reducedMotion";
import { __resetGPUDeviceForTest } from "../src/webgpu/device";
import type { DataWarning, FountainChartProps, FountainDataItem } from "../src/types";

const WIDTH = 600;
const HEIGHT = 360;

const snapshot: FountainDataItem[] = [
  { label: "Jet d'Eau", value: 140, spread: 30 },
  { label: "Zurich", value: 90, spread: 10 },
  { label: "Bern", value: 60, spread: 25 },
];

// Trend jets with ranges and samples: the fountains are wider than a point marker, so
// a reveal that stopped 8 px right of the centre would cut them in half.
const trend: FountainDataItem[] = [
  {
    label: "Flow",
    value: 50,
    low: 38,
    high: 70,
    samples: [38, 44, 48, 50, 52, 55, 61, 70],
    date: 2001,
  },
  {
    label: "Flow",
    value: 70,
    low: 55,
    high: 90,
    samples: [55, 62, 66, 70, 71, 75, 83, 90],
    date: 2002,
  },
  {
    label: "Flow",
    value: 95,
    low: 80,
    high: 120,
    samples: [80, 88, 93, 95, 97, 104, 120],
    date: 2003,
  },
];

function mount(
  data: FountainDataItem[],
  extra: Partial<FountainChartProps> = {},
  ticker?: ManualTicker,
  motion?: MotionPreference,
) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountFountainChart(
    host,
    { dataSet: data, title: "Demo", width: WIDTH, height: HEIGHT, ...extra },
    { ticker, motion },
  );
  return { host, chart };
}

const clipWidth = (host: HTMLElement): number => {
  const rects = host.querySelectorAll("clipPath rect");
  expect(rects.length).toBeGreaterThan(0);
  return Number(rects[rects.length - 1]!.getAttribute("width"));
};

const num = (el: Element, a: string): number => Number(el.getAttribute(a));
const r2 = (n: number): number => Math.round(n * 100) / 100;

/** Left and right edges of every mark each jet paints, in x order. */
function jetEdges(host: HTMLElement): Array<{ x: number; left: number; right: number }> {
  return Array.from(host.querySelectorAll("g.mv-fountain-jet-group"))
    .map((g) => {
      const xs: number[] = [];
      const bell = g.querySelector("path.mv-fountain-jet");
      for (const m of (bell?.getAttribute("d") ?? "").matchAll(/[ML]\s*(-?[\d.]+),/g)) {
        xs.push(Number(m[1]));
      }
      for (const c of Array.from(g.querySelectorAll("circle"))) {
        xs.push(num(c, "cx") - num(c, "r"), num(c, "cx") + num(c, "r"));
      }
      const big = g.querySelector("circle.mv-fountain-value")!;
      return { x: num(big, "cx"), left: Math.min(...xs), right: Math.max(...xs) };
    })
    .sort((a, b) => a.x - b.x);
}

const visibleValueLabels = (host: HTMLElement): number[] =>
  Array.from(host.querySelectorAll("g.mv-fountain-value-label"))
    .filter((g) => g.getAttribute("visibility") !== "hidden")
    .map((g) => num(g, "data-x"));

describe("FountainChart timeline off by default", () => {
  it("renders no control, no clip, no timeline()", () => {
    const { host, chart } = mount(trend, { xAxisDataType: "number" });
    expect(host.querySelector(".mv-timeline")).toBeNull();
    expect(host.querySelector("clipPath")).toBeNull();
    expect(chart.timeline).toBeUndefined();
    chart.destroy();
    host.remove();
  });
});

describe("FountainChart timeline (cumulative, trend mode)", () => {
  it("mounts revealed to the FIRST period's painted right edge: the whole jet, nothing of the next", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(trend, { xAxisDataType: "number", timeline: true }, ticker);
    const [a, b] = jetEdges(host);
    const w = clipWidth(host);
    expect(w).toBeGreaterThanOrEqual(a.right);
    expect(w).toBeLessThan(b.left);
    expect(w).toBeGreaterThan(a.x + 8); // the old px + 8 target cut the bell in half
    expect(host.querySelector(".mv-timeline")).not.toBeNull();
    expect(host.querySelector(".mv-timeline-period")!.textContent).toBe("2001");
    expect(chart.timeline!()!.getState().periods).toEqual([2001, 2002, 2003]);
    chart.destroy();
    host.remove();
  });

  it("value labels appear with their jet", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      trend,
      { xAxisDataType: "number", timeline: { interpolate: false } },
      ticker,
    );
    const [a, b, c] = jetEdges(host);
    expect(visibleValueLabels(host)).toEqual([r2(a.x)]);
    chart.timeline!()!.stepForward();
    expect(visibleValueLabels(host)).toEqual([r2(a.x), r2(b.x)]);
    chart.timeline!()!.stepForward();
    expect(visibleValueLabels(host)).toEqual([r2(a.x), r2(b.x), r2(c.x)]);
    expect(clipWidth(host)).toBe(WIDTH);
    expect(c.right).toBeLessThanOrEqual(WIDTH);
    chart.destroy();
    host.remove();
  });

  it("stepForward() sweeps to the next period's painted edge", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      trend,
      { xAxisDataType: "number", timeline: { easing: "linear", tweenMs: 400 } },
      ticker,
    );
    const t0 = clipWidth(host);
    const [, b, c] = jetEdges(host);
    chart.timeline!()!.stepForward();
    ticker.tick(200);
    const mid = clipWidth(host);
    expect(mid).toBeGreaterThan(t0);
    ticker.tick(200);
    const t1 = clipWidth(host);
    expect(t1).toBeGreaterThanOrEqual(b.right);
    expect(t1).toBeLessThan(c.left);
    expect(mid).toBeLessThan(t1);
    expect(host.querySelector(".mv-timeline-period")!.textContent).toBe("2002");
    chart.destroy();
    host.remove();
  });

  it("hover cannot reach a period the timeline has not drawn (svg and canvas)", () => {
    const ref = mount(trend, { xAxisDataType: "number" });
    const [a, , c] = jetEdges(ref.host);
    ref.chart.destroy();
    ref.host.remove();
    for (const renderer of ["svg", "canvas"] as const) {
      const ticker = createManualTicker();
      const calls: string[][] = [];
      const { host, chart } = mount(
        trend,
        {
          xAxisDataType: "number",
          timeline: true,
          renderer,
          onHighlightItem: (l) => calls.push(l),
        },
        ticker,
      );
      host.dispatchEvent(new MouseEvent("mousemove", { clientX: c.x, clientY: 200 }));
      expect(calls).toEqual([]);
      expect(host.querySelector<HTMLElement>(".tooltip")!.style.visibility).toBe("hidden");
      host.dispatchEvent(new MouseEvent("mousemove", { clientX: a.x, clientY: 200 }));
      expect(calls).toEqual([["Flow"]]);
      chart.destroy();
      host.remove();
    }
  });

  it("the LAST period reveals the full width", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      trend,
      { xAxisDataType: "number", timeline: { easing: "linear", tweenMs: 400 } },
      ticker,
    );
    chart.timeline!()!.seekIndex(2);
    ticker.tick(400);
    expect(clipWidth(host)).toBe(WIDTH);
    chart.destroy();
    host.remove();
  });

  it("interpolate: false jump-cuts", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      trend,
      { xAxisDataType: "number", timeline: { interpolate: false } },
      ticker,
    );
    const [, b, c] = jetEdges(host);
    chart.timeline!()!.stepForward();
    expect(clipWidth(host)).toBeGreaterThanOrEqual(b.right);
    expect(clipWidth(host)).toBeLessThan(c.left);
    chart.destroy();
    host.remove();
  });

  it("timeline wins over progressiveDraw when both are set", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      trend,
      {
        xAxisDataType: "number",
        timeline: true,
        progressiveDraw: { durationMs: 1000, easing: "linear" },
      },
      ticker,
    );
    const t0 = clipWidth(host);
    ticker.tick(500);
    expect(clipWidth(host)).toBe(t0);
    chart.destroy();
    host.remove();
  });

  it("destroy() mid-sweep is safe", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      trend,
      { xAxisDataType: "number", timeline: { easing: "linear", tweenMs: 400 } },
      ticker,
    );
    chart.timeline!()!.stepForward();
    ticker.tick(100);
    chart.destroy();
    host.remove();
    expect(() => ticker.tick(2000)).not.toThrow();
  });
});

describe("FountainChart timeline (snapshot mode is categorical: no control)", () => {
  it("renders no control/clip even with timeline set (categorical x has no periods)", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(snapshot, { timeline: true }, ticker);
    expect(host.querySelector(".mv-timeline")).toBeNull();
    expect(host.querySelector("clipPath")).toBeNull();
    expect(chart.timeline!()).toBeNull();
    chart.destroy();
    host.remove();
  });
});

describe("FountainChart timeline canvas mode (trend)", () => {
  it("sweeps without throwing (jsdom has no 2d context); value labels still follow", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      trend,
      { xAxisDataType: "number", timeline: { easing: "linear", tweenMs: 400 }, renderer: "canvas" },
      ticker,
    );
    expect(host.querySelector(".mv-timeline")).not.toBeNull();
    expect(visibleValueLabels(host)).toHaveLength(1);
    expect(() => {
      chart.timeline!()!.stepForward();
      for (let i = 0; i < 10; i++) ticker.tick(100);
    }).not.toThrow();
    expect(visibleValueLabels(host)).toHaveLength(2);
    chart.destroy();
    host.remove();
  });
});

function setGpu(present: boolean): void {
  if (present) {
    Object.defineProperty(navigator, "gpu", { value: {}, configurable: true });
  } else {
    delete (navigator as unknown as { gpu?: unknown }).gpu;
  }
}

describe("FountainChart timeline webgpu mode (trend)", () => {
  afterEach(() => {
    setGpu(false);
    __resetGPUDeviceForTest();
  });

  it("is inert under webgpu (no reveal clip on the GPU) and says so", () => {
    setGpu(true);
    const ticker = createManualTicker();
    let warned: DataWarning[] = [];
    const { host, chart } = mount(
      trend,
      {
        xAxisDataType: "number",
        timeline: true,
        renderer: "webgpu",
        onDataWarning: (w) => (warned = w),
      },
      ticker,
    );
    expect(host.querySelector(".mv-timeline")).toBeNull();
    expect(host.querySelector("clipPath")).toBeNull();
    expect(chart.timeline!()).toBeNull();
    expect(visibleValueLabels(host)).toHaveLength(3);
    expect(
      warned.some((w) => w.type === "ignored-option" && w.message.includes("`timeline`")),
    ).toBe(true);
    expect(() => ticker.tick(1000)).not.toThrow();
    chart.destroy();
    host.remove();
  });
});
