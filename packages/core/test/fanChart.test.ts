import { describe, it, expect } from "vitest";
import { mountFanChart } from "../src";
import type { FanChartContext, FanChartProps } from "../src/types";

function host(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

const props: FanChartProps = {
  title: "Revenue",
  xAxisDataType: "number",
  dataSet: [
    {
      label: "A",
      series: [
        { date: 2018, value: 10, certainty: true },
        { date: 2019, value: 20, certainty: true },
        { date: 2020, value: 30, certainty: true },
        { date: 2021, value: 40, certainty: false },
        { date: 2022, value: 50, certainty: false },
      ],
      bands: [
        {
          level: 0.95,
          series: [
            { date: 2020, valueMin: 30, valueMax: 30, valueMedium: 30 },
            { date: 2021, valueMin: 35, valueMax: 45, valueMedium: 40 },
            { date: 2022, valueMin: 40, valueMax: 60, valueMedium: 50 },
          ],
        },
        {
          level: 0.5,
          series: [
            { date: 2020, valueMin: 30, valueMax: 30, valueMedium: 30 },
            { date: 2021, valueMin: 38, valueMax: 42, valueMedium: 40 },
            { date: 2022, valueMin: 46, valueMax: 54, valueMedium: 50 },
          ],
        },
      ],
    },
  ],
};

describe("FanChart", () => {
  it("renders nested bands + a line and exposes a fan-chart context", () => {
    const h = host();
    const chart = mountFanChart(h, props);

    // one path per band level
    const bands = h.querySelectorAll(".mv-fan-band");
    expect(bands.length).toBe(2);
    // bands carry the colour-contract attributes
    expect(bands[0].getAttribute("data-label-safe")).toBe("A");
    // narrower (50%) band is drawn more opaque than the wider (95%) band
    const op = (i: number) => Number((bands[i] as SVGElement).getAttribute("opacity"));
    expect(op(1)).toBeGreaterThan(op(0));

    const ctx = chart.getContext() as FanChartContext;
    expect(ctx.chartType).toBe("fan-chart");
    expect(ctx.series[0].historyCount).toBe(3);
    expect(ctx.series[0].forecastCount).toBe(2);
    expect(ctx.series[0].bandLevels).toEqual([0.5, 0.95]);
    expect(ctx.stats.forecastHorizon).toBe(2);
    expect(ctx.summary).toContain("Fan chart");
    expect(h.querySelector(".mv-a11y")!.getAttribute("aria-label")).toContain("Fan chart");

    chart.destroy();
  });

  it("widens the y-domain to include the bands", () => {
    const h = host();
    const chart = mountFanChart(h, props);
    const ctx = chart.getContext() as FanChartContext;
    // band max (60) must be within the y domain even though the line max is 50
    expect(ctx.yAxis.domain[1]).toBeGreaterThanOrEqual(60);
    chart.destroy();
  });

  it("shades the not-actual-data forecast region (forecastZone), opt-out with forecastZone:false", () => {
    const h = host();
    const chart = mountFanChart(h, props); // history solid (2018-2020) + forecast (2021-2022)
    expect(h.querySelector(".mv-annotation-zone")).toBeTruthy();
    chart.destroy();

    const h2 = host();
    const chart2 = mountFanChart(h2, { ...props, forecastZone: false });
    expect(h2.querySelector(".mv-annotation-zone")).toBeNull();
    chart2.destroy();
  });

  it("renders in canvas mode and exposes the same context", () => {
    const h = host();
    const chart = mountFanChart(h, { ...props, renderer: "canvas" });
    // canvas element is created (drawing no-ops in jsdom, but the layer + context exist)
    expect(h.querySelector("canvas.fan-chart-canvas")).toBeTruthy();
    const ctx = chart.getContext() as FanChartContext;
    expect(ctx.chartType).toBe("fan-chart");
    expect(ctx.series[0].forecastCount).toBe(2);
    chart.destroy();
  });
});

// Deterministic geometry so hover hit-testing is exact (no .nice() reshaping):
// number x in [0,5] → range [60,950]; value 10 in y-domain [0,20] → range [450,50].
// point date 3 → x = 60 + 890*0.6 = 594; value 10 → y = 450 - 400*0.5 = 250.
const hoverProps: FanChartProps = {
  xAxisDataType: "number",
  width: 1000,
  height: 500,
  yAxisDomain: [0, 20],
  dataSet: [
    {
      label: "Revenue",
      series: [0, 1, 2, 3, 4, 5].map((d) => ({ date: d, value: 10, certainty: d < 4 })),
      bands: [],
    },
  ],
};

describe("FanChart mouse interaction (canvas hit-testing)", () => {
  it("highlights the nearest series on canvas hover", () => {
    const highlights: string[][] = [];
    const h = host();
    const chart = mountFanChart(h, { ...hoverProps, renderer: "canvas", onHighlightItem: (l) => highlights.push(l) });
    h.dispatchEvent(new MouseEvent("mousemove", { clientX: 594, clientY: 250, bubbles: true }));
    expect(highlights.at(-1)).toEqual(["Revenue"]);
    chart.destroy();
  });

  it("clears the highlight when the cursor leaves the line", () => {
    const highlights: string[][] = [];
    const h = host();
    const chart = mountFanChart(h, { ...hoverProps, renderer: "canvas", onHighlightItem: (l) => highlights.push(l) });
    h.dispatchEvent(new MouseEvent("mousemove", { clientX: 594, clientY: 250, bubbles: true })); // on the line
    h.dispatchEvent(new MouseEvent("mousemove", { clientX: 594, clientY: 60, bubbles: true })); // far above
    expect(highlights.at(-1)).toEqual([]);
    chart.destroy();
  });

  it("does not hit-test in SVG mode (SVG uses per-path hover)", () => {
    const highlights: string[][] = [];
    const h = host();
    const chart = mountFanChart(h, { ...hoverProps, renderer: "svg", onHighlightItem: (l) => highlights.push(l) });
    h.dispatchEvent(new MouseEvent("mousemove", { clientX: 594, clientY: 250, bubbles: true }));
    expect(highlights).toHaveLength(0); // the host mousemove handler is a no-op in SVG mode
    chart.destroy();
  });
});
