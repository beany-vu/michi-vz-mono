import { describe, it, expect, beforeEach } from "vitest";
import { mountLineChart, type LineChartProps, type LineChartContext } from "@michi-vz/core";
import { detectAnomalies, anomaly } from "../src/anomaly";

describe("detectAnomalies — zscore", () => {
  it("flags the spike at index 4 in [10,11,9,10,50,11,10]", () => {
    // population std here is ~13.95 so |z| for 50 is ~2.45 — above 2, below 3.
    const res = detectAnomalies([10, 11, 9, 10, 50, 11, 10], { method: "zscore", threshold: 2 });
    expect(res.method).toBe("zscore");
    expect(res.threshold).toBe(2);
    expect(res.anomalies).toHaveLength(1);
    expect(res.anomalies[0].index).toBe(4);
    expect(res.anomalies[0].value).toBe(50);
    expect(res.anomalies[0].kind).toBe("high");
    expect(res.anomalies[0].score).toBeCloseTo(2.45, 2);
  });

  it("uses a default threshold of 3 (the mild spike is NOT flagged)", () => {
    const res = detectAnomalies([10, 11, 9, 10, 50, 11, 10]);
    expect(res.threshold).toBe(3);
    expect(res.anomalies).toHaveLength(0); // |z|≈2.45 < 3
  });

  it("flags a dominant spike under the default threshold when the baseline is tight", () => {
    const baseline = Array.from({ length: 20 }, () => 10);
    baseline[10] = 50; // |z|≈4.36 with this tight cluster
    const res = detectAnomalies(baseline);
    expect(res.anomalies).toHaveLength(1);
    expect(res.anomalies[0].index).toBe(10);
    expect(res.anomalies[0].kind).toBe("high");
    expect(res.anomalies[0].score).toBeCloseTo(4.36, 2);
  });

  it("flags a low outlier with kind 'low'", () => {
    const vals = Array.from({ length: 20 }, () => 100);
    vals[5] = 10;
    const res = detectAnomalies(vals);
    expect(res.anomalies).toHaveLength(1);
    expect(res.anomalies[0].index).toBe(5);
    expect(res.anomalies[0].kind).toBe("low");
  });

  it("flags nothing for a perfectly clean (constant) series — std is 0", () => {
    const res = detectAnomalies([5, 5, 5, 5, 5]);
    expect(res.anomalies).toHaveLength(0);
  });

  it("flags nothing for a smooth low-variance series", () => {
    const res = detectAnomalies([10, 11, 12, 11, 10, 11, 12]);
    expect(res.anomalies).toHaveLength(0);
  });

  it("is deterministic (same input → same output)", () => {
    const a = detectAnomalies([3, 1, 4, 1, 5, 90, 2, 6], { threshold: 2 });
    const b = detectAnomalies([3, 1, 4, 1, 5, 90, 2, 6], { threshold: 2 });
    expect(a).toEqual(b);
  });
});

describe("detectAnomalies — iqr", () => {
  it("flags the high outlier outside Tukey's fences", () => {
    // sorted [1..8,100]: Q1=3, Q3=7, IQR=4, high fence = 7 + 1.5*4 = 13
    const res = detectAnomalies([1, 2, 3, 4, 5, 6, 7, 8, 100], { method: "iqr" });
    expect(res.method).toBe("iqr");
    expect(res.threshold).toBe(1.5);
    expect(res.anomalies).toHaveLength(1);
    expect(res.anomalies[0].index).toBe(8);
    expect(res.anomalies[0].value).toBe(100);
    expect(res.anomalies[0].kind).toBe("high");
    // overshoot / IQR = (100 - 13) / 4 = 21.75
    expect(res.anomalies[0].score).toBeCloseTo(21.75, 2);
  });

  it("flags a low outlier below the lower fence", () => {
    // sorted [-50,1..8]: Q1=2, Q3=6, IQR=4, low fence = 2 - 1.5*4 = -4
    const res = detectAnomalies([1, 2, 3, 4, 5, 6, 7, 8, -50], { method: "iqr" });
    expect(res.anomalies).toHaveLength(1);
    expect(res.anomalies[0].index).toBe(8);
    expect(res.anomalies[0].kind).toBe("low");
  });

  it("respects a custom k (larger k → fewer flags)", () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 100];
    expect(detectAnomalies(data, { method: "iqr", threshold: 1.5 }).anomalies).toHaveLength(1);
    expect(detectAnomalies(data, { method: "iqr", threshold: 50 }).anomalies).toHaveLength(0);
  });

  it("flags nothing for a uniform spread within the fences", () => {
    const res = detectAnomalies([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], { method: "iqr" });
    expect(res.anomalies).toHaveLength(0);
  });
});

