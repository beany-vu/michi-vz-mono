import { describe, it, expect } from "vitest";
import {
  enumeratePeriods,
  periodValue,
  parseXValue,
  periodTickValues,
} from "../src/lineChart/lineUtils";

describe("enumeratePeriods", () => {
  it("annual: inclusive year boundaries", () => {
    const out = enumeratePeriods(new Date("2020-01-01"), new Date("2024-01-01"), "date_annual");
    expect(out.length).toBe(5);
    expect(out[0]).toBe(Date.UTC(2020, 0, 1));
    expect(out[4]).toBe(Date.UTC(2024, 0, 1));
  });

  it("monthly: inclusive month boundaries across a year wrap", () => {
    const out = enumeratePeriods(new Date("2020-11-01"), new Date("2021-02-01"), "date_monthly");
    expect(out).toEqual([
      Date.UTC(2020, 10, 1),
      Date.UTC(2020, 11, 1),
      Date.UTC(2021, 0, 1),
      Date.UTC(2021, 1, 1),
    ]);
  });

  it("normalizes non-round endpoints to their period (first/last stay exact)", () => {
    // a series running mid-period still yields the enclosing month boundaries
    const out = enumeratePeriods(new Date("2020-02-15"), new Date("2020-04-09"), "date_monthly");
    expect(out).toEqual([Date.UTC(2020, 1, 1), Date.UTC(2020, 2, 1), Date.UTC(2020, 3, 1)]);
  });

  it("matches parseXValue for the same period key so ticks + data compare equal", () => {
    const viaEnum = enumeratePeriods(
      new Date("2020-01-01"),
      new Date("2020-01-01"),
      "date_annual",
    )[0];
    expect(viaEnum).toBe((parseXValue("2020", "date_annual") as Date).valueOf());
  });
});

describe("periodValue", () => {
  it("normalizes a mid-month date to the 1st (monthly) / Jan 1 (annual)", () => {
    expect(periodValue(new Date("2020-02-15"), "date_monthly")).toBe(Date.UTC(2020, 1, 1));
    expect(periodValue(new Date("2020-07-09"), "date_annual")).toBe(Date.UTC(2020, 0, 1));
  });
});

describe("periodTickValues (shared by line and fountain)", () => {
  it("annual: one tick per distinct period, sorted, first and last kept", () => {
    const out = periodTickValues(["2003", 2001, "2002", 2001], "date_annual");
    expect(out.map((d) => (d as Date).valueOf())).toEqual([
      Date.UTC(2001, 0, 1),
      Date.UTC(2002, 0, 1),
      Date.UTC(2003, 0, 1),
    ]);
  });

  it("monthly: dedupes by the raw key and sorts by time", () => {
    const out = periodTickValues(["2020-03-01", "2020-01-01", "2020-03-01"], "date_monthly");
    expect(out.map((d) => (d as Date).valueOf())).toEqual([
      Date.UTC(2020, 0, 1),
      Date.UTC(2020, 2, 1),
    ]);
  });

  it("number: plain sorted numbers, non-finite dropped", () => {
    expect(periodTickValues([2003, 2001, "2002", "x", 2001], "number")).toEqual([2001, 2002, 2003]);
  });

  it("empty input gives no ticks", () => {
    expect(periodTickValues([], "date_annual")).toEqual([]);
  });
});
