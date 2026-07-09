import { describe, it, expect } from "vitest";
import { interpolateRows } from "../src/animation/chartTimeline";
import { mountScatterChart } from "../src/engine/scatterChart";
import { createManualTicker, type ManualTicker } from "../src/animation/ticker";
import type { MotionPreference } from "../src/animation/reducedMotion";
import type { ScatterChartProps, ScatterDataPoint } from "../src/types";

describe("interpolateRows", () => {
  const from = [
    { label: "Alpha", x: 10, y: 100, d: 4, date: "2018" },
    { label: "Gone", x: 5, y: 50, d: 2, date: "2018" },
  ];
  const to = [
    { label: "Alpha", x: 20, y: 200, d: 8, date: "2019" },
    { label: "New", x: 7, y: 70, d: 3, date: "2019" },
  ];

  it("lerps numeric fields of matched rows at t", () => {
    const rows = interpolateRows(from, to, 0.5);
    const alpha = rows.find(r => r.label === "Alpha")!;
    expect(alpha.x).toBeCloseTo(15, 6);
    expect(alpha.y).toBeCloseTo(150, 6);
    expect(alpha.d).toBeCloseTo(6, 6);
  });

  it("never lerps the date field (keeps the target period)", () => {
    const rows = interpolateRows(from, to, 0.5);
    expect(rows.find(r => r.label === "Alpha")!.date).toBe("2019");
  });

  it("returns target rows untouched at t = 1", () => {
    const rows = interpolateRows(from, to, 1);
    expect(rows.find(r => r.label === "Alpha")).toEqual(to[0]);
  });

  it("includes entering rows at their target values", () => {
    const rows = interpolateRows(from, to, 0.25);
    expect(rows.find(r => r.label === "New")).toEqual(to[1]);
  });

  it("drops exiting rows (present only in `from`)", () => {
    const rows = interpolateRows(from, to, 0.25);
    expect(rows.find(r => r.label === "Gone")).toBeUndefined();
  });

  it("recurses into children arrays, matching nested nodes by label (treemap hierarchies)", () => {
    const fromTree = [
      {
        label: "Group",
        value: 100,
        date: "2021",
        children: [
          { label: "Leaf A", value: 60 },
          { label: "Leaf B", value: 40 },
        ],
      },
    ];
    const toTree = [
      {
        label: "Group",
        value: 200,
        date: "2022",
        children: [
          { label: "Leaf A", value: 120 },
          { label: "Leaf C", value: 80 },
        ],
      },
    ];
    const rows = interpolateRows(fromTree, toTree, 0.5) as typeof toTree;
    const group = rows[0];
    expect(group.value).toBeCloseTo(150, 6);
    const leafA = group.children.find(c => c.label === "Leaf A")!;
    expect(leafA.value).toBeCloseTo(90, 6); // 60 -> 120 midway
    expect(group.children.find(c => c.label === "Leaf C")!.value).toBe(80); // entering: target values
    expect(group.children.find(c => c.label === "Leaf B")).toBeUndefined(); // exiting: dropped
  });
});

describe("scatter timeline interpolation (engine level)", () => {
  const dataSet: ScatterDataPoint[] = [
    { label: "Alpha", x: 1, y: 2, d: 5, date: "2018" },
    { label: "Beta", x: 3, y: 6, d: 10, date: "2018" },
    { label: "Alpha", x: 2, y: 4, d: 6, date: "2019" },
    { label: "Beta", x: 4, y: 8, d: 9, date: "2019" },
  ];

  function mount(
    extra: Partial<ScatterChartProps> = {},
    ticker?: ManualTicker,
    motion?: MotionPreference
  ) {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountScatterChart(
      host,
      {
        dataSet,
        width: 600,
        height: 300,
        xAxisDataType: "number",
        // Pin the x-domain so the scale does not change between periods and the
        // pixel cx is a pure function of the interpolated x value.
        xAxisDomain: [0, 5],
        ...extra,
      },
      { ticker, motion }
    );
    return { host, chart };
  }

  const alphaCx = (host: HTMLElement): number => {
    const el = host.querySelector<SVGCircleElement>('circle[data-label="Alpha"]');
    expect(el).not.toBeNull();
    return Number(el!.getAttribute("cx"));
  };

  it("tweens between periods: mid-tween position is strictly between the endpoints", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      { timeline: { tweenMs: 400, easing: "linear" } },
      ticker
    );
    const startCx = alphaCx(host);
    chart.timeline!()!.stepForward();
    // Tween begins at the old position.
    const atStep = alphaCx(host);
    expect(atStep).toBeCloseTo(startCx, 3);
    ticker.tick(200); // half of tweenMs
    const mid = alphaCx(host);
    ticker.tick(200); // tween complete
    const end = alphaCx(host);
    expect(mid).toBeGreaterThan(startCx);
    expect(mid).toBeLessThan(end);
    expect(mid).toBeCloseTo((startCx + end) / 2, 1);
    chart.destroy();
    host.remove();
  });

  it("interpolate: false hard-cuts to the next period", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: { interpolate: false } }, ticker);
    const startCx = alphaCx(host);
    chart.timeline!()!.stepForward();
    const after = alphaCx(host);
    expect(after).toBeGreaterThan(startCx);
    ticker.tick(400);
    expect(alphaCx(host)).toBeCloseTo(after, 6);
    chart.destroy();
    host.remove();
  });

  it("prefers-reduced-motion hard-cuts even when interpolate is on", () => {
    const ticker = createManualTicker();
    const reduced: MotionPreference = { prefersReduced: () => true };
    const { host, chart } = mount({ timeline: { tweenMs: 400 } }, ticker, reduced);
    const startCx = alphaCx(host);
    chart.timeline!()!.stepForward();
    expect(alphaCx(host)).toBeGreaterThan(startCx);
    chart.destroy();
    host.remove();
  });

  it("a seek during a running tween lands on the sought period", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      { timeline: { tweenMs: 400, easing: "linear" } },
      ticker
    );
    const tl = chart.timeline!()!;
    tl.stepForward();
    ticker.tick(100);
    tl.seek(0); // back to 2018 mid-tween
    ticker.tick(400); // let the new tween finish
    expect(tl.getState().index).toBe(0);
    const el = alphaCx(host);
    // 2018 Alpha x=1, domain [0,5], plot 60..550 -> cx = 60 + (1/5)*490 = 158
    expect(el).toBeCloseTo(60 + (1 / 5) * (550 - 60), 1);
    chart.destroy();
    host.remove();
  });

  it("perf smoke: 200 rows x 2 periods tween without pathological cost", () => {
    const big: ScatterDataPoint[] = [];
    for (let i = 0; i < 200; i++) {
      big.push({ label: `P${i}`, x: (i % 50) / 10, y: i % 20, d: 5, date: "2018" });
      big.push({ label: `P${i}`, x: ((i + 7) % 50) / 10, y: (i + 3) % 20, d: 6, date: "2019" });
    }
    const ticker = createManualTicker();
    const { host, chart } = mount({ dataSet: big, timeline: { tweenMs: 320 } }, ticker);
    const t0 = Date.now();
    chart.timeline!()!.stepForward();
    for (let i = 0; i < 20; i++) ticker.tick(16); // 20 frames of the tween
    const elapsed = Date.now() - t0;
    expect(elapsed).toBeLessThan(10_000); // pathology guard, not a benchmark
    chart.destroy();
    host.remove();
  });
});
