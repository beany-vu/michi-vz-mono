import { describe, it, expect } from "vitest";
import { mountGaugeChart } from "../src/engine/gaugeChart";
import type { GaugeChartProps } from "../src/types";
import {
  buildGaugeAnnotations,
  hitTestGaugeAnnotations,
  GAUGE_ANNOTATION_HIT,
} from "../src/gaugeChart/annotations";

// A half gauge, centre (180, 168), outer edge 124, scale 5000..17000, one ring at 7800.
const base = {
  cx: 180,
  cy: 168,
  outerRadius: 124,
  startAngle: -Math.PI / 2,
  sweepAngle: Math.PI,
  min: 5000,
  max: 17000,
  valueFormatter: (v: number) => String(v),
};

const ringAt = (fraction: number | null) => [
  {
    index: 0,
    radius: 119,
    fraction,
    stroke: "#0d5eaf",
    colorKey: "Greece",
    dataLabelSafe: "Greece",
  },
];

const build = (fraction: number | null = (7800 - 5000) / 12000) =>
  buildGaugeAnnotations({
    ...base,
    rings: ringAt(fraction),
    valueMarker: true,
    ticks: [{ value: 8400, label: "AVG", valueLabel: "$8.4 k" }],
    endLabels: {
      min: { label: "MIN", valueLabel: "$5 k" },
      max: { label: "MAX", valueLabel: "$17 k" },
    },
  });

describe("gauge tick marks carry their value", () => {
  it("reports the CLAMPED value, so a hover readout never quotes an off-scale number", () => {
    const a = buildGaugeAnnotations({
      ...base,
      rings: ringAt(0.5),
      ticks: [{ value: 8400 }, { value: 99000 }],
    });

    expect(a.ticks[0].value).toBe(8400);
    expect(a.ticks[1].value).toBe(17000);
  });
});

