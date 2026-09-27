import { describe, it, expect } from "vitest";
import {
  fitFountainValueLabels,
  fountainBottomLayout,
  fountainTextMeasure,
  fountainYTitleLayout,
  placeFountainReferenceLabels,
  wrapFountainReferenceLabel,
  wrapFountainText,
  wrapFountainAxisLabel,
  wrapFountainGuide,
  FOUNTAIN_LABEL_FONT,
  FOUNTAIN_LABEL_GAP,
  type FountainTextMeasure,
} from "../src/fountainChart/layout";
import type { FountainValueLabel } from "../src/fountainChart/labels";

// A deterministic measure: 0.6 em per character, bold or not.
const measure: FountainTextMeasure = (text, px) => text.length * px * 0.6;

const lines = (...spec: Array<[string, FountainValueLabel["kind"]]>): FountainValueLabel[] =>
  spec.map(([text, kind]) => ({ text, kind, bold: kind === "usual" || kind === "count" }));

const car = lines(
  ["usual 30", "usual"],
  ["lowest 22", "low"],
  ["highest 55", "high"],
  ["17 of 20", "count"],
  ["on time", "countLabel"],
);

describe("wrapFountainGuide", () => {
  const w = (s: string): number => s.length * 6;
  const guide = "Small dot = one day · Big dot = the usual one · Tall fountain = changes a lot";

  it("one line while it fits", () => {
    expect(wrapFountainGuide(guide, 1000, w)).toEqual([guide]);
  });

  it("breaks between rules, never inside one, and drops the separator at the break", () => {
    // "Small dot = one day · Big dot = the usual one" is 45 characters: 270 px.
    expect(wrapFountainGuide(guide, 300, w)).toEqual([
      "Small dot = one day · Big dot = the usual one",
      "Tall fountain = changes a lot",
    ]);
    expect(wrapFountainGuide(guide, 200, w)).toEqual([
      "Small dot = one day",
      "Big dot = the usual one",
      "Tall fountain = changes a lot",
    ]);
  });

  it("a rule wider than the line wraps by words, and the next rule may follow it", () => {
    // 15 characters to a line.
    expect(wrapFountainGuide("A = a very long rule here · B = b", 90, w)).toEqual([
      "A = a very long",
      "rule here",
      "B = b",
    ]);
    expect(wrapFountainGuide("A = a very long rule · B", 90, w)).toEqual([
      "A = a very long",
      "rule · B",
    ]);
  });

  it("a guide without separators wraps by words; blank text has no lines", () => {
    expect(wrapFountainGuide("one two three", 50, w)).toEqual(["one two", "three"]);
    expect(wrapFountainGuide("  ", 50, w)).toEqual([]);
  });
});

describe("wrapFountainText", () => {
  const w = (s: string) => s.length * 6;
  it("wraps words greedily to the width", () => {
    expect(wrapFountainText("within 45 min", 50, w)).toEqual(["within", "45 min"]);
    expect(wrapFountainText("within 45 min", 200, w)).toEqual(["within 45 min"]);
  });
  it("a word wider than the width sits alone on its line", () => {
    expect(wrapFountainText("a extraordinarily b", 30, w)).toEqual(["a", "extraordinarily", "b"]);
  });
  it("empty text has no lines", () => {
    expect(wrapFountainText("   ", 30, w)).toEqual([]);
  });
});

describe("wrapFountainAxisLabel", () => {
  const w = (s: string) => s.length * 6;
  it("one line while the label (with its forecast word) fits", () => {
    expect(wrapFountainAxisLabel("Fri", "(forecast)", 100, w)).toEqual(["Fri (forecast)"]);
    expect(wrapFountainAxisLabel("Weekday lunch", null, 100, w)).toEqual(["Weekday lunch"]);
  });
  it("wraps words, and puts the forecast word on the last line or its own", () => {
    expect(wrapFountainAxisLabel("Weekday lunch", null, 50, w)).toEqual(["Weekday", "lunch"]);
    expect(wrapFountainAxisLabel("Fri", "(forecast)", 60, w)).toEqual(["Fri", "(forecast)"]);
    expect(wrapFountainAxisLabel("Year 4", "(fc)", 70, w)).toEqual(["Year 4 (fc)"]);
    expect(wrapFountainAxisLabel("Next autumn term", "(fc)", 70, w)).toEqual([
      "Next autumn",
      "term (fc)",
    ]);
    expect(wrapFountainAxisLabel("Next autumn term", "(forecast)", 70, w)).toEqual([
      "Next autumn",
      "term",
      "(forecast)",
    ]);
  });
  it("null when a word is wider than the column, or more than three lines are needed", () => {
    expect(wrapFountainAxisLabel("Extraordinarily", null, 50, w)).toBeNull();
    expect(wrapFountainAxisLabel("a b c d", null, 6, w)).toBeNull();
  });
});

describe("fountainTextMeasure", () => {
  it("scales a 12 px measurement to the font size, bold a little wider", () => {
    const m = fountainTextMeasure((s) => s.length * 6);
    expect(m("abcd", 12, false)).toBeCloseTo(24, 6);
    expect(m("abcd", 6, false)).toBeCloseTo(12, 6);
    expect(m("abcd", 12, true)).toBeGreaterThan(24);
  });
});

