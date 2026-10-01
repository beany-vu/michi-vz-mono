// setMichiVzDefaults: one call per app sets the look every chart starts from
// (palette, font, bar and tile corners, tooltip), like Highcharts.setOptions.
// A prop on a chart always wins over the defaults; the defaults win over the
// built-in look. Everything here is resolved BEFORE any renderer draws, so svg,
// canvas and webgpu read the same values.
import { describe, it, expect, afterEach } from "vitest";
import {
  getMichiVzDefaults,
  resetMichiVzDefaults,
  setMichiVzDefaults,
} from "../src/theme/defaults";
import { DEFAULT_COLORS, defaultPalette } from "../src/theme/colors";
import { pushRect, pushRoundedRect } from "../src/webgpu/marks";
import { mountLineChart } from "../src/engine/lineChart";
import { mountTreemapChart } from "../src/engine/treemapChart";
import { mountComparableHorizontalBarChart } from "../src/engine/comparableHorizontalBarChart";
import type { LineChartProps, TreemapChartProps } from "../src/types";

afterEach(() => resetMichiVzDefaults());

const host = () => {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
};

const line = (extra: Partial<LineChartProps> = {}) => {
  const el = host();
  const chart = mountLineChart(el, {
    width: 600,
    height: 300,
    xAxisDataType: "date_annual",
    dataSet: [
      {
        label: "Alpha",
        series: [
          { date: 2020, value: 1, certainty: true },
          { date: 2021, value: 2, certainty: true },
        ],
      },
    ],
    ...extra,
  });
  return { el, chart };
};

const treemap = (extra: Partial<TreemapChartProps> = {}) => {
  const el = host();
  const chart = mountTreemapChart(el, {
    width: 600,
    height: 300,
    dataSet: [
      { label: "Alpha", value: 30 },
      { label: "Beta", value: 20 },
    ],
    ...extra,
  });
  return { el, chart };
};

describe("defaults store", () => {
  it("starts empty, merges each call and resets", () => {
    expect(getMichiVzDefaults()).toEqual({});
    setMichiVzDefaults({ colors: ["#111111"] });
    setMichiVzDefaults({ barRadius: 0, tooltip: { borderRadius: 0 } });
    setMichiVzDefaults({ tooltip: { shadow: false } });
    expect(getMichiVzDefaults()).toEqual({
      colors: ["#111111"],
      barRadius: 0,
      tooltip: { borderRadius: 0, shadow: false },
    });
    resetMichiVzDefaults();
    expect(getMichiVzDefaults()).toEqual({});
  });

  it("defaultPalette falls back to the built-in palette", () => {
    expect(defaultPalette()).toBe(DEFAULT_COLORS);
    setMichiVzDefaults({ colors: ["#1a657d", "#3e75b0"] });
    expect(defaultPalette()).toEqual(["#1a657d", "#3e75b0"]);
    setMichiVzDefaults({ colors: [] });
    expect(defaultPalette()).toBe(DEFAULT_COLORS);
  });
});

describe("palette", () => {
  it("charts without colours take the configured palette", () => {
    setMichiVzDefaults({ colors: ["#1a657d", "#3e75b0"] });
    const { el, chart } = line();
    expect(el.querySelector("path.line")!.getAttribute("stroke")).toBe("#1a657d");
    chart.destroy();
    const t = treemap();
    const fills = Array.from(t.el.querySelectorAll("rect.tile")).map((r) => r.getAttribute("fill"));
    expect(fills).toEqual(["#1a657d", "#3e75b0"]);
    t.chart.destroy();
  });

  it("a colors prop still wins", () => {
    setMichiVzDefaults({ colors: ["#1a657d"] });
    const { el, chart } = line({ colors: ["#ff0000"] });
    expect(el.querySelector("path.line")!.getAttribute("stroke")).toBe("#ff0000");
    chart.destroy();
  });
});

