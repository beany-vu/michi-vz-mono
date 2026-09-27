// Period dates read as the period the data meant, in every time zone. parseXValue
// turns "2021" / "2021-01" into UTC midnight; formatting that instant in local time
// showed the year (or month) before it anywhere west of UTC. A local-midnight Date
// (new Date(2021, 0, 1)) must still read as its own year east and west of UTC.
import { afterAll, describe, expect, it } from "vitest";
import { defaultXAxisFormatter } from "../src/i18n/formatters";
import { parseXValue } from "../src/lineChart/lineUtils";
import { mountFountainChart } from "../src/engine/fountainChart";
import { mountLineChart } from "../src/engine/lineChart";
import type { FountainChartContext, FountainChartProps } from "../src/types";

const savedTz = process.env.TZ;
afterAll(() => {
  if (savedTz === undefined) delete process.env.TZ;
  else process.env.TZ = savedTz;
});

/** Run fn with the process in time zone tz (Node re-reads TZ when it is assigned). */
function inZone<T>(tz: string, fn: () => T): T {
  const prev = process.env.TZ;
  process.env.TZ = tz;
  try {
    return fn();
  } finally {
    if (prev === undefined) delete process.env.TZ;
    else process.env.TZ = prev;
  }
}

const epoch = (v: number | Date): number => (v instanceof Date ? v.getTime() : v);

describe("defaultXAxisFormatter: period dates", () => {
  it("the zone switch is real: UTC midnight is the previous day in New York", () => {
    inZone("America/New_York", () => {
      expect(new Date("2021-01-01").getDate()).toBe(31);
    });
  });

  it('date_annual: "2021" reads 2021 west of UTC, east of UTC and in UTC', () => {
    for (const tz of ["America/New_York", "America/Los_Angeles", "Europe/Paris", "UTC"]) {
      inZone(tz, () => {
        const f = defaultXAxisFormatter("date_annual", "en");
        expect(f(epoch(parseXValue("2021", "date_annual")))).toBe("2021");
        expect(f(epoch(parseXValue(2024, "date_annual")))).toBe("2024");
      });
    }
  });

  it('date_monthly: "2021-01" reads Jan 2021 west of UTC (en and fr)', () => {
    inZone("America/New_York", () => {
      const en = defaultXAxisFormatter("date_monthly", "en");
      const fr = defaultXAxisFormatter("date_monthly", "fr");
      expect(en(epoch(parseXValue("2021-01", "date_monthly")))).toBe("Jan 2021");
      expect(fr(epoch(parseXValue("2021-01", "date_monthly")))).toBe("janv. 2021");
      expect(fr(epoch(parseXValue("2021-04", "date_monthly")))).toBe("avr. 2021");
      // Epoch ms at UTC midnight, the documented numeric form.
      expect(en(Date.UTC(2021, 2, 1))).toBe("Mar 2021");
    });
  });

  it("a local-midnight Date reads as its own year and month east and west of UTC", () => {
    for (const tz of ["Europe/Paris", "Asia/Tokyo", "America/New_York", "America/Los_Angeles"]) {
      inZone(tz, () => {
        const annual = defaultXAxisFormatter("date_annual", "en");
        const monthly = defaultXAxisFormatter("date_monthly", "en");
        expect(annual(new Date(2021, 0, 1).getTime())).toBe("2021");
        expect(monthly(new Date(2021, 0, 1).getTime())).toBe("Jan 2021");
        expect(monthly(new Date(2021, 3, 1).getTime())).toBe("Apr 2021");
      });
    }
  });

  it("a date string still formats (and a bad one is printed as given)", () => {
    inZone("America/New_York", () => {
      expect(defaultXAxisFormatter("date_annual", "en")("2021")).toBe("2021");
      expect(defaultXAxisFormatter("date_annual", "en")("not a date")).toBe("not a date");
    });
  });
});

describe("west of UTC, the charts label periods as the data gives them", () => {
  const jet = (date: string, value: number): FountainChartProps["dataSet"][number] => ({
    label: "S",
    date,
    value,
    low: value - 2,
    high: value + 2,
  });

  it("fountain trend (date_annual): a11y period, summary, tooltip and axis ticks", () => {
    inZone("America/New_York", () => {
      const host = document.createElement("div");
      document.body.appendChild(host);
      const chart = mountFountainChart(host, {
        dataSet: [jet("2021", 5), jet("2022", 4)],
        xAxisDataType: "date_annual",
        width: 700,
        height: 400,
        locale: "en",
      });
      const ctx = chart.getContext() as FountainChartContext;
      const periodCol = ctx.a11yTable!.headers.indexOf("Period");
      expect(ctx.a11yTable!.rows.map((r) => r[periodCol])).toEqual(["2021", "2022"]);
      expect(ctx.summary).toContain("2021");
      expect(ctx.summary).not.toContain("2020");
      const ticks = Array.from(host.querySelectorAll(".mv-x-axis text.mv-axis-label")).map(
        (t) => t.textContent,
      );
      expect(ticks).toEqual(["2021", "2022"]);
      // The default tooltip heads with "<label> · <period>".
      const big = host.querySelector("circle.mv-fountain-value")!;
      host.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          clientX: Number(big.getAttribute("cx")),
          clientY: Number(big.getAttribute("cy")),
        }),
      );
      expect(host.querySelector(".tooltip strong")?.textContent).toBe("S · 2021");
      chart.destroy();
      host.remove();
    });
  });

  it("fountain trend (date_monthly, fr): a11y periods", () => {
    inZone("America/New_York", () => {
      const host = document.createElement("div");
      document.body.appendChild(host);
      const chart = mountFountainChart(host, {
        dataSet: [jet("2021-01", 5), jet("2021-04", 4)],
        xAxisDataType: "date_monthly",
        width: 700,
        height: 400,
        locale: "fr",
      });
      const ctx = chart.getContext() as FountainChartContext;
      const periodCol = ctx.a11yTable!.headers.indexOf("Period");
      expect(ctx.a11yTable!.rows.map((r) => r[periodCol])).toEqual(["janv. 2021", "avr. 2021"]);
      chart.destroy();
      host.remove();
    });
  });

  it("line chart (date_annual): axis ticks", () => {
    inZone("America/New_York", () => {
      const host = document.createElement("div");
      document.body.appendChild(host);
      const chart = mountLineChart(host, {
        dataSet: [
          {
            label: "A",
            series: [
              { date: "2021", value: 1 },
              { date: "2022", value: 2 },
              { date: "2023", value: 3 },
            ],
          },
        ],
        xAxisDataType: "date_annual",
        width: 700,
        height: 400,
        locale: "en",
      });
      const ticks = Array.from(host.querySelectorAll(".mv-x-axis text.mv-axis-label")).map(
        (t) => t.textContent,
      );
      expect(ticks).toEqual(["2021", "2022", "2023"]);
      chart.destroy();
      host.remove();
    });
  });
});
