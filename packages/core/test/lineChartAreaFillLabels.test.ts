// LineChart `areaFill` (gradient fill under each line) and `lastPointLabel`
// (value label on each series' latest point).
// Geometry: width 600, height 300, default margin {top:50,right:50,bottom:50,left:60}
// -> plot x range [60, 550], y range [250 (bottom), 50 (top)].
import { describe, it, expect } from "vitest";
import { scaleLinear } from "d3-scale";
import { mountLineChart } from "../src/engine/lineChart";
import {
  areaBaselineY,
  buildAreaPath,
  resolveLineAreaFill,
  withAlpha,
} from "../src/lineChart/areaFill";
import { computeLastPointLabels, resolveLastPointLabel } from "../src/lineChart/lastPointLabels";
import type { LineChartProps, LineDataItem } from "../src/types";

const annual = (
  vals: number[],
  start = 2016,
): { date: number; value: number; certainty: boolean }[] =>
  vals.map((value, i) => ({ date: start + i, value, certainty: true }));

const alpha: LineDataItem = { label: "Alpha", color: "#ff0000", series: annual([10, 20, 30, 60]) };
const beta: LineDataItem = { label: "Beta", color: "#0000ff", series: annual([5, 15, 25, 35]) };

function mount(extra: Partial<LineChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountLineChart(host, {
    dataSet: [alpha],
    width: 600,
    height: 300,
    xAxisDataType: "date_annual",
    yAxisDomain: [0, 100],
    ...extra,
  });
  return { host, chart };
}

describe("resolveLineAreaFill", () => {
  it("is off unless asked for", () => {
    expect(resolveLineAreaFill(undefined)).toBeNull();
    expect(resolveLineAreaFill(false)).toBeNull();
  });
  it("true = Highcharts-like fade from 0.5 to 0 down to a 0 baseline", () => {
    expect(resolveLineAreaFill(true)).toEqual({ topOpacity: 0.5, bottomOpacity: 0, baseline: 0 });
  });
  it("a config overrides only what it sets", () => {
    expect(resolveLineAreaFill({ topOpacity: 0.3 })).toEqual({
      topOpacity: 0.3,
      bottomOpacity: 0,
      baseline: 0,
    });
  });
});

describe("areaBaselineY", () => {
  const y = scaleLinear().domain([0, 100]).range([250, 50]);
  it("projects the baseline value", () => {
    expect(areaBaselineY(y, 50)).toBe(150);
    expect(areaBaselineY(y, 0)).toBe(250);
  });
  it("clamps a baseline outside the domain to the plot edge", () => {
    expect(areaBaselineY(y, -40)).toBe(250);
    expect(areaBaselineY(y, 400)).toBe(50);
  });
});

describe("buildAreaPath", () => {
  const x = scaleLinear().domain([2016, 2019]).range([60, 550]);
  const y = scaleLinear().domain([0, 100]).range([250, 50]);
  it("closes the series down to the baseline", () => {
    const d = buildAreaPath(alpha.series, x, y, "number", "curveLinear", 250);
    expect(d.startsWith("M60,230")).toBe(true); // first point: 2016 -> 60, 10 -> 230
    expect(d).toContain("550,250"); // bottom-right corner on the baseline
    expect(d).toContain("60,250"); // bottom-left corner on the baseline
    expect(d.endsWith("Z")).toBe(true);
  });
  it("draws nothing for fewer than two points", () => {
    expect(buildAreaPath(alpha.series.slice(0, 1), x, y, "number", "curveLinear", 250)).toBe("");
  });
});

describe("withAlpha", () => {
  it("turns any probe colour into an rgba() stop", () => {
    expect(withAlpha("#ff0000", 0.5)).toBe("rgba(255,0,0,0.5)");
    expect(withAlpha("rgb(31, 59, 137)", 0)).toBe("rgba(31,59,137,0)");
    expect(withAlpha("transparent", 0.5)).toBe("rgba(0,0,0,0)");
  });
});

describe("resolveLastPointLabel", () => {
  it("is off unless asked for", () => {
    expect(resolveLastPointLabel(undefined)).toBeNull();
    expect(resolveLastPointLabel(false)).toBeNull();
    expect(resolveLastPointLabel(true)).toEqual({});
  });
});

describe("computeLastPointLabels", () => {
  const measure = (s: string) => s.length * 7;
  const bounds = { left: 0, right: 600 };
  const pt = (x: number, y: number, date: number, value: number) => ({
    x,
    y,
    d: { date, value, certainty: true },
  });

  it("labels the point with the largest x, whatever the input order", () => {
    const [l] = computeLastPointLabels(
      [
        {
          label: "Alpha",
          points: [pt(300, 100, 2018, 30), pt(400, 80, 2019, 60), pt(200, 90, 2017, 20)],
        },
      ],
      { text: (_label, d) => `${d.value} USD`, measure, bounds, gap: 8 },
    );
    expect(l.text).toBe("60 USD");
    expect(l.x).toBe(400);
    expect(l.y).toBe(72); // 8px above the point
    expect(l.anchor).toBe("middle");
  });

  it("right-aligns inside the chart when centring would overflow the right edge", () => {
    const [l] = computeLastPointLabels([{ label: "Alpha", points: [pt(590, 80, 2019, 60)] }], {
      text: () => "887 000 USD", // 11 chars -> 77px
      measure,
      bounds,
      gap: 8,
    });
    expect(l.anchor).toBe("end");
    expect(l.x).toBe(600);
  });

  it("left-aligns when centring would overflow the left edge", () => {
    const [l] = computeLastPointLabels([{ label: "Alpha", points: [pt(10, 80, 2019, 60)] }], {
      text: () => "887 000 USD",
      measure,
      bounds,
      gap: 8,
    });
    expect(l.anchor).toBe("start");
    expect(l.x).toBe(0);
  });

  it("skips series without points and empty texts", () => {
    const out = computeLastPointLabels(
      [
        { label: "Empty", points: [] },
        { label: "Blank", points: [pt(100, 100, 2019, 1)] },
      ],
      { text: () => "", measure, bounds, gap: 8 },
    );
    expect(out).toEqual([]);
  });
});