describe("detectAnomalies — forecast", () => {
  it("flags a level break the one-step-ahead band cannot absorb", () => {
    // a flat ramp that suddenly jumps; the Holt band is tight before the jump.
    const res = detectAnomalies([10, 11, 12, 13, 14, 15, 200, 17], { method: "forecast" });
    expect(res.method).toBe("forecast");
    expect(res.threshold).toBe(0.95);
    // only the 200 (index 6) breaks the one-step-ahead band
    expect(res.anomalies).toHaveLength(1);
    const flaggedHigh = res.anomalies[0];
    expect(flaggedHigh.index).toBe(6);
    expect(flaggedHigh.kind).toBe("high");
    expect(flaggedHigh.score).toBeGreaterThan(1); // far outside the band (se→0 lead-in)
  });

  it("flags nothing on a clean linear ramp (forecast tracks it exactly)", () => {
    const res = detectAnomalies([10, 20, 30, 40, 50, 60, 70, 80], { method: "forecast" });
    expect(res.anomalies).toHaveLength(0);
  });

  it("is deterministic", () => {
    const data = [10, 11, 12, 13, 14, 15, 200, 17];
    expect(detectAnomalies(data, { method: "forecast" })).toEqual(
      detectAnomalies(data, { method: "forecast" })
    );
  });
});

// ---- plugin integration ----

function host(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

const spikeProps: LineChartProps = {
  title: "Sensor",
  xAxisDataType: "number",
  dataSet: [
    {
      label: "A",
      series: [
        { date: 2014, value: 10, certainty: true },
        { date: 2015, value: 11, certainty: true },
        { date: 2016, value: 9, certainty: true },
        { date: 2017, value: 10, certainty: true },
        { date: 2018, value: 50, certainty: true },
        { date: 2019, value: 11, certainty: true },
        { date: 2020, value: 10, certainty: true },
      ],
    },
  ],
};

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("anomaly plugin (engine integration)", () => {
  it("draws a point marker at the anomaly and enriches the summary", () => {
    const h = host();
    const chart = mountLineChart(h, spikeProps, {
      plugins: [anomaly({ method: "zscore", threshold: 2 })],
    });
    const ctx = chart.getContext() as LineChartContext;

    // the spike year (2018) is annotated as a point on the SVG layer
    expect(h.querySelector(".mv-annotation-point")).toBeTruthy();

    // narration mentions the anomaly (flows to a11y mirror + event)
    expect(ctx.summary).toContain("Anomalies (zscore):");
    expect(ctx.summary).toContain("1 anomaly detected");
    expect(ctx.summary).toContain("1 in A");
    chart.destroy();
  });

  it("does NOT mutate the data (point count is unchanged)", () => {
    const chart = mountLineChart(host(), spikeProps, {
      plugins: [anomaly({ threshold: 2 })],
    });
    const ctx = chart.getContext() as LineChartContext;
    expect(ctx.series[0].pointCount).toBe(7); // same as input — detection only
    chart.destroy();
  });

  it("is a no-op when no plugin is registered", () => {
    const chart = mountLineChart(host(), spikeProps);
    const ctx = chart.getContext() as LineChartContext;
    expect(ctx.summary).not.toContain("Anomalies");
    chart.destroy();
  });

  it("respects the target filter (other series are ignored)", () => {
    const props: LineChartProps = {
      xAxisDataType: "number",
      dataSet: [
        spikeProps.dataSet[0],
        {
          label: "B",
          series: [
            { date: 2014, value: 1, certainty: true },
            { date: 2015, value: 2, certainty: true },
            { date: 2016, value: 1, certainty: true },
            { date: 2017, value: 2, certainty: true },
          ],
        },
      ],
    };
    const chart = mountLineChart(host(), props, {
      plugins: [anomaly({ threshold: 2, target: "A" })],
    });
    const ctx = chart.getContext() as LineChartContext;
    expect(ctx.summary).toContain("1 in A");
    expect(ctx.summary).not.toContain("in B");
    chart.destroy();
  });

  it("adds no annotations / summary when there are no anomalies", () => {
    const cleanProps: LineChartProps = {
      xAxisDataType: "number",
      dataSet: [
        {
          label: "A",
          series: [
            { date: 2014, value: 10, certainty: true },
            { date: 2015, value: 11, certainty: true },
            { date: 2016, value: 12, certainty: true },
            { date: 2017, value: 11, certainty: true },
            { date: 2018, value: 10, certainty: true },
          ],
        },
      ],
    };
    const h = host();
    const chart = mountLineChart(h, cleanProps, { plugins: [anomaly()] });
    const ctx = chart.getContext() as LineChartContext;
    expect(h.querySelector(".mv-annotation-point")).toBeNull();
    expect(ctx.summary).not.toContain("Anomalies");
    chart.destroy();
  });
});
