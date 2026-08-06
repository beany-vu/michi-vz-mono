import { describe, it, expect } from "vitest";
import { buildScatterContext } from "../src/context/buildScatterContext";
import { buildBarBellContext } from "../src/context/buildBarBellContext";
import { buildAreaContext } from "../src/context/buildAreaContext";
import type { ScatterDataPoint } from "../src/types";

// The legend keep-disabled contract (VSB 1.5.6 / ComparableBar 1.12.2): a disabled
// label stays in legendData flagged `disabled: true`, in its ORIGINAL slot. Scatter,
// bar-bell and area derived legend labels from disabled-filtered data, so a clicked
// pill vanished and consumer fallbacks (thd LegendGeneral's union) re-appended it at
// the END — the "disabled pill jumps to the last slot" bug. Ribbon still lacks
// disabledItems threading entirely (known follow-up, no thd consumer).

const colorsMapping = { Kenya: "#111", Egypt: "#222", Ghana: "#333" };

describe("buildScatterContext legend keeps disabled labels", () => {
  const fullDataSet: ScatterDataPoint[] = [
    { label: "Kenya", code: "404", x: 2022, y: 40 },
    { label: "Kenya", code: "404", x: 2023, y: 50 },
    { label: "Egypt", code: "818", x: 2023, y: 30 },
    { label: "Ghana", code: "288", x: 2023, y: 20 },
  ];
  const base = {
    renderer: "svg" as const,
    xAxisDataType: "number" as const,
    xAxisDomain: [2022, 2023] as [number, number],
    yAxisDomain: [0, 100] as [number, number],
    colorsMapping,
  };

  it("keeps a disabled label flagged in its original slot, with its value on series", () => {
    const ctx = buildScatterContext({
      ...base,
      // Egypt disabled: the engine's points no longer contain it
      points: fullDataSet.filter((p) => p.label !== "Egypt"),
      fullDataSet,
      disabledItems: ["Egypt"],
    });

    expect(ctx.legendData?.map((i) => [i.label, i.disabled ?? false])).toEqual([
      ["Kenya", false],
      ["Egypt", true],
      ["Ghana", false],
    ]);
    // value survives for ranking consumers: Egypt's newest point from the full rows
    expect(ctx.series?.find((s) => s.label === "Egypt")).toEqual({
      label: "Egypt",
      code: "818",
      last: { x: 2023, y: 30 },
    });
    // Kenya's summary picks the max-x point
    expect(ctx.series?.find((s) => s.label === "Kenya")?.last).toEqual({ x: 2023, y: 50 });
  });

  it("does not resurrect a label that was rank/date-filtered out (not disabled)", () => {
    const ctx = buildScatterContext({
      ...base,
      // Ghana filtered out by ranking, NOT disabled
      points: fullDataSet.filter((p) => p.label === "Kenya" || p.label === "Egypt"),
      fullDataSet,
      disabledItems: [],
    });
    expect(ctx.legendData?.map((i) => i.label)).toEqual(["Kenya", "Egypt"]);
  });

  it("falls back to points-derived labels without fullDataSet", () => {
    const ctx = buildScatterContext({
      ...base,
      points: fullDataSet.filter((p) => p.label !== "Egypt"),
      disabledItems: ["Egypt"],
    });
    expect(ctx.legendData?.map((i) => i.label)).toEqual(["Kenya", "Ghana"]);
  });
});

describe("buildBarBellContext legend keeps disabled keys", () => {
  it("legendKeys (pre-disable) keep the flagged pill in its slot", () => {
    const ctx = buildBarBellContext({
      renderer: "svg",
      xAxisDomain: [0, 100],
      dataSet: [{ date: "2023", Kenya: 10, Egypt: 20, Ghana: 5 }],
      activeKeys: ["Kenya", "Ghana"],
      legendKeys: ["Kenya", "Egypt", "Ghana"],
      dates: ["2023"],
      colorsMapping,
      disabledItems: ["Egypt"],
    });
    expect(ctx.legendData?.map((i) => [i.label, i.disabled ?? false])).toEqual([
      ["Kenya", false],
      ["Egypt", true],
      ["Ghana", false],
    ]);
  });
});

describe("buildAreaContext legend keeps disabled keys", () => {
  it("legendKeys (pre-disable) keep the flagged pill in its slot", () => {
    const ctx = buildAreaContext({
      title: undefined,
      renderer: "svg",
      xAxisDataType: "number",
      xAxisDomain: [2022, 2023],
      yAxisDomain: [0, 100],
      series: [
        { date: 2022, Kenya: 10, Egypt: 20, Ghana: 5 },
        { date: 2023, Kenya: 12, Egypt: 22, Ghana: 6 },
      ],
      activeKeys: ["Kenya", "Ghana"],
      legendKeys: ["Kenya", "Egypt", "Ghana"],
      colorsMapping,
      disabledItems: ["Egypt"],
    });
    expect(ctx.legendData?.map((i) => [i.label, i.disabled ?? false])).toEqual([
      ["Kenya", false],
      ["Egypt", true],
      ["Ghana", false],
    ]);
  });
});
