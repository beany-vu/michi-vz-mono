import { describe, it, expect, beforeEach } from "vitest";
import { mountScatterChart } from "../src/engine/scatterChart";
import { mountBubbleChart } from "../src/engine/bubbleChart";
import { mountTreemapChart } from "../src/engine/treemapChart";
import { mountLineChart } from "../src/engine/lineChart";
import { enableDevtools, reportDevtoolsHit, type DevtoolsHitEvent } from "../src/devtools/hook";
import type { ScatterChartProps, ScatterDataPoint } from "../src/types";

interface G {
  __MICHI_VZ_DEVTOOLS__?: boolean;
  __MICHI_VZ_DEVTOOLS_HOOK__?: unknown;
}
const g = globalThis as unknown as G;

const scatterData: ScatterDataPoint[] = [
  { label: "Point A", x: 1, y: 2, d: 5 },
  { label: "Beta", x: 3, y: 6, d: 10 },
  { label: "Gamma", x: 5, y: 10, d: 2 },
  { label: "Delta", x: 7, y: 14, d: 8 },
];

function mountScatter(extra: Partial<ScatterChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountScatterChart(host, {
    dataSet: scatterData,
    width: 600,
    height: 300,
    xAxisDataType: "number",
    ...extra,
  });
  return { host, chart };
}

beforeEach(() => {
  g.__MICHI_VZ_DEVTOOLS__ = undefined;
  g.__MICHI_VZ_DEVTOOLS_HOOK__ = undefined;
  document.body.innerHTML = "";
});

describe("devtools hit channel (canvas hit-test instrumentation)", () => {
  it("scatter canvas: a mousemove over a point reports a hit with the resolved label", async () => {
    // Read the point's pixel coords from an SVG mount (same scales as canvas).
    const svgMount = mountScatter({ renderer: "svg" });
    const dot = Array.from(
      svgMount.host.querySelectorAll<SVGCircleElement>("circle.scatter-point"),
    ).find((c) => c.getAttribute("data-label") === "Point A")!;
    const cx = Number(dot.getAttribute("cx"));
    const cy = Number(dot.getAttribute("cy"));
    svgMount.chart.destroy();
    svgMount.host.remove();

    const hook = enableDevtools();
    const events: DevtoolsHitEvent[] = [];
    const unsub = hook.subscribeHits((e) => events.push(e));

    const { host, chart } = mountScatter({ renderer: "canvas" });
    // jsdom rects are all-zero, so clientX/clientY map straight to model coords.
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: cx, clientY: cy, bubbles: true }));
    expect(events.length).toBeGreaterThan(0);
    const hit = events[events.length - 1];
    expect(hit.host).toBe(host);
    expect(hit.label).toBe("Point A");
    expect(hit.x).toBe(cx);
    expect(hit.y).toBe(cy);

    // A miss (far corner) reports label null - the log keeps flowing. This second
    // move lands in the same frame as the first, so the scatter hover throttle
    // defers it to one trailing rAF pass; flush that frame before asserting.
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: 599, clientY: 1, bubbles: true }));
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    expect(events[events.length - 1].label).toBeNull();

    unsub();
    chart.destroy();
    host.remove();
  });

  it("bubble canvas: mousemoves flow into the hit channel", () => {
    const hook = enableDevtools();
    const events: DevtoolsHitEvent[] = [];
    hook.subscribeHits((e) => events.push(e));
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountBubbleChart(host, {
      dataSet: [
        { label: "A", value: 40 },
        { label: "B", value: 60 },
      ],
      width: 400,
      height: 300,
      renderer: "canvas",
    });
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: 5, clientY: 5, bubbles: true }));
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].host).toBe(host);
    chart.destroy();
    host.remove();
  });

  it("treemap canvas: mousemoves flow into the hit channel", () => {
    const hook = enableDevtools();
    const events: DevtoolsHitEvent[] = [];
    hook.subscribeHits((e) => events.push(e));
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountTreemapChart(host, {
      dataSet: [
        { label: "Alpha", value: 70 },
        { label: "Beta", value: 30 },
      ],
      width: 400,
      height: 300,
      renderer: "canvas",
    });
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: 20, clientY: 50, bubbles: true }));
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].host).toBe(host);
    chart.destroy();
    host.remove();
  });

  it("line canvas: mousemoves flow into the hit channel", () => {
    const hook = enableDevtools();
    const events: DevtoolsHitEvent[] = [];
    hook.subscribeHits((e) => events.push(e));
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountLineChart(host, {
      dataSet: [
        {
          label: "Revenue",
          series: [
            { date: 2020, value: 10, certainty: true },
            { date: 2021, value: 20, certainty: true },
          ],
        },
      ],
      width: 400,
      height: 300,
      xAxisDataType: "date_annual",
      renderer: "canvas",
    });
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: 200, clientY: 150, bubbles: true }));
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].host).toBe(host);
    chart.destroy();
    host.remove();
  });

  it("reportDevtoolsHit is a safe no-op when devtools is disabled or the hook is old", () => {
    const el = document.createElement("div");
    // disabled: no hook at all
    expect(() => reportDevtoolsHit(el, 1, 2, null)).not.toThrow();
    // version skew: an old hook without reportHit installed by an older panel
    g.__MICHI_VZ_DEVTOOLS_HOOK__ = { isMichiVzDevtools: true, charts: new Map() };
    expect(() => reportDevtoolsHit(el, 1, 2, "x")).not.toThrow();
  });
});

describe("devtools timing channel (attachDevtools wraps update)", () => {
  it("update() reports a render duration for the chart id", () => {
    const hook = enableDevtools();
    const timings: Array<{ id: string; ms: number }> = [];
    hook.subscribeTimings((id, ms) => timings.push({ id, ms }));

    const host = document.createElement("div");
    document.body.appendChild(host);
    const props = {
      dataSet: [
        {
          label: "Revenue",
          series: [
            { date: 2020, value: 1, certainty: true },
            { date: 2021, value: 2, certainty: true },
          ],
        },
      ],
      width: 300,
      height: 200,
      xAxisDataType: "date_annual" as const,
    };
    const chart = mountLineChart(host, props);
    chart.update({ ...props, width: 320 });

    expect(timings.length).toBe(1);
    expect(timings[0].id).toMatch(/^line-chart-/);
    expect(timings[0].ms).toBeGreaterThanOrEqual(0);

    chart.destroy();
    host.remove();
  });

  it("a panel edit through the hook entry's setProps is timed too", () => {
    const hook = enableDevtools();
    const timings: Array<{ id: string; ms: number }> = [];
    hook.subscribeTimings((id, ms) => timings.push({ id, ms }));

    const host = document.createElement("div");
    document.body.appendChild(host);
    const props = {
      dataSet: [
        {
          label: "Revenue",
          series: [
            { date: 2020, value: 1, certainty: true },
            { date: 2021, value: 2, certainty: true },
          ],
        },
      ],
      width: 300,
      height: 200,
      xAxisDataType: "date_annual" as const,
    };
    const chart = mountLineChart(host, props);
    const entry = [...hook.charts.values()][0];
    entry.setProps({ width: 340 });

    expect(timings.length).toBe(1);
    expect(timings[0].ms).toBeGreaterThanOrEqual(0);

    chart.destroy();
    host.remove();
  });
});
