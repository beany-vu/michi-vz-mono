import { describe, it, expect } from "vitest";
import { mountLineChart } from "../src/engine/lineChart";
import { createManualTicker, type ManualTicker } from "../src/animation/ticker";
import type { MotionPreference } from "../src/animation/reducedMotion";
import type { LineChartProps, LineDataItem } from "../src/types";

const annual = (vals: number[], start = 2016): { date: number; value: number; certainty: boolean }[] =>
  vals.map((value, i) => ({ date: start + i, value, certainty: true }));

const sample: LineDataItem[] = [
  { label: "Alpha", color: "#ff0000", series: annual([10, 20, 15, 30]) },
  { label: "Beta", color: "#00ff00", series: annual([5, 8, 12, 6]) },
];

// width 600, default margin left 60 / right 50 -> plot 60..550, 4 years:
// 2016@60, 2017@223.33, 2018@386.67, 2019@550. Targets: px+8 except the last
// period, which reveals to the full width (600).
const WIDTH = 600;
const T0 = 68;
const T1 = 60 + 490 / 3 + 8;
const T3 = WIDTH;

function mount(extra: Partial<LineChartProps> = {}, ticker?: ManualTicker, motion?: MotionPreference) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountLineChart(
    host,
    { dataSet: sample, width: WIDTH, height: 300, xAxisDataType: "date_annual", ...extra },
    { ticker, motion }
  );
  return { host, chart };
}

const clipWidth = (host: HTMLElement): number => {
  const rects = host.querySelectorAll("clipPath rect");
  expect(rects.length).toBeGreaterThan(0);
  return Number(rects[rects.length - 1]!.getAttribute("width"));
};

describe("line timeline off by default", () => {
  it("renders no control, no clip, no timeline()", () => {
    const { host, chart } = mount();
    expect(host.querySelector(".mv-timeline")).toBeNull();
    expect(host.querySelector("clipPath")).toBeNull();
    expect(chart.timeline).toBeUndefined();
    chart.destroy();
    host.remove();
  });
});

describe("line timeline (cumulative)", () => {
  it("mounts revealed up to the FIRST year, control shows it", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: true }, ticker);
    expect(clipWidth(host)).toBeCloseTo(T0, 3);
    expect(host.querySelector(".mv-timeline")).not.toBeNull();
    expect(host.querySelector(".mv-timeline-period")!.textContent).toBe("2016");
    const tl = chart.timeline!()!;
    expect(tl.getState().periods).toEqual([2016, 2017, 2018, 2019]);
    chart.destroy();
    host.remove();
  });

  it("stepForward() sweeps the line to the next year", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: { easing: "linear", tweenMs: 400 } }, ticker);
    chart.timeline!()!.stepForward();
    ticker.tick(200);
    expect(clipWidth(host)).toBeCloseTo((T0 + T1) / 2, 0);
    ticker.tick(200);
    expect(clipWidth(host)).toBeCloseTo(T1, 0);
    expect(host.querySelector(".mv-timeline-period")!.textContent).toBe("2017");
    chart.destroy();
    host.remove();
  });

  it("the LAST year reveals the full width", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: { easing: "linear", tweenMs: 400 } }, ticker);
    chart.timeline!()!.seek(3);
    ticker.tick(400);
    expect(clipWidth(host)).toBe(T3);
    chart.destroy();
    host.remove();
  });

  it("play() advances year by year on the ticker and stops at the end", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      { timeline: { easing: "linear", speedMs: 800, tweenMs: 400 } },
      ticker
    );
    const tl = chart.timeline!()!;
    tl.play();
    ticker.tick(800);
    ticker.tick(400);
    expect(clipWidth(host)).toBeCloseTo(T1, 0);
    ticker.tick(400);
    ticker.tick(400);
    ticker.tick(400);
    ticker.tick(400);
    ticker.tick(400);
    expect(clipWidth(host)).toBe(T3);
    expect(tl.getState().playing).toBe(false);
    chart.destroy();
    host.remove();
  });

  it("interpolate: false and reduced motion jump-cut", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: { interpolate: false } }, ticker);
    chart.timeline!()!.stepForward();
    expect(clipWidth(host)).toBeCloseTo(T1, 0);
    chart.destroy();
    host.remove();

    const reduced: MotionPreference = { prefersReduced: () => true };
    const t2 = createManualTicker();
    const m2 = mount({ timeline: true }, t2, reduced);
    m2.chart.timeline!()!.stepForward();
    expect(clipWidth(m2.host)).toBeCloseTo(T1, 0);
    m2.chart.destroy();
    m2.host.remove();
  });

  it("tip labels ride the sweep when tipLabel is on", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      { timeline: { easing: "linear", tweenMs: 400, tipLabel: true } },
      ticker
    );
    const tips = () => Array.from(host.querySelectorAll("text.mv-progressive-tip"));
    expect(tips().length).toBe(2);
    chart.timeline!()!.stepForward();
    ticker.tick(400);
    const texts = tips().map(t => t.textContent);
    expect(texts).toContain("Alpha 20"); // Alpha's 2017 value
    chart.destroy();
    host.remove();
  });

  it("hover past the active year shows nothing, even while PAUSED", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      { timeline: true, renderer: "canvas", sharedTooltip: true },
      ticker
    );
    // Paused at the first year (reveal ~68px); hover far right.
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: 500, clientY: 150, bubbles: true }));
    const tooltip = host.querySelector<HTMLElement>(".tooltip")!;
    expect(tooltip.style.visibility).toBe("hidden");
    // Hover the revealed first column.
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: 62, clientY: 150, bubbles: true }));
    expect(tooltip.style.visibility).toBe("visible");
    chart.destroy();
    host.remove();
  });

  it("timeline wins over progressiveDraw when both are set", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      { timeline: true, progressiveDraw: { durationMs: 1000, easing: "linear" } },
      ticker
    );
    expect(clipWidth(host)).toBeCloseTo(T0, 3); // timeline position, not a pd sweep
    ticker.tick(500);
    expect(clipWidth(host)).toBeCloseTo(T0, 3); // no pd animation running
    chart.destroy();
    host.remove();
  });

  it("update() preserves the active year", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: { interpolate: false } }, ticker);
    chart.timeline!()!.stepForward();
    chart.update({
      dataSet: sample,
      width: WIDTH,
      height: 300,
      xAxisDataType: "date_annual",
      timeline: { interpolate: false },
    });
    expect(chart.timeline!()!.getState().index).toBe(1);
    expect(clipWidth(host)).toBeCloseTo(T1, 0);
    chart.destroy();
    host.remove();
  });

  it("destroy() mid-sweep is safe", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: { easing: "linear", tweenMs: 400 } }, ticker);
    chart.timeline!()!.stepForward();
    ticker.tick(100);
    chart.destroy();
    host.remove();
    expect(() => ticker.tick(2000)).not.toThrow();
  });
});
