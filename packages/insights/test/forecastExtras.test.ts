import { describe, it, expect } from "vitest";
import { forecast, forecastFan, forecastFanBands } from "../src/forecast";
import type { DataPoint, LineChartProps } from "@michi-vz/core";

const series: DataPoint[] = [
  { date: 2018, value: 10, certainty: true },
  { date: 2019, value: 20, certainty: true },
  { date: 2020, value: 30, certainty: true },
  { date: 2021, value: 40, certainty: true },
];
const props: LineChartProps = { xAxisDataType: "number", dataSet: [{ label: "A", series }] };
// minimal PluginContext stub — the forecast hooks only read nothing off it here
const pc = { chartType: "line-chart", getProps: () => props, getContext: () => null, setProps: () => {} } as never;
const lineCtx = (summary = "Base.") => ({ chartType: "line-chart", summary }) as never;

describe("forecast extras", () => {
  it("scenarios add forked dashed series above/below the base", () => {
    const p = forecast({
      method: "linear",
      horizon: 2,
      scenarios: [
        { name: "optimistic", growth: 0.1 },
        { name: "pessimistic", growth: -0.1 },
      ],
    });
    const out = p.transformData!(props, pc);
    const labels = out.dataSet.map((d) => d.label);
    expect(labels).toContain("A (optimistic)");
    expect(labels).toContain("A (pessimistic)");
    const last = (label: string) => {
      const s = out.dataSet.find((d) => d.label === label)!.series;
      return s[s.length - 1].value;
    };
    expect(last("A (optimistic)")).toBeGreaterThan(last("A"));
    expect(last("A (pessimistic)")).toBeLessThan(last("A"));
  });

  it("trendline adds a 2-point solid overlay", () => {
    const out = forecast({ method: "linear", horizon: 2, trendline: true }).transformData!(props, pc);
    const trend = out.dataSet.find((d) => d.label === "A (trend)");
    expect(trend).toBeTruthy();
    expect(trend!.series).toHaveLength(2);
    expect(trend!.series.every((d) => d.certainty === true)).toBe(true);
  });

  it("threshold emits an hline + a fall-point and a breach sentence", () => {
    // linear: 40 → 50,60,70,80; threshold 65 is crossed between x=2023 and x=2024
    const p = forecast({ method: "linear", horizon: 4, threshold: { value: 65, label: "Cap" } });
    p.transformData!(props, pc); // populate internal results
    const anns = p.annotate!(lineCtx(), pc);
    expect(anns.some((a) => a.type === "hline" && a.value === 65)).toBe(true);
    const point = anns.find((a) => a.type === "point");
    expect(point).toBeTruthy();
    expect(Number(point!.at)).toBeCloseTo(2023.5, 6);
    const enriched = p.enrichContext!(lineCtx("Base."), pc) as { summary: string };
    expect(enriched.summary).toContain("crosses Cap around");
  });

  it("forecastFanBands returns nested RangeChart bands (no new chart type)", () => {
    const noisy: DataPoint[] = [10, 22, 28, 41, 48, 61, 70, 79].map((v, i) => ({
      date: 2014 + i,
      value: v,
      certainty: true,
    }));
    const bands = forecastFanBands(noisy, { method: "holt-winters", horizon: 3, levels: [0.5, 0.8], level: 0.95 });
    expect(bands).toHaveLength(3);
    expect(bands[0].label).toContain("95%"); // widest first
    expect(bands[2].label).toContain("50%");
    for (const b of bands) {
      for (const pnt of b.series) {
        expect(pnt.valueMin).toBeLessThanOrEqual(pnt.valueMedium!);
        expect(pnt.valueMax).toBeGreaterThanOrEqual(pnt.valueMedium!);
        expect(pnt.certainty).toBe(false);
      }
    }
    // the 95% band is wider than the 50% band at the same step
    const w = (b: (typeof bands)[number], h: number) => b.series[h].valueMax - b.series[h].valueMin;
    expect(w(bands[0], 2)).toBeGreaterThan(w(bands[2], 2));
  });

  it("fires onThresholdBreach (debounced) when the forecast crosses the threshold", () => {
    const breaches: Array<{ label: string; value: number; at: number }> = [];
    const p = forecast({
      method: "linear",
      horizon: 4,
      threshold: { value: 65 },
      onThresholdBreach: (b) => breaches.push(b),
    });
    p.transformData!(props, pc);
    expect(breaches).toHaveLength(1);
    expect(breaches[0].at).toBeCloseTo(2023.5, 6);
    // same data → no re-fire (debounced on the breach set)
    p.transformData!(props, pc);
    expect(breaches).toHaveLength(1);
  });

  it("forecastFan builds renderable FanDataItem (history+median line, anchored bands)", () => {
    const history: DataPoint[] = [10, 20, 30, 40].map((v, i) => ({
      date: 2018 + i,
      value: v,
      certainty: true,
    }));
    const fan = forecastFan(history, { method: "linear", horizon: 3, levels: [0.5, 0.8], level: 0.95 }, "A");
    expect(fan.label).toBe("A");
    // 4 history + 3 median
    expect(fan.series).toHaveLength(7);
    expect(fan.series.slice(4).every((d) => d.certainty === false)).toBe(true);
    // 3 levels → 3 bands, each anchored at the last actual (2021) + 3 forecast points
    expect(fan.bands).toHaveLength(3);
    for (const b of fan.bands) {
      expect(b.series).toHaveLength(4);
      expect(b.series[0].date).toBe(2021);
      expect(b.series[0].valueMin).toBe(b.series[0].valueMax); // zero-width anchor
    }
  });
});
