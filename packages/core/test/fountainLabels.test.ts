import { describe, it, expect } from "vitest";
import {
  resolveFountainWords,
  fountainValueFormatter,
  fountainReferenceCounts,
  fountainValueLabels,
  fountainTooltipLines,
  fountainTooltipHtml,
  fountainAxisLabel,
  fountainReadingGuide,
  fountainGuideMarks,
  fountainPeriodLabel,
  FOUNTAIN_DEFAULT_READING_GUIDE,
} from "../src/fountainChart/labels";
import { resolveFountainData } from "../src/fountainChart/data";
import type { FountainDataItem, FountainReferenceLine } from "../src/types";

const car: FountainDataItem = {
  label: "Car",
  value: 30,
  low: 22,
  high: 55,
  samples: [29, 31, 27, 30, 55, 28, 33, 30, 26, 35, 22, 30, 34, 46, 27, 29, 32, 35, 25, 48],
};
const allow: FountainReferenceLine = {
  value: 45,
  label: "Time I allow: 45 min",
  goodSide: "below",
  countLabel: "within 45 min",
};
const jetOf = (item: FountainDataItem) => resolveFountainData([item]).jets[0];
const words = resolveFountainWords({ endLabels: ["best", "worst"], sampleWord: "days" });
const format = fountainValueFormatter(undefined, "en-US");

describe("resolveFountainWords", () => {
  it("English defaults", () => {
    expect(resolveFountainWords({})).toEqual({
      usual: "usual",
      of: "of",
      only: "only",
      forecast: "forecast",
      low: "lowest",
      high: "highest",
      sampleWord: "measurements",
    });
  });

  it("labels, endLabels and sampleWord override them", () => {
    const w = resolveFountainWords({
      labels: { usual: "habituel", of: "sur", only: "seulement", forecast: "prévision" },
      endLabels: ["meilleur", "pire"],
      sampleWord: "jours",
    });
    expect(w).toEqual({
      usual: "habituel",
      of: "sur",
      only: "seulement",
      forecast: "prévision",
      low: "meilleur",
      high: "pire",
      sampleWord: "jours",
    });
  });
});

describe("fountainValueFormatter", () => {
  it("uses yAxisFormat when given, else the locale's number format", () => {
    expect(fountainValueFormatter((d) => `${d} min`, "en-US")(30)).toBe("30 min");
    expect(fountainValueFormatter(undefined, "en-US")(1300)).toBe("1,300");
    expect(fountainValueFormatter(undefined, "de-DE")(1300)).toBe("1.300");
  });
});

describe("fountainReferenceCounts", () => {
  it("counts the samples on the good side, the line itself included (mock numbers)", () => {
    expect(fountainReferenceCounts(jetOf(car), [allow])).toEqual([
      { value: 45, goodSide: "below", count: 17, total: 20, countLabel: "within 45 min" },
    ]);
    const food = jetOf({ label: "Lunch", value: 30, samples: [20, 25, 30, 30, 31, 40] });
    expect(fountainReferenceCounts(food, [{ value: 30, goodSide: "below" }])[0].count).toBe(4);
    expect(fountainReferenceCounts(food, [{ value: 30, goodSide: "above" }])[0].count).toBe(4);
  });

  it("default count words follow the good side", () => {
    const j = jetOf({ label: "A", value: 5, samples: [1, 9] });
    const [below, above] = fountainReferenceCounts(j, [
      { value: 5, goodSide: "below" },
      { value: 5, goodSide: "above" },
    ]);
    expect(below.countLabel).toBe("below the line");
    expect(above.countLabel).toBe("above the line");
  });

  it("nothing for lines without a goodSide, jets without samples, and forecasts", () => {
    expect(fountainReferenceCounts(jetOf(car), [{ value: 45 }])).toEqual([]);
    expect(
      fountainReferenceCounts(jetOf({ label: "A", value: 1, low: 0, high: 2 }), [allow]),
    ).toEqual([]);
    expect(fountainReferenceCounts(jetOf({ ...car, forecast: true }), [allow])).toEqual([]);
  });
});

describe("fountainValueLabels", () => {
  it("bold usual, the two end words, then bold count and its words", () => {
    expect(fountainValueLabels(jetOf(car), { format, words, referenceLines: [allow] })).toEqual([
      { text: "usual 30", bold: true, kind: "usual" },
      { text: "best 22", bold: false, kind: "low" },
      { text: "worst 55", bold: false, kind: "high" },
      { text: "17 of 20", bold: true, kind: "count" },
      { text: "within 45 min", bold: false, kind: "countLabel" },
    ]);
  });

  it("formats the numbers with the chart's formatter", () => {
    const rent = jetOf({ label: "Berlin", value: 1300, low: 950, high: 2100 });
    const lines = fountainValueLabels(rent, {
      format: fountainValueFormatter(undefined, "de-DE"),
      words: resolveFountainWords({ endLabels: ["cheapest", "dearest"] }),
    });
    expect(lines.map((l) => l.text)).toEqual(["usual 1.300", "cheapest 950", "dearest 2.100"]);
  });

  it('adds "only N <sampleWord>" under 10 samples, never for 0, 10+ or a forecast', () => {
    const few = jetOf({ label: "A", value: 40, samples: [33, 37, 40, 45, 52] });
    const texts = fountainValueLabels(few, { format, words }).map((l) => l.text);
    expect(texts).toContain("only 5 days");
    expect(texts.indexOf("only 5 days")).toBe(3);
    const ten = jetOf({ label: "A", value: 5, samples: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] });
    expect(fountainValueLabels(ten, { format, words }).some((l) => l.kind === "only")).toBe(false);
    const none = jetOf({ label: "A", value: 5, low: 1, high: 9 });
    expect(fountainValueLabels(none, { format, words }).some((l) => l.kind === "only")).toBe(false);
    const fc = jetOf({ label: "A", value: 40, samples: [33, 40, 52], forecast: true });
    expect(fountainValueLabels(fc, { format, words }).some((l) => l.kind === "only")).toBe(false);
  });

  it("no end words without a range, or with showRange off", () => {
    const bare = jetOf({ label: "A", value: 7 });
    expect(fountainValueLabels(bare, { format, words }).map((l) => l.text)).toEqual(["usual 7"]);
    const off = fountainValueLabels(jetOf(car), { format, words, showRange: false });
    expect(off.map((l) => l.kind)).toEqual(["usual"]);
  });
});

