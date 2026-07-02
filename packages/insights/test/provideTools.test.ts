import { describe, it, expect, beforeEach } from "vitest";
import { mountLineChart, type LineChartProps } from "@michi-vz/core";
import { narrate } from "../src/narrate";
import { anomaly } from "../src/anomaly";
import { forecast } from "../src/forecast";

// The devtools Insights tab (and any agent host) discovers these via getTools();
// each insights plugin must surface its capability as a named AgentTool.

const props: LineChartProps = {
  dataSet: [
    {
      label: "Revenue",
      series: [
        { date: 2018, value: 10, certainty: true },
        { date: 2019, value: 11, certainty: true },
        { date: 2020, value: 9, certainty: true },
        { date: 2021, value: 10, certainty: true },
        { date: 2022, value: 50, certainty: true },
        { date: 2023, value: 11, certainty: true },
        { date: 2024, value: 10, certainty: true },
      ],
    },
  ],
  width: 400,
  height: 200,
  xAxisDataType: "date_annual",
};

function mountWith(plugin: Parameters<NonNullable<ReturnType<typeof mountLineChart>["use"]>>[0]) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountLineChart(host, props);
  chart.use!(plugin);
  return chart;
}

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("narrate() provideTools", () => {
  it("exposes a 'narrate' tool that returns prose for the live context", async () => {
    const chart = mountWith(narrate());
    const tool = chart.getTools!().find((t) => t.name === "narrate");
    expect(tool).toBeDefined();
    const text = (await tool!.run({})) as string;
    expect(typeof text).toBe("string");
    expect(text.length).toBeGreaterThan(10);
    expect(text).toContain("Revenue");
    chart.destroy();
  });
});

describe("anomaly() provideTools", () => {
  it("exposes an 'anomaly' tool that explains its method and lists flagged points per series", () => {
    const chart = mountWith(anomaly({ method: "zscore", threshold: 2 }));
    const tool = chart.getTools!().find((t) => t.name === "anomaly");
    expect(tool).toBeDefined();
    const out = tool!.run({}) as {
      method: string;
      threshold: number;
      explanation: string;
      series: Array<{
        label: string;
        anomalies: Array<{ index: number; kind: string; date?: unknown; value?: number }>;
      }>;
    };
    expect(out.method).toBe("zscore");
    expect(out.threshold).toBe(2);
    expect(out.explanation).toContain("standard deviation");
    expect(out.series).toHaveLength(1);
    expect(out.series[0].label).toBe("Revenue");
    expect(out.series[0].anomalies).toHaveLength(1);
    expect(out.series[0].anomalies[0].index).toBe(4);
    expect(out.series[0].anomalies[0].kind).toBe("high");
    expect(out.series[0].anomalies[0].value).toBe(50);
    chart.destroy();
  });

  it("returns an empty series list (still with the explanation) when nothing is flagged", () => {
    const chart = mountWith(anomaly({ method: "zscore", threshold: 10 }));
    const tool = chart.getTools!().find((t) => t.name === "anomaly");
    const out = tool!.run({}) as { method: string; explanation: string; series: unknown[] };
    expect(out.series).toEqual([]);
    expect(out.method).toBe("zscore");
    expect(out.explanation).toContain("standard deviation");
    chart.destroy();
  });

  it("the iqr explanation names Tukey's fences", () => {
    const chart = mountWith(anomaly({ method: "iqr" }));
    const tool = chart.getTools!().find((t) => t.name === "anomaly");
    const out = tool!.run({}) as { threshold: number; explanation: string };
    expect(out.threshold).toBe(1.5);
    expect(out.explanation).toContain("IQR");
    chart.destroy();
  });
});

describe("forecast() provideTools", () => {
  it("exposes a 'forecast' tool that returns predictions per series", () => {
    const chart = mountWith(forecast({ horizon: 2 }));
    const tool = chart.getTools!().find((t) => t.name === "forecast");
    expect(tool).toBeDefined();
    const out = tool!.run({}) as Array<{
      label: string;
      method: string;
      horizon: number;
      predictions: Array<{ date: number; value: number }>;
    }>;
    expect(out).toHaveLength(1);
    expect(out[0].label).toBe("Revenue");
    expect(out[0].horizon).toBe(2);
    expect(out[0].predictions).toHaveLength(2);
    expect(out[0].predictions[0].date).toBe(2025);
    expect(out[0].predictions[1].date).toBe(2026);
    chart.destroy();
  });
});
