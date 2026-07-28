// layout="horizontal" on VerticalStackBarChart: rows on a band y-axis, stacked
// segments growing rightward from x(0). Same data/colour/legend contracts as
// the vertical layout - only the geometry and the axes transpose.
import { describe, it, expect } from "vitest";
import { mountVerticalStackBarChart } from "../src/engine/verticalStackBarChart";
import type { VerticalStackBarChartProps } from "../src/types";

const dataSet = [
  {
    seriesKey: "status",
    series: [
      { date: "Sanitary measures", Answered: 10, Ongoing: 5 },
      { date: "Customs procedures", Answered: 20, Ongoing: 0 },
      { date: "Transport", Answered: 8, Ongoing: 12 },
    ],
  },
];

function mount(extra: Partial<VerticalStackBarChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountVerticalStackBarChart(host, {
    dataSet,
    width: 700,
    height: 300,
    margin: { top: 10, right: 20, bottom: 30, left: 150 },
    layout: "horizontal",
    ...extra,
  });
  return { host, chart };
}

const bars = (host: HTMLElement) => Array.from(host.querySelectorAll<SVGRectElement>("rect.bar"));

describe("VerticalStackBarChart layout=horizontal (jsdom)", () => {
  it("renders one row per category with segments stacked rightward from x(0)", () => {
    const { host, chart } = mount();
    const rects = bars(host);
    // 2 keys x 3 categories, minus zero-height segments (Ongoing 0 renders at
    // minBarHeightZero = 0 width but still emits a rect).
    expect(rects.length).toBe(6);

    const byKey = (k: string) => rects.filter((r) => r.getAttribute("data-label") === k);
    const answered = byKey("Answered");
    // Every Answered segment starts at the same x (the value axis zero).
    const xs = answered.map((r) => Number(r.getAttribute("x")));
    expect(new Set(xs.map((x) => Math.round(x))).size).toBe(1);
    // Larger value = wider rect: Customs (20) wider than Transport (8).
    const widths = answered.map((r) => Number(r.getAttribute("width")));
    expect(Math.max(...widths)).toBeGreaterThan(Math.min(...widths));

    // Ongoing stacks AFTER Answered in the same row: its x = answered x + width.
    const ongoing = byKey("Ongoing").filter((r) => Number(r.getAttribute("width")) > 0);
    for (const seg of ongoing) {
      const rowY = seg.getAttribute("y");
      const base = answered.find((r) => r.getAttribute("y") === rowY)!;
      expect(Number(seg.getAttribute("x"))).toBeCloseTo(
        Number(base.getAttribute("x")) + Number(base.getAttribute("width")),
        3,
      );
    }
    chart.destroy();
    host.remove();
  });

  it("renders the category labels on a band y-axis and values on a linear x-axis", () => {
    const { host, chart } = mount();
    const yLabels = Array.from(host.querySelectorAll(".mv-ylabel")).map((el) =>
      el.textContent?.trim(),
    );
    expect(yLabels).toContain("Sanitary measures");
    expect(yLabels).toContain("Customs procedures");
    // Value axis lives on the x side (mv-x-axis group from renderXAxisLinear).
    expect(host.querySelector(".mv-x-axis")).not.toBeNull();
    // No rotated band-x labels and no abbrev row in horizontal mode.
    expect(host.querySelector(".mv-stack-abbrev")).toBeNull();
    chart.destroy();
    host.remove();
  });

  it("keeps rows within the plot box and honours the row-thickness minimum", () => {
    const { host, chart } = mount();
    for (const r of bars(host)) {
      const y = Number(r.getAttribute("y"));
      const h = Number(r.getAttribute("height"));
      expect(y).toBeGreaterThanOrEqual(10); // margin.top
      expect(y + h).toBeLessThanOrEqual(300 - 30 + 1); // height - margin.bottom
      expect(h).toBeGreaterThan(0);
    }
    chart.destroy();
    host.remove();
  });

  it("keeps the legend/colour contract identical to the vertical layout", () => {
    const { host, chart } = mount({ colors: ["#111111", "#222222"] });
    const ctx = chart.getContext();
    expect(ctx?.legendData?.map((l) => l.label)).toEqual(["Answered", "Ongoing"]);
    const first = bars(host).find((r) => r.getAttribute("data-label") === "Answered")!;
    expect(first.getAttribute("data-label-safe")).toBe("Answered");
    expect(first.getAttribute("fill")).toBe("#111111");
    chart.destroy();
    host.remove();
  });

  it("leaves the vertical layout untouched by default", () => {
    const { host, chart } = mount({ layout: undefined });
    // Vertical: band x-axis labels, no HTML y-band labels.
    expect(host.querySelector(".mv-ylabel")).toBeNull();
    const rects = bars(host);
    // Columns: same key shares a baseline BOTTOM (y+height) per stack rules.
    expect(rects.length).toBeGreaterThan(0);
    chart.destroy();
    host.remove();
  });
});