describe("font and tooltip (shared chart chrome)", () => {
  it("sets the font variable from the defaults, the prop wins", () => {
    setMichiVzDefaults({ fontFamily: "Roboto" });
    const a = line();
    expect(a.el.style.getPropertyValue("--michi-vz-font-family")).toBe("Roboto");
    const b = line({ fontFamily: "Nunito" });
    expect(b.el.style.getPropertyValue("--michi-vz-font-family")).toBe("Nunito");
    a.chart.destroy();
    b.chart.destroy();
  });

  it("writes the tooltip look as css variables on every chart host", () => {
    setMichiVzDefaults({
      tooltip: {
        borderRadius: 0,
        shadow: false,
        background: "#fafafa",
        borderColor: "#999999",
        color: "#222222",
        fontSize: 14,
      },
    });
    for (const { el, chart } of [line(), treemap()]) {
      const v = (name: string) => el.style.getPropertyValue(name);
      expect(v("--michi-vz-tooltip-radius")).toBe("0px");
      expect(v("--michi-vz-tooltip-shadow")).toBe("none");
      expect(v("--michi-vz-tooltip-bg")).toBe("#fafafa");
      expect(v("--michi-vz-tooltip-border")).toBe("#999999");
      expect(v("--michi-vz-tooltip-color")).toBe("#222222");
      expect(v("--michi-vz-tooltip-font-size")).toBe("14px");
      chart.destroy();
    }
  });

  it("sets no tooltip variable when none is configured", () => {
    const { el, chart } = line();
    expect(el.style.getPropertyValue("--michi-vz-tooltip-radius")).toBe("");
    chart.destroy();
  });
});

describe("bar and tile corners", () => {
  it("barRadius default applies to comparable bars, the prop wins", () => {
    const data = [{ label: "Alpha", valueBased: 10, valueCompared: 18 }];
    setMichiVzDefaults({ barRadius: 0 });
    const el = host();
    const chart = mountComparableHorizontalBarChart(el, { dataSet: data, width: 600, height: 300 });
    expect(el.querySelector("rect.value-based")!.getAttribute("rx")).toBe("0");
    chart.update({ dataSet: data, width: 600, height: 300, barRadius: 3 });
    expect(el.querySelector("rect.value-based")!.getAttribute("rx")).toBe("3");
    chart.destroy();
  });

  it("treemap tileRadius: built-in 1, defaults, prop", () => {
    const radius = (el: HTMLElement) => el.querySelector("rect.tile")!.getAttribute("rx");
    const a = treemap();
    expect(radius(a.el)).toBe("1");
    setMichiVzDefaults({ tileRadius: 0 });
    const b = treemap();
    expect(radius(b.el)).toBe("0");
    const c = treemap({ tileRadius: 6 });
    expect(radius(c.el)).toBe("6");
    for (const x of [a, b, c]) x.chart.destroy();
  });
});

describe("pushRoundedRect (webgpu)", () => {
  const area = (out: number[]) => {
    let sum = 0;
    for (let i = 0; i < out.length; i += 18) {
      const [x1, y1, x2, y2, x3, y3] = [
        out[i],
        out[i + 1],
        out[i + 6],
        out[i + 7],
        out[i + 12],
        out[i + 13],
      ];
      sum += Math.abs((x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1)) / 2;
    }
    return sum;
  };
  const c: [number, number, number, number] = [1, 0, 0, 1];

  it("radius 0 is exactly a plain rect", () => {
    const a: number[] = [];
    const b: number[] = [];
    pushRoundedRect(a, 10, 20, 100, 40, 0, c);
    pushRect(b, 10, 20, 100, 40, c);
    expect(a).toEqual(b);
  });

  it("covers the rect minus the four corners", () => {
    const out: number[] = [];
    pushRoundedRect(out, 0, 0, 100, 40, 8, c);
    const expected = 100 * 40 - (4 - Math.PI) * 8 * 8;
    expect(Math.abs(area(out) - expected)).toBeLessThan(2);
    for (let i = 0; i < out.length; i += 6) {
      expect(out[i]).toBeGreaterThanOrEqual(0);
      expect(out[i]).toBeLessThanOrEqual(100);
      expect(out[i + 1]).toBeGreaterThanOrEqual(0);
      expect(out[i + 1]).toBeLessThanOrEqual(40);
    }
  });

  it("clamps the radius to half the shorter side", () => {
    const a: number[] = [];
    const b: number[] = [];
    pushRoundedRect(a, 0, 0, 100, 10, 50, c);
    pushRoundedRect(b, 0, 0, 100, 10, 5, c);
    expect(a).toEqual(b);
  });
});
