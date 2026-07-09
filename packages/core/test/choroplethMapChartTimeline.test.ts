import { describe, it, expect } from "vitest";
import { mountChoroplethMapChart } from "../src/engine/choroplethMapChart";
import { createManualTicker, type ManualTicker } from "../src/animation/ticker";
import type { ChoroplethDataItem, ChoroplethMapChartProps, GeoFeatureItem } from "../src/types";

// Small hand-curated geography (two plain squares) - the SAME geography is
// drawn every period; only `dataSet` (the join rows) plays through years.
const geography: GeoFeatureItem[] = [
  {
    id: "A",
    name: "Alpha",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-10, 0],
          [-5, 0],
          [-5, 5],
          [-10, 5],
          [-10, 0],
        ],
      ],
    },
  },
  {
    id: "D",
    name: "Delta",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [10, 0],
          [15, 0],
          [15, 5],
          [10, 5],
          [10, 0],
        ],
      ],
    },
  },
];

// D only has a value in 2019 - in 2018 it must render as unmatched (noDataColor).
const years: ChoroplethDataItem[] = [
  { id: "A", label: "Alpha", value: 10, date: "2018" },
  { id: "A", label: "Alpha", value: 12, date: "2019" },
  { id: "D", label: "Delta", value: 90, date: "2019" },
];

function mount(extra: Partial<ChoroplethMapChartProps> = {}, ticker?: ManualTicker) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountChoroplethMapChart(
    host,
    { geography, dataSet: years, width: 600, height: 400, noDataColor: "#abcdef", ...extra },
    ticker ? { ticker } : undefined
  );
  return { host, chart };
}

const deltaFill = (host: HTMLElement): string | null =>
  host.querySelector<SVGPathElement>('path.region[data-label="D"]')!.getAttribute("fill");

describe("choropleth map chart timeline (off by default)", () => {
  it("renders no control and exposes no timeline() when the prop is unset", () => {
    const { host, chart } = mount();
    expect(host.querySelector(".mv-timeline")).toBeNull();
    expect(chart.timeline).toBeUndefined();
    chart.destroy();
    host.remove();
  });
});

describe("choropleth map chart timeline (enabled)", () => {
  it("snapshots the FIRST period on mount and exposes the controller", () => {
    const { host, chart } = mount({ timeline: true });
    // 2018: only Alpha has a value - Delta is unmatched (noDataColor).
    expect(deltaFill(host)).toBe("#abcdef");
    const tl = chart.timeline!()!;
    expect(tl.getState().periods).toEqual(["2018", "2019"]);
    expect(tl.getState().index).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("stepForward() reveals Delta's 2019-only value (context regions flip matched)", () => {
    const { host, chart } = mount({ timeline: true });
    const before = chart.getContext();
    chart.timeline!()!.stepForward();
    const after = chart.getContext();
    expect(JSON.stringify(before)).not.toBe(JSON.stringify(after));
    expect(deltaFill(host)).not.toBe("#abcdef");
    chart.destroy();
    host.remove();
  });

  it("geography features/topology are unaffected by the timeline (both always render)", () => {
    const { host, chart } = mount({ timeline: true });
    expect(host.querySelectorAll("path.region").length).toBe(2);
    chart.timeline!()!.stepForward();
    expect(host.querySelectorAll("path.region").length).toBe(2);
    chart.destroy();
    host.remove();
  });

  it("plays through periods on the injected ticker and stops at the end", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: { speedMs: 500 } }, ticker);
    const tl = chart.timeline!()!;
    tl.play();
    ticker.tick(500);
    expect(tl.getState().index).toBe(1);
    expect(deltaFill(host)).not.toBe("#abcdef");
    expect(tl.getState().playing).toBe(false); // reached the last period, non-loop
    chart.destroy();
    host.remove();
  });
});

describe("choropleth map chart timeline control UI", () => {
  it("renders a play button, a scrubber, and the current period label", () => {
    const { host, chart } = mount({ timeline: true });
    const root = host.querySelector<HTMLElement>(".mv-timeline")!;
    expect(root).not.toBeNull();
    const button = root.querySelector("button")!;
    const range = root.querySelector<HTMLInputElement>('input[type="range"]')!;
    const label = root.querySelector(".mv-timeline-period")!;
    expect(button).not.toBeNull();
    expect(range.max).toBe("1");
    expect(range.value).toBe("0");
    expect(label.textContent).toBe("2018");
    chart.destroy();
    host.remove();
  });

  it("showControl: false renders no control but the API still works", () => {
    const { host, chart } = mount({ timeline: { showControl: false } });
    expect(host.querySelector(".mv-timeline")).toBeNull();
    chart.timeline!()!.stepForward();
    expect(deltaFill(host)).not.toBe("#abcdef");
    chart.destroy();
    host.remove();
  });
});