describe("hitTestGaugeAnnotations", () => {
  it("finds a tick by its LABEL anchor, which is what the pointer aims at", () => {
    const a = build();
    const tick = a.ticks[0];

    expect(hitTestGaugeAnnotations(a, tick.labelX, tick.labelY)).toEqual({
      kind: "tick",
      index: 0,
    });
    // Both label lines (caption 6px above, value 7px below) sit inside the hit area.
    expect(hitTestGaugeAnnotations(a, tick.labelX, tick.labelY - 6)).toEqual({
      kind: "tick",
      index: 0,
    });
    expect(hitTestGaugeAnnotations(a, tick.labelX, tick.labelY + 7)).toEqual({
      kind: "tick",
      index: 0,
    });
  });

  it("finds each end label by its own anchor", () => {
    const a = build();

    expect(hitTestGaugeAnnotations(a, a.endLabels[0].x, a.endLabels[0].y)).toEqual({
      kind: "endLabel",
      index: 0,
    });
    expect(hitTestGaugeAnnotations(a, a.endLabels[1].x, a.endLabels[1].y)).toEqual({
      kind: "endLabel",
      index: 1,
    });
  });

  it("finds a marker within its own circle, not the generic label radius", () => {
    const a = build();
    const m = a.markers[0];

    expect(hitTestGaugeAnnotations(a, m.x, m.y)).toEqual({ kind: "marker", index: 0 });
    // Just outside the marker circle (radius 8 + 4 forgiveness) and far from any label.
    expect(hitTestGaugeAnnotations(a, m.x + 13, m.y)).toBeNull();
  });

  it("returns null in empty space", () => {
    expect(hitTestGaugeAnnotations(build(), 180, 168)).toBeNull();
  });

  it("prefers the marker when a tick label overlaps it", () => {
    // A tick placed at the ring value puts its label near the marker; the marker sits on
    // the arc and is the smaller, more deliberate target, so it wins.
    const a = buildGaugeAnnotations({
      ...base,
      rings: ringAt(0.5),
      valueMarker: true,
      ticks: [{ value: 11000 }],
    });
    const m = a.markers[0];

    expect(hitTestGaugeAnnotations(a, m.x, m.y)).toEqual({ kind: "marker", index: 0 });
  });

  it("keeps ticks and end labels hoverable when the ring has no value", () => {
    // The origin has no recorded exports: the marker is gone, but the spread it sits in
    // is still real and the reader still wants MIN / AVG / MAX.
    const a = build(null);
    expect(a.markers).toHaveLength(0);

    expect(hitTestGaugeAnnotations(a, a.ticks[0].labelX, a.ticks[0].labelY)).toEqual({
      kind: "tick",
      index: 0,
    });
    expect(hitTestGaugeAnnotations(a, a.endLabels[1].x, a.endLabels[1].y)).toEqual({
      kind: "endLabel",
      index: 1,
    });
  });

  it("honours a custom hit radius", () => {
    const a = build();
    const t = a.ticks[0];
    const justOutside = GAUGE_ANNOTATION_HIT + 4;

    expect(hitTestGaugeAnnotations(a, t.labelX + justOutside, t.labelY)).toBeNull();
    expect(hitTestGaugeAnnotations(a, t.labelX + justOutside, t.labelY, justOutside + 1)).toEqual({
      kind: "tick",
      index: 0,
    });
  });

  it("is null for an annotation set with nothing in it", () => {
    const a = buildGaugeAnnotations({ ...base, rings: ringAt(0.5) });

    expect(a.ticks).toHaveLength(0);
    expect(hitTestGaugeAnnotations(a, 100, 100)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Engine wiring (jsdom). getBoundingClientRect is all zeros here, so client
// coordinates ARE svg coordinates and the annotation x/y attributes can be
// hovered directly.
// ---------------------------------------------------------------------------

function mountPositioning(extra: Partial<GaugeChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountGaugeChart(host, {
    dataSet: [{ label: "Greece", value: 7800, color: "#0d5eaf" }],
    width: 360,
    height: 220,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    min: 5000,
    max: 17000,
    startAngle: -90,
    sweepAngle: 180,
    sweepFit: true,
    ringThickness: 10,
    valueMarker: true,
    ticks: [{ value: 8400, label: "AVG", valueLabel: "$8.4 k" }],
    endLabels: {
      min: { label: "MIN", valueLabel: "$5 k" },
      max: { label: "MAX", valueLabel: "$17 k" },
    },
    ...extra,
  });
  return { host, chart };
}

const captionAt = (host: HTMLElement, caption: string): SVGTextElement => {
  const node = Array.from(host.querySelectorAll<SVGTextElement>("text.mv-gauge-tick-label")).find(
    (t) => t.textContent === caption,
  );
  if (!node) throw new Error(`no annotation caption ${caption}`);
  return node;
};

const hover = (host: HTMLElement, x: number, y: number): void => {
  host.dispatchEvent(new MouseEvent("mousemove", { clientX: x, clientY: y, bubbles: true }));
};

const hoverCaption = (host: HTMLElement, caption: string): void => {
  const node = captionAt(host, caption);
  // The caption is drawn 6px ABOVE the anchor the hit test uses.
  hover(host, Number(node.getAttribute("x")), Number(node.getAttribute("y")) + 6);
};

const tip = (host: HTMLElement) => host.querySelector<HTMLElement>(".tooltip")!;

describe("gauge annotation hover (engine)", () => {
  it("is opt-in: without a formatter the annotations stay inert", () => {
    const { host, chart } = mountPositioning();

    hoverCaption(host, "AVG");

    expect(tip(host).style.visibility).toBe("hidden");
    chart.destroy();
    host.remove();
  });

  it("shows the formatter's html for a reference tick, with its caption and clamped value", () => {
    const seen: unknown[] = [];
    const { host, chart } = mountPositioning({
      annotationTooltipFormatter: (a) => {
        seen.push(a);
        return `<b>${a.label}</b> ${a.value}`;
      },
    });

    hoverCaption(host, "AVG");

    expect(tip(host).style.visibility).toBe("visible");
    expect(tip(host).textContent).toBe("AVG 8400");
    expect(seen[0]).toMatchObject({
      kind: "tick",
      label: "AVG",
      valueLabel: "$8.4 k",
      value: 8400,
      ring: null,
    });
    chart.destroy();
    host.remove();
  });

  it("names which end an end label is, and reports that end of the scale", () => {
    const seen: unknown[] = [];
    const { host, chart } = mountPositioning({
      annotationTooltipFormatter: (a) => {
        seen.push(a);
        return "x";
      },
    });

    hoverCaption(host, "MIN");
    hoverCaption(host, "MAX");

    expect(seen[0]).toMatchObject({ kind: "endLabel", end: "min", value: 5000, label: "MIN" });
    expect(seen[1]).toMatchObject({ kind: "endLabel", end: "max", value: 17000, label: "MAX" });
    chart.destroy();
    host.remove();
  });

  it("leaves the active ring alone, so the centre readout does not move", () => {
    const { host, chart } = mountPositioning({
      annotationTooltipFormatter: () => "x",
      centerContent: (ring) => `<i>${ring ? ring.label : "none"}</i>`,
    });
    const before = host.querySelector<HTMLElement>(".mv-gauge-center")!.textContent;

    hoverCaption(host, "AVG");

    expect(host.querySelector<HTMLElement>(".mv-gauge-center")!.textContent).toBe(before);
    expect(before).toBe("Greece");
    chart.destroy();
    host.remove();
  });

  it("shows nothing when the formatter returns null, and hides again on the way out", () => {
    const { host, chart } = mountPositioning({
      annotationTooltipFormatter: (a) => (a.kind === "endLabel" ? null : "shown"),
    });

    hoverCaption(host, "MIN");
    expect(tip(host).style.visibility).toBe("hidden");

    hoverCaption(host, "AVG");
    expect(tip(host).style.visibility).toBe("visible");

    hover(host, 5, 5); // empty space
    expect(tip(host).style.visibility).toBe("hidden");
    chart.destroy();
    host.remove();
  });

  it("keeps the scale's annotations hoverable when the ring has no value", () => {
    // No marker to hover, but MIN / AVG / MAX still describe a real spread.
    const { host, chart } = mountPositioning({
      dataSet: [{ label: "Greece", value: null, color: "#0d5eaf" }],
      annotationTooltipFormatter: (a) => `${a.kind}:${a.value}`,
    });

    expect(host.querySelectorAll("circle.mv-gauge-marker")).toHaveLength(0);

    hoverCaption(host, "AVG");
    expect(tip(host).textContent).toBe("tick:8400");
    chart.destroy();
    host.remove();
  });
});
