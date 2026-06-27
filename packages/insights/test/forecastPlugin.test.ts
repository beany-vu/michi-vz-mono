import { describe, it, expect, beforeEach } from "vitest";
import { mountLineChart, type LineChartProps, type LineChartContext } from "@michi-vz/core";
import { forecast } from "../src/forecast";

function host(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

const baseProps: LineChartProps = {
  title: "Revenue",
  xAxisDataType: "number",
  dataSet: [
    {
      label: "A",
      series: [
        { date: 2018, value: 10, certainty: true },
        { date: 2019, value: 20, certainty: true },
        { date: 2020, value: 30, certainty: true },
        { date: 2021, value: 40, certainty: true },
      ],
    },
  ],
};

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("forecast plugin (engine integration)", () => {
  it("appends a dashed forecast tail and enriches the summary", () => {
    const chart = mountLineChart(host(), baseProps, {
      plugins: [forecast({ method: "linear", horizon: 2 })],
    });
    const ctx = chart.getContext() as LineChartContext;

    // 4 real points + 2 forecast points
    expect(ctx.series[0].pointCount).toBe(6);
    // last forecast value follows the +10/yr ramp → 50, 60
    expect(ctx.series[0].last?.y).toBeCloseTo(60, 6);
    // the predicted segment is uncertain (dashed)
    expect(ctx.series[0].gaps).toBeGreaterThanOrEqual(2);
    // narration mentions the forecast (flows to a11y mirror + event)
    expect(ctx.summary).toContain("Forecast:");
    expect(ctx.summary).toContain("projected to 60");
    chart.destroy();
  });

  it("is a no-op when no plugin is registered", () => {
    const chart = mountLineChart(host(), baseProps);
    const ctx = chart.getContext() as LineChartContext;
    expect(ctx.series[0].pointCount).toBe(4);
    expect(ctx.summary).not.toContain("Forecast:");
    chart.destroy();
  });

  it("can be added after mount via use()", () => {
    const chart = mountLineChart(host(), baseProps);
    expect((chart.getContext() as LineChartContext).series[0].pointCount).toBe(4);
    chart.use?.(forecast({ method: "linear", horizon: 3 }));
    expect((chart.getContext() as LineChartContext).series[0].pointCount).toBe(7);
    chart.destroy();
  });

  it("leaves non-numeric x-axis series untouched (MVP limitation)", () => {
    const chart = mountLineChart(host(), {
      dataSet: [
        {
          label: "B",
          series: [
            { date: "Jan", value: 1, certainty: true },
            { date: "Feb", value: 2, certainty: true },
          ],
        },
      ],
    }, { plugins: [forecast({ horizon: 3 })] });
    expect((chart.getContext() as LineChartContext).series[0].pointCount).toBe(2);
    chart.destroy();
  });

  it("draws a threshold line + fall-point marker on the SVG layer (annotate hook)", () => {
    const h = host();
    const chart = mountLineChart(h, baseProps, {
      plugins: [forecast({ method: "linear", horizon: 4, threshold: { value: 65, label: "Cap" } })],
    });
    expect(h.querySelector(".mv-annotation-line")).toBeTruthy();
    expect(h.querySelector(".mv-annotation-point")).toBeTruthy();
    expect((chart.getContext() as LineChartContext).summary).toContain("crosses Cap around");
    chart.destroy();
  });

  it("shades the forecast region with a zone rect (even without a threshold)", () => {
    const h = host();
    const chart = mountLineChart(h, baseProps, { plugins: [forecast({ method: "linear", horizon: 3 })] });
    const zone = h.querySelector(".mv-annotation-zone");
    expect(zone).toBeTruthy();
    // the zone has positive width (spans the predicted x-range)
    expect(Number(zone!.getAttribute("width"))).toBeGreaterThan(0);
    chart.destroy();
  });
});
