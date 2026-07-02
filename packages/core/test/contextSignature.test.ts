import { describe, it, expect } from "vitest";
import { contextSignature } from "../src/context/signature";
import { buildScatterContext } from "../src/context/buildScatterContext";
import { mountScatterChart } from "../src/engine/scatterChart";
import type { ScatterChartContext, ScatterChartProps, ScatterDataPoint } from "../src/types";

// The naive JSON.stringify(context) signature serialized a11yTable.rows (one
// row per point) on every render - a multi-MB string at 50k points. The cheap
// signature must keep the exact change-detection semantics (any change flips
// it) while staying bounded in size.

const points = (n: number): ScatterDataPoint[] =>
  Array.from({ length: n }, (_, i) => ({
    label: `p${i}`,
    x: i % 100,
    y: (i * 7) % 100,
    d: (i % 9) + 1,
  }));

function ctxOf(pts: ScatterDataPoint[], title = "Sig demo"): ScatterChartContext {
  return buildScatterContext({
    title,
    renderer: "svg",
    xAxisDataType: "number",
    xAxisDomain: [0, 100],
    yAxisDomain: [0, 100],
    points: pts,
    colorsMapping: {},
  });
}

describe("contextSignature", () => {
  it("is identical for two identically-built contexts", () => {
    const a = contextSignature(ctxOf(points(500)));
    const b = contextSignature(ctxOf(points(500)));
    expect(a).toBe(b);
  });

  it("changes when a single a11y row cell changes (rows still guard the signature)", () => {
    const base = ctxOf(points(500));
    const tweaked = ctxOf(points(500));
    tweaked.a11yTable.rows[123] = [...tweaked.a11yTable.rows[123]];
    tweaked.a11yTable.rows[123][1] = 999;
    expect(contextSignature(tweaked)).not.toBe(contextSignature(base));
  });

  it("changes when the row count changes", () => {
    expect(contextSignature(ctxOf(points(500)))).not.toBe(contextSignature(ctxOf(points(499))));
  });

  it("changes when the summary changes", () => {
    const base = ctxOf(points(50));
    const tweaked = ctxOf(points(50));
    tweaked.summary = tweaked.summary + " (edited)";
    expect(contextSignature(tweaked)).not.toBe(contextSignature(base));
  });

  it("changes when legendData colour or disabled state changes", () => {
    const base = ctxOf(points(50));
    const recolored = ctxOf(points(50));
    recolored.legendData![7] = { ...recolored.legendData![7], color: "#123456" };
    expect(contextSignature(recolored)).not.toBe(contextSignature(base));

    const disabled = ctxOf(points(50));
    disabled.legendData![7] = { ...disabled.legendData![7], disabled: true };
    expect(contextSignature(disabled)).not.toBe(contextSignature(base));
  });

  it("changes when headers change", () => {
    const base = ctxOf(points(50));
    const tweaked = ctxOf(points(50));
    tweaked.a11yTable.headers = ["Label", "X", "Y", "Diameter"];
    expect(contextSignature(tweaked)).not.toBe(contextSignature(base));
  });

  it("stays bounded at 50k points - the whole point of the fix", () => {
    const big = ctxOf(points(50000));
    // The old approach: multi-MB string on EVERY render.
    expect(JSON.stringify(big).length).toBeGreaterThan(1_000_000);
    // The cheap signature: a few hundred bytes, rows/legend hashed not serialized.
    expect(contextSignature(big).length).toBeLessThan(5000);
  });
});

describe("scatter onChartDataProcessed gating (cheap signature keeps idempotency)", () => {
  const dataSet = points(200);

  function mount(extra: Partial<ScatterChartProps> = {}) {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountScatterChart(host, {
      dataSet,
      title: "Demo",
      width: 600,
      height: 300,
      xAxisDataType: "number",
      ...extra,
    });
    return { host, chart };
  }

  it("fires once per distinct context - unchanged update does not re-fire, changed data does", () => {
    let calls = 0;
    const onChartDataProcessed = () => {
      calls++;
    };
    const { host, chart } = mount({ onChartDataProcessed });
    expect(calls).toBe(1); // initial render
    chart.update({
      dataSet,
      title: "Demo",
      width: 600,
      height: 300,
      xAxisDataType: "number",
      onChartDataProcessed,
    });
    expect(calls).toBe(1); // identical context -> not re-emitted
    chart.update({
      dataSet: dataSet.slice(0, 150),
      title: "Demo",
      width: 600,
      height: 300,
      xAxisDataType: "number",
      onChartDataProcessed,
    });
    expect(calls).toBe(2); // changed data -> emitted again
    chart.destroy();
    host.remove();
  });
});
