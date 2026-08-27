// Dashed (uncertain/gap) runs must follow the SAME curve as the full series.
// Before buildSeriesRunPaths, each run was generated independently, so a
// 2-point gap run always degenerated to a straight segment under
// curveMonotoneX/curveLinear while the solid runs around it curved.
import { describe, it, expect } from "vitest";
import { scaleLinear } from "d3-scale";
import { buildSeriesRunPaths, getRuns, makeLineGenerator } from "../src/lineChart/geometry";
import type { DataPoint } from "../src/types";

const pt = (date: number, value: number, certainty = true): DataPoint => ({
  date,
  value,
  certainty,
});

const xScale = scaleLinear().domain([2015, 2021]).range([0, 600]);
const yScale = scaleLinear().domain([0, 100]).range([400, 0]);

// Wavy series with a gap INTO 2019 (2018 missing upstream): the segment
// 2017 -> 2019 is the uncertain (dashed) bridge.
const series = [pt(2015, 10), pt(2016, 60), pt(2017, 30), pt(2019, 80, false), pt(2020, 20)];

const stripMoveHead = (d: string) => d.replace(/^M[^A-Z]*/, "");
const moveHead = (d: string) => /^M[^A-Z]*/.exec(d)?.[0] ?? "";

describe("buildSeriesRunPaths", () => {
  it("renders the dashed gap run as a curve under the default curveMonotoneX", () => {
    const runs = getRuns(series);
    expect(runs.map((r) => r.certain)).toEqual([true, false, true]);

    const paths = buildSeriesRunPaths(series, runs, xScale, yScale, "number");
    // The 2-point gap run must contain a cubic segment, not a straight L.
    expect(paths[1]).toMatch(/C/);
    expect(paths[1]).not.toMatch(/L/);
  });

  it("slices per-run paths from one continuous full-series path", () => {
    const runs = getRuns(series);
    const paths = buildSeriesRunPaths(series, runs, xScale, yScale, "number");
    const full = makeLineGenerator(xScale, yScale, "number")(series) ?? "";

    // Reassembling the runs (dropping the shared-boundary M heads of runs
    // 2..n) must reproduce the full-series path byte for byte.
    const reassembled = paths[0] + paths.slice(1).map(stripMoveHead).join("");
    expect(reassembled).toBe(full);

    // Each run starts exactly where the previous one ends (shared boundary
    // point), so the dashed bridge joins the solid runs with no seam.
    for (let i = 1; i < paths.length; i++) {
      const prevEnd = paths[i - 1].slice(paths[i - 1].lastIndexOf(",", -1));
      expect(prevEnd).toBeTruthy();
      const head = moveHead(paths[i]).slice(1); // "x,y" of this run's start
      expect(paths[i - 1].endsWith(head)).toBe(true);
    }
  });

  it("keeps curveLinear segments straight (no spurious curvature)", () => {
    const runs = getRuns(series);
    const paths = buildSeriesRunPaths(series, runs, xScale, yScale, "number", "curveLinear");
    for (const p of paths) {
      expect(p).toMatch(/^M/);
      expect(p).not.toMatch(/C/);
    }
  });

  it("falls back safely for a single-point series", () => {
    const lone = [pt(2018, 50)];
    const runs = getRuns(lone);
    const paths = buildSeriesRunPaths(lone, runs, xScale, yScale, "number");
    expect(paths).toHaveLength(1);
    expect(paths[0]).toMatch(/^M/);
  });
});