describe("fountainTooltipLines / fountainTooltipHtml", () => {
  it("label, usual, both ends on one line, the sample count, and each reference count", () => {
    expect(
      fountainTooltipLines(jetOf(car), { format, words, referenceLines: [allow] }).map(
        (l) => l.text,
      ),
    ).toEqual(["Car", "usual 30", "best 22 · worst 55", "20 days", "17 of 20 within 45 min"]);
  });

  it("names the period in trend mode and marks a forecast", () => {
    const fc = jetOf({ label: "Battery", value: 12, low: 7, high: 14, forecast: true });
    const lines = fountainTooltipLines(fc, { format, words, period: "Year 4" });
    expect(lines[0]).toEqual({ text: "Battery · Year 4 (forecast)", bold: true });
    expect(lines.map((l) => l.text)).toEqual([
      "Battery · Year 4 (forecast)",
      "usual 12",
      "best 7 · worst 14",
    ]);
  });

  it("escapes the text and bolds the bold lines", () => {
    const html = fountainTooltipHtml([
      { text: "<b>A&B</b>", bold: true },
      { text: "usual 3", bold: false },
    ]);
    expect(html).toBe("<strong>&lt;b&gt;A&amp;B&lt;/b&gt;</strong><br/>usual 3");
  });
});

describe("fountainAxisLabel and fountainReadingGuide", () => {
  it('a forecast x label reads "Fri (forecast)"', () => {
    expect(fountainAxisLabel("Fri", true, words)).toBe("Fri (forecast)");
    expect(fountainAxisLabel("Today", false, words)).toBe("Today");
  });

  it("reading guide: off by default, true = the default line, a string replaces it", () => {
    expect(fountainReadingGuide(undefined)).toBeNull();
    expect(fountainReadingGuide(false)).toBeNull();
    expect(fountainReadingGuide(true)).toBe(FOUNTAIN_DEFAULT_READING_GUIDE);
    expect(FOUNTAIN_DEFAULT_READING_GUIDE).toBe(
      "Small dot = one measurement · Big dot = the usual one · Dots close together = steady · Tall fountain = changes a lot · Few dots = just a guess",
    );
    expect(fountainReadingGuide("Petit point = un jour")).toBe("Petit point = un jour");
    expect(fountainReadingGuide("")).toBeNull();
  });

  it("the default guide names only the marks the chart draws", () => {
    const all = { dots: true, range: true };
    expect(fountainReadingGuide(true, all)).toBe(FOUNTAIN_DEFAULT_READING_GUIDE);
    expect(fountainReadingGuide(true, { dots: false, range: true })).toBe(
      "Big dot = the usual one · Tall fountain = changes a lot",
    );
    expect(fountainReadingGuide(true, { dots: false, range: false })).toBe(
      "Big dot = the usual one",
    );
    // A string is the author's own words: never trimmed.
    expect(fountainReadingGuide("Small dot = one day", { dots: false, range: false })).toBe(
      "Small dot = one day",
    );
  });

  it("fountainGuideMarks: which marks the drawn jets show", () => {
    const bell = { points: [] };
    const dot = { x: 0, y: 0 };
    expect(
      fountainGuideMarks([
        { bell, dots: [dot] },
        { bell: null, dots: [] },
      ]),
    ).toEqual({
      dots: true,
      range: true,
    });
    expect(fountainGuideMarks([{ bell, dots: [] }])).toEqual({ dots: false, range: true });
    expect(fountainGuideMarks([{ bell: null, dots: [] }])).toEqual({ dots: false, range: false });
    // Small dots whose fountain is under half a pixel tall (not drawn) still count.
    expect(fountainGuideMarks([{ bell: null, dots: [dot] }])).toEqual({
      dots: true,
      range: false,
    });
    expect(fountainGuideMarks([])).toEqual({ dots: false, range: false });
  });
});

describe("fountainPeriodLabel", () => {
  it("null in snapshot mode", () => {
    expect(fountainPeriodLabel({ date: null, x: null }, null)).toBeNull();
  });

  it("number axes keep the raw date (no thousands separator on a year)", () => {
    expect(fountainPeriodLabel({ date: 2001, x: 2001 }, "number", undefined, "en-US")).toBe("2001");
  });

  it("date axes use the locale's date format of the parsed x", () => {
    const x = Date.UTC(2021, 0, 1);
    expect(fountainPeriodLabel({ date: "2021", x }, "date_annual", undefined, "en-US")).toBe(
      "2021",
    );
  });

  it("xAxisFormat wins, fed the same x the axis ticks get", () => {
    const x = Date.UTC(2021, 0, 1);
    expect(
      fountainPeriodLabel(
        { date: "2021", x },
        "date_annual",
        (d) => `FY${new Date(d).getUTCFullYear()}`,
      ),
    ).toBe("FY2021");
  });
});