describe("LineChart areaFill (svg)", () => {
  it("draws no fill by default", () => {
    const { host, chart } = mount();
    expect(host.querySelectorAll("path.line-area")).toHaveLength(0);
    chart.destroy();
    host.remove();
  });

  it("fills each series with its own vertical gradient, below every line", () => {
    const { host, chart } = mount({ dataSet: [alpha, beta], areaFill: true });
    const areas = Array.from(host.querySelectorAll<SVGPathElement>("path.line-area"));
    expect(areas.map((a) => a.getAttribute("data-label"))).toEqual(["Alpha", "Beta"]);

    const fill = areas[0].getAttribute("fill")!;
    const id = /^url\(#(.+)\)$/.exec(fill)![1];
    const grad = host.querySelector(`linearGradient[id="${id}"]`)!;
    expect(grad.getAttribute("gradientUnits")).toBe("userSpaceOnUse");
    expect(grad.getAttribute("y1")).toBe("50"); // top of the plot
    expect(grad.getAttribute("y2")).toBe("250"); // the baseline (value 0)
    const stops = Array.from(grad.querySelectorAll("stop"));
    expect(stops.map((s) => s.getAttribute("stop-opacity"))).toEqual(["0.5", "0"]);
    expect(stops.map((s) => s.getAttribute("stop-color"))).toEqual(["#ff0000", "#ff0000"]);

    // Fills never take the pointer and sit before (under) the first line group.
    expect(areas[0].getAttribute("pointer-events")).toBe("none");
    const firstLine = host.querySelector("g.data-group")!;
    expect(
      areas[1].compareDocumentPosition(firstLine) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    chart.destroy();
    host.remove();
  });

  it("honours custom opacities", () => {
    const { host, chart } = mount({ areaFill: { topOpacity: 0.3, bottomOpacity: 0.1 } });
    const stops = Array.from(host.querySelectorAll("linearGradient stop"));
    expect(stops.map((s) => s.getAttribute("stop-opacity"))).toEqual(["0.3", "0.1"]);
    chart.destroy();
    host.remove();
  });

  it("gives every mounted chart its own gradient ids", () => {
    const a = mount({ areaFill: true });
    const b = mount({ areaFill: true });
    const idA = a.host.querySelector("linearGradient")!.id;
    const idB = b.host.querySelector("linearGradient")!.id;
    expect(idA).not.toBe(idB);
    a.chart.destroy();
    b.chart.destroy();
    a.host.remove();
    b.host.remove();
  });

  it("dims the fill of a series that is not highlighted", () => {
    const { host, chart } = mount({
      dataSet: [alpha, beta],
      areaFill: true,
      highlightItems: ["Alpha"],
    });
    const beta0 = host.querySelector<SVGPathElement>('path.line-area[data-label="Beta"]')!;
    expect(beta0.style.opacity).toBe("0.05");
    chart.destroy();
    host.remove();
  });
});

describe("LineChart lastPointLabel", () => {
  const labels = (root: ParentNode) =>
    Array.from(root.querySelectorAll<SVGTextElement>("text.mv-last-point-label"));

  it("draws no label by default", () => {
    const { host, chart } = mount();
    expect(labels(host)).toHaveLength(0);
    chart.destroy();
    host.remove();
  });

  it("labels the latest point of each series through the formatter", () => {
    const { host, chart } = mount({
      dataSet: [alpha, beta],
      lastPointLabel: { formatter: (d, item) => `${item.label}: ${d.value} USD` },
    });
    expect(labels(host).map((t) => t.textContent)).toEqual(["Alpha: 60 USD", "Beta: 35 USD"]);
    const t = labels(host)[0];
    expect(t.getAttribute("data-label")).toBe("Alpha");
    expect(t.getAttribute("pointer-events")).toBe("none");
    chart.destroy();
    host.remove();
  });

  it("formats with the locale number formatter by default", () => {
    const big: LineDataItem = { label: "Big", series: annual([1000, 887000]) };
    const { host, chart } = mount({
      dataSet: [big],
      yAxisDomain: [0, 1000000],
      lastPointLabel: true,
      locale: "en-US",
    });
    expect(labels(host)[0].textContent).toBe("887,000");
    chart.destroy();
    host.remove();
  });

  it("applies color and fontSize", () => {
    const { host, chart } = mount({ lastPointLabel: { color: "#123456", fontSize: 14 } });
    const t = labels(host)[0];
    expect(t.style.fill).toBe("#123456");
    expect(t.style.fontSize).toBe("14px");
    chart.destroy();
    host.remove();
  });

  it("skips disabled series", () => {
    const { host, chart } = mount({
      dataSet: [alpha, beta],
      lastPointLabel: true,
      disabledItems: ["Beta"],
    });
    expect(labels(host).map((t) => t.getAttribute("data-label"))).toEqual(["Alpha"]);
    chart.destroy();
    host.remove();
  });

  it("canvas mode draws the labels in an overlay svg above the canvas", () => {
    const { host, chart } = mount({ renderer: "canvas", lastPointLabel: true });
    const overlay = host.querySelector(":scope > svg.mv-overlay-svg")!;
    expect(overlay).not.toBeNull();
    expect(labels(overlay)).toHaveLength(1);
    chart.destroy();
    host.remove();
  });
});