describe("fitFountainValueLabels", () => {
  it("wide columns: every line kept, at the normal size", () => {
    const fit = fitFountainValueLabels([car, car], 200, measure);
    expect(fit.dropped).toBe("none");
    expect(fit.fontSize).toBe(FOUNTAIN_LABEL_FONT);
    expect(fit.blocks[0].map((l) => l.text)).toEqual([
      "usual 30",
      "lowest 22",
      "highest 55",
      "17 of 20",
      "on time",
    ]);
    expect(fit.blocks[0].map((l) => l.kind)).toEqual([
      "usual",
      "low",
      "high",
      "count",
      "countLabel",
    ]);
    expect(fit.maxLines).toBe(5);
    expect(fit.lineHeight).toBeGreaterThanOrEqual(fit.fontSize);
  });

  it("prefers a slightly smaller font to wrapping a line", () => {
    // "highest 55": 66 px at 11, 60 px at 10.
    const fit = fitFountainValueLabels([car], 60 + FOUNTAIN_LABEL_GAP, measure);
    expect(fit.dropped).toBe("none");
    expect(fit.fontSize).toBe(10);
    expect(fit.blocks[0].map((l) => l.text)).toEqual(car.map((l) => l.text));
  });

  it("wraps a line that is too wide; the pieces keep the line's kind and weight", () => {
    // "highest 55" = 54 px even at 9 px, so it wraps (at 11 px: "highest" = 46.2 px).
    const fit = fitFountainValueLabels([car], 50 + FOUNTAIN_LABEL_GAP, measure);
    expect(fit.fontSize).toBe(11);
    expect(fit.dropped).toBe("none");
    const high = fit.blocks[0].filter((l) => l.kind === "high");
    expect(high.map((l) => l.text)).toEqual(["highest", "55"]);
    expect(fit.maxLines).toBeGreaterThan(5);
  });

  it("shrinks the font before dropping anything", () => {
    // "highest" = 7 chars: 46.2 px at 11, 42 at 10, 37.8 at 9.
    const fit = fitFountainValueLabels([car], 40 + FOUNTAIN_LABEL_GAP, measure);
    expect(fit.dropped).toBe("none");
    expect(fit.fontSize).toBe(9);
  });

  it("then drops the low and high lines (the end lines), never the usual value", () => {
    // 30 px: "highest"/"lowest" do not fit even at 9 px; "usual" fits at 10 px.
    const fit = fitFountainValueLabels([car], 30 + FOUNTAIN_LABEL_GAP, measure);
    expect(fit.dropped).toBe("ends");
    expect(fit.fontSize).toBe(10);
    const kinds = fit.blocks[0].map((l) => l.kind);
    expect(kinds).not.toContain("low");
    expect(kinds).not.toContain("high");
    expect(kinds[0]).toBe("usual");
  });

  it("drops every value label when even the usual line cannot fit", () => {
    const fit = fitFountainValueLabels([car, car], 12 + FOUNTAIN_LABEL_GAP, measure);
    expect(fit.dropped).toBe("all");
    expect(fit.blocks).toEqual([[], []]);
    expect(fit.maxLines).toBe(0);
  });

  it("no labels at all: nothing dropped, no lines", () => {
    const fit = fitFountainValueLabels([[], []], 100, measure);
    expect(fit.dropped).toBe("none");
    expect(fit.maxLines).toBe(0);
  });
});

describe("reference line labels", () => {
  it("wrap to the width, first line bold, and report the width they need", () => {
    const r = wrapFountainReferenceLabel("Time I allow: 45 min", 90, measure);
    // 11 px: 6.6 per char, 90 px holds 13 chars.
    expect(r.lines.map((l) => l.text)).toEqual(["Time I allow:", "45 min"]);
    expect(r.lines.map((l) => l.bold)).toEqual([true, false]);
    expect(r.width).toBeCloseTo(13 * 6.6, 6);
  });

  it("an empty label has no lines and needs no width", () => {
    expect(wrapFountainReferenceLabel(undefined, 90, measure)).toEqual({ lines: [], width: 0 });
  });

  it("are centred on their line, and pushed down so two labels never overlap", () => {
    const placed = placeFountainReferenceLabels(
      [
        { y: 105, lineCount: 2 },
        { y: 100, lineCount: 2 },
      ],
      13,
    );
    // The higher line (y 100) keeps its place; the other starts below its last line.
    expect(placed[1]).toBeCloseTo(104, 6);
    expect(placed[0]).toBeGreaterThanOrEqual(placed[1] + 2 * 13);
  });
});

describe("fountainBottomLayout", () => {
  it("value labels start under the x label; the margin holds every line", () => {
    const b = fountainBottomLayout({
      axisLabelBaseline: 20,
      valueLines: 5,
      lineHeight: 13,
      guideLines: 0,
    });
    expect(b.valueLabelTop).toBe(35);
    expect(b.bottom).toBe(35 + 4 * 13 + 4 + 6);
    expect(b.guideTop).toBeNull();
  });

  it("the reading guide goes under everything, after a rule", () => {
    const b = fountainBottomLayout({
      axisLabelBaseline: 20,
      valueLines: 2,
      lineHeight: 13,
      guideLines: 2,
    });
    const lastValue = b.valueLabelTop + 13;
    expect(b.ruleY!).toBeGreaterThan(lastValue);
    expect(b.guideTop!).toBeGreaterThan(b.ruleY!);
    expect(b.bottom).toBe(b.guideTop! + 13 + 4 + 6);
  });

  it("no value labels and no guide: just the axis labels", () => {
    const b = fountainBottomLayout({
      axisLabelBaseline: 26,
      valueLines: 0,
      lineHeight: 13,
      guideLines: 0,
    });
    expect(b.bottom).toBe(26 + 4 + 6);
  });
});

describe("fountainYTitleLayout", () => {
  it("sits left of the tick labels and asks for the left margin it needs", () => {
    const t = fountainYTitleLayout({ maxTickLabelWidth: 20, marginLeft: 70 });
    expect(t.requiredLeft).toBe(50);
    expect(t.x).toBe(70 - 20 - 19);
    const tight = fountainYTitleLayout({ maxTickLabelWidth: 40, marginLeft: 60 });
    expect(tight.requiredLeft).toBe(70);
  });
});
