// The VerticalStackBar series-abbreviation letters (E / I …) are drawn in the row
// directly under the axis line, which is exactly where the x tick labels start. A
// rotated "MM-YYYY" label used to run straight through them. The engine now drops the
// tick labels below that row whenever a DataSet carries an abbreviation, and reserves
// the extra bottom margin to match.
import { describe, it, expect } from "vitest";
import { scaleBand } from "d3-scale";
import {
  renderXAxisBand,
  ROTATED_LABEL_OFFSET,
  HORIZONTAL_LABEL_OFFSET,
} from "../src/render/svg/xAxisBand";
import { mountVerticalStackBarChart } from "../src/engine/verticalStackBarChart";
import { ABBREV_LABEL_OFFSET } from "../src/verticalStackBarChart/renderModel";
import type { VerticalStackBarChartProps, VerticalStackBarDataSet } from "../src/types";

const MARGIN = { top: 20, right: 20, bottom: 60, left: 50 };
const HEIGHT = 360;

function svgParent(): SVGElement {
  return document.createElementNS("http://www.w3.org/2000/svg", "svg");
}

function bandScale(labels: string[], width = 600) {
  return scaleBand<string>()
    .domain(labels)
    .range([MARGIN.left, width - MARGIN.right]);
}

/** y of a horizontal tick label. */
function horizontalLabelY(parent: SVGElement): number {
  return Number(parent.querySelector("text.mv-axis-label")?.getAttribute("y"));
}

/** The `translate(0, N)` part of a rotated tick label's transform. */
function rotatedLabelDrop(root: ParentNode): number {
  const transform = root.querySelector(".mv-tick text.mv-axis-label")?.getAttribute("transform");
  return Number(/translate\(0,\s*([\d.]+)\)/.exec(transform ?? "")?.[1]);
}

// 12 monthly bands: "MM-YYYY" is wider than a band, so the axis tilts -45°, but the
// bands are still wide enough not to fall through to thinning. Mirrors the ATO
// Transportation Cost chart, which is where the collision was reported.
const MONTHS = Array.from({ length: 12 }, (_, i) => `2023${String(i + 1).padStart(2, "0")}`);

function dataSet(abbreviation: string): VerticalStackBarDataSet[] {
  return [
    {
      seriesKey: "External freight",
      seriesKeyAbbreviation: abbreviation,
      series: MONTHS.map((date, i) => ({ date, "External freight": String(8 + i) })),
    },
  ];
}

function mount(extra: Partial<VerticalStackBarChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountVerticalStackBarChart(host, {
    dataSet: dataSet("E"),
    width: 600,
    height: HEIGHT,
    // Small enough that the rotated-label reservation actually raises it, which is what
    // the margin assertion below reads.
    margin: { top: 20, right: 20, bottom: 30, left: 50 },
    xAxisFormat: (d) => `${String(d).slice(4)}-${String(d).slice(0, 4)}`,
    ...extra,
  });
  return { host, chart };
}

describe("renderXAxisBand labelOffset", () => {
  it("defaults to the legacy spacing in both modes", () => {
    const horizontal = svgParent();
    renderXAxisBand(horizontal, bandScale(["2001", "2002"]), {
      width: 600,
      height: HEIGHT,
      margin: MARGIN,
    });
    expect(horizontalLabelY(horizontal)).toBe(HEIGHT - MARGIN.bottom + HORIZONTAL_LABEL_OFFSET);

    const rotated = svgParent();
    renderXAxisBand(rotated, bandScale(["2001", "2002"]), {
      width: 600,
      height: HEIGHT,
      margin: MARGIN,
      mode: "rotated",
    });
    expect(rotatedLabelDrop(rotated)).toBe(ROTATED_LABEL_OFFSET);
  });

  it("adds the offset in both modes", () => {
    const horizontal = svgParent();
    renderXAxisBand(horizontal, bandScale(["2001", "2002"]), {
      width: 600,
      height: HEIGHT,
      margin: MARGIN,
      labelOffset: 12,
    });
    expect(horizontalLabelY(horizontal)).toBe(
      HEIGHT - MARGIN.bottom + HORIZONTAL_LABEL_OFFSET + 12,
    );

    const rotated = svgParent();
    renderXAxisBand(rotated, bandScale(["2001", "2002"]), {
      width: 600,
      height: HEIGHT,
      margin: MARGIN,
      mode: "rotated",
      labelOffset: 12,
    });
    expect(rotatedLabelDrop(rotated)).toBe(ROTATED_LABEL_OFFSET + 12);
  });
});

describe("VerticalStackBarChart tick labels vs the abbreviation row", () => {
  it("keeps the legacy offset when no DataSet carries an abbreviation", () => {
    const { host, chart } = mount({ dataSet: dataSet("") });
    expect(rotatedLabelDrop(host)).toBe(ROTATED_LABEL_OFFSET);
    chart.destroy();
    host.remove();
  });

  it("drops the tick labels clear of the abbreviation baseline when one is present", () => {
    const { host, chart } = mount();

    const drop = rotatedLabelDrop(host);
    expect(drop).toBeGreaterThan(ROTATED_LABEL_OFFSET);
    // The anchor must sit below the abbreviation baseline, not level with it.
    expect(drop).toBeGreaterThan(ABBREV_LABEL_OFFSET);

    chart.destroy();
    host.remove();
  });

  it("reserves the extra bottom margin instead of spending the descender pad", () => {
    // Same chart, abbreviation vs none: the rotated-label margin reservation has to grow
    // by exactly the extra drop, otherwise the labels are pushed into the pad and clip.
    const plain = mount({ dataSet: dataSet("") });
    const withAbbrev = mount();

    const axisY = (host: HTMLElement) =>
      Number(
        host
          .querySelector(".mv-tick")
          ?.getAttribute("transform")
          ?.match(/,\s*([\d.]+)\)/)?.[1],
      );

    const extraDrop = rotatedLabelDrop(withAbbrev.host) - rotatedLabelDrop(plain.host);
    // A lower axis line (smaller y) means more bottom margin was reserved.
    expect(axisY(plain.host) - axisY(withAbbrev.host)).toBe(extraDrop);

    plain.chart.destroy();
    plain.host.remove();
    withAbbrev.chart.destroy();
    withAbbrev.host.remove();
  });
});
