import { describe, it, expect } from "vitest";
import { buildLegendData } from "../src/context/legend";
import { sanitizeForClassName } from "../src/math/sanitize";
import { mountLineChart } from "../src/engine/lineChart";
import type { LineDataItem } from "../src/types";

describe("buildLegendData", () => {
  it("emits label/order/disabled and dataLabelSafe = sanitizeForClassName(label)", () => {
    const out = buildLegendData({
      labels: ["Air Transport-2021", "Beta"],
      disabledItems: ["Beta"],
    });
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({
      label: "Air Transport-2021",
      order: 0,
      disabled: false,
      dataLabelSafe: "Air_Transport_2021",
    });
    expect(out[1]).toMatchObject({
      label: "Beta",
      order: 1,
      disabled: true,
      dataLabelSafe: sanitizeForClassName("Beta"),
    });
  });

  it("prefers colorsMapping but ignores the 'transparent' skip-mode placeholder", () => {
    const out = buildLegendData({
      labels: ["A", "B"],
      colorsMapping: { A: "#123456", B: "transparent" },
    });
    expect(out[0].color).toBe("#123456");
    expect(out[1].color).not.toBe("transparent"); // palette fallback
  });

  it("dedupes labels, preserving first-appearance order", () => {
    const out = buildLegendData({ labels: ["A", "A", "B"] });
    expect(out.map((i) => i.label)).toEqual(["A", "B"]);
  });
});

describe("LineChart context.legendData (jsdom)", () => {
  const annual = (vals: number[], start = 2016) =>
    vals.map((value, i) => ({ date: start + i, value, certainty: true }));
  const sample: LineDataItem[] = [
    { label: "Alpha One", color: "#f00", series: annual([10, 20, 15]) },
    { label: "Beta", color: "#0f0", series: annual([5, 8, 12]) },
  ];

  it("exposes legendData whose dataLabelSafe matches the rendered marks", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountLineChart(host, {
      dataSet: sample,
      width: 600,
      height: 300,
      xAxisDataType: "date_annual",
      skipColorMappingDispatch: true,
    });
    const ctx = chart.getContext();
    expect(ctx?.legendData?.map((i) => i.label)).toEqual(["Alpha One", "Beta"]);
    expect(ctx?.legendData?.[0].dataLabelSafe).toBe(sanitizeForClassName("Alpha One"));

    const lineSafes = Array.from(host.querySelectorAll("path.line")).map((l) =>
      l.getAttribute("data-label-safe"),
    );
    const legendSafes = ctx?.legendData?.map((i) => i.dataLabelSafe) ?? [];
    for (const s of lineSafes) expect(legendSafes).toContain(s);

    chart.destroy();
    host.remove();
  });

  it("flags disabled series in legendData but keeps them in the list (no filter)", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountLineChart(host, {
      dataSet: sample,
      width: 600,
      height: 300,
      xAxisDataType: "date_annual",
      disabledItems: ["Beta"],
      skipColorMappingDispatch: true,
    });
    const ctx = chart.getContext();
    const beta = ctx?.legendData?.find((i) => i.label === "Beta");
    expect(beta?.disabled).toBe(true);
    chart.destroy();
    host.remove();
  });
});
