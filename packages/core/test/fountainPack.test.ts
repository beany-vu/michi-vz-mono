import { describe, it, expect } from "vitest";
import {
  packFountainDots,
  bellOutline,
  bellAt,
  fountainHalfWidth,
  FOUNTAIN_BIG_DOT_RADIUS,
  FOUNTAIN_DOT_RADIUS,
  FOUNTAIN_DOT_SPACING,
  FOUNTAIN_LANE_OFFSET,
  type PackBell,
} from "../src/fountainChart/geometry";
import { checkDots, overflowAt, rowAt } from "./fountainOutline";

// y scale: 0..100 over 400..0 px (4 px per unit).
const y = (v: number): number => 400 - v * 4;

function bellFor(
  low: number,
  high: number,
  value: number,
  n: number,
  opts: { slot?: number; drift?: boolean; cx?: number } = {},
): PackBell {
  return {
    cx: opts.cx ?? 200,
    yTop: y(high),
    yBottom: y(low),
    half: fountainHalfWidth(n, opts.slot ?? 120),
    drift: opts.drift ?? false,
    valueY: y(value),
  };
}

/**
 * Every dot inside the bell: its disc goes at most 0.6 px (half the outline's stroke)
 * past the drawn outline, or, in a row with no such spot (near the tip), at most 0.05 px
 * further out than the best spot in its row. None fully under the big dot where its row
 * has a spot within that allowance the big dot leaves showing, and no two at one point
 * where the row has room for them apart.
 */
function expectInside(bell: PackBell, dots: Array<{ x: number; y: number; value: number }>): void {
  const big = { x: bell.cx, y: bell.valueY, r: bell.bigR ?? FOUNTAIN_BIG_DOT_RADIUS };
  expect(checkDots(bellOutline(bell), big, dots)).toEqual({
    outside: [],
    hidden: [],
    together: [],
  });
}

const commute = [29, 31, 27, 30, 55, 28, 33, 30, 26, 35, 22, 30, 34, 46, 27, 29, 32, 35, 25, 48];

describe("packFountainDots", () => {
  it("one dot per sample, each at its exact y", () => {
    const bell = bellFor(22, 55, 30, commute.length);
    const dots = packFountainDots(commute, y, bell);
    expect(dots).toHaveLength(commute.length);
    expect(dots.map((d) => d.value)).toEqual([...commute].sort((a, b) => a - b));
    for (const d of dots) expect(d.y).toBe(y(d.value));
  });

  it("every dot sits inside the bell at its height, drift off and on", () => {
    for (const drift of [false, true]) {
      const bell = bellFor(22, 55, 30, commute.length, { drift });
      expectInside(bell, packFountainDots(commute, y, bell));
    }
  });

  it("a crowd of 60 samples in a narrow slot still never leaves the bell", () => {
    const crowd = Array.from({ length: 60 }, (_, i) => 40 + ((i * 7) % 11) * 0.5);
    for (const drift of [false, true]) {
      const bell = bellFor(40, 45, 42, crowd.length, { slot: 30, drift });
      expect(bell.half).toBeCloseTo(9.6, 10);
      const dots = packFountainDots(crowd, y, bell);
      expect(dots).toHaveLength(60);
      expectInside(bell, dots);
    }
  });

  it("is deterministic: same input, same layout, whatever the input order", () => {
    const bell = bellFor(22, 55, 30, commute.length);
    const a = packFountainDots(commute, y, bell);
    const b = packFountainDots([...commute].reverse(), y, bell);
    expect(b).toEqual(a);
    expect(packFountainDots(commute, y, bell)).toEqual(a);
  });

  it("the highest sample sits on the tip, drift off and on", () => {
    // Where its disc pokes least through the dome's sides: on the axis of a straight
    // bell; with the drift a fraction of a px back from the leaning tip.
    for (const drift of [false, true]) {
      const bell = bellFor(22, 55, 30, commute.length, { drift });
      const dots = packFountainDots(commute, y, bell);
      expectInside(bell, dots);
      const top = dots[dots.length - 1];
      expect(top.value).toBe(55);
      expect(top.y).toBe(bell.yTop);
      const tip = bellAt(bell, bell.yTop).centre;
      if (drift) expect(Math.abs(top.x - tip)).toBeLessThan(0.5);
      else expect(top.x).toBeCloseTo(tip, 10);
    }
  });

  it("big dot at the very top: the lane gives way near the tip instead of leaving the bell", () => {
    // value === high, so the samples near the tip are in the lane region, where the
    // bell is narrower than the lane offset.
    const often = [30, 36, 42, 48, 50, 52, 53, 54, 55, 56, 57, 58, 58, 59, 60, 60, 61, 61, 62, 62];
    for (const drift of [false, true]) {
      const bell = bellFor(30, 62, 62, often.length, { drift });
      const dots = packFountainDots(often, y, bell);
      expectInside(bell, dots);
      for (const d of dots.filter((p) => p.value === 62)) {
        expect(Math.abs(d.x - bellAt(bell, bell.yTop).centre)).toBeLessThan(0.5);
      }
    }
  });

  it("keeps a clear centre lane at and below the big dot, where the stem is", () => {
    const bell = bellFor(20, 60, 40, 21);
    const samples = [20, 22, 24, 25, 27, 29, 30, 32, 33, 35, 37, 38, 40, 40, 41];
    const dots = packFountainDots(samples, y, bell);
    const low = dots.filter((d) => d.y > bell.valueY - 8);
    expect(low.length).toBeGreaterThan(0);
    for (const d of low) {
      expect(Math.abs(d.x - bellAt(bell, d.y).centre)).toBeGreaterThanOrEqual(
        FOUNTAIN_LANE_OFFSET - 1e-9,
      );
    }
  });

  it("above the big dot a lone dot uses the centre", () => {
    const bell = bellFor(20, 60, 30, 3);
    const dots = packFountainDots([20, 30, 50], y, bell);
    const high = dots.find((d) => d.value === 50)!;
    expect(high.x).toBeCloseTo(bellAt(bell, high.y).centre, 10);
  });

  it("dots at the same height dodge sideways instead of hiding each other", () => {
    const bell = bellFor(10, 90, 20, 5);
    const dots = packFountainDots([60, 60, 60], y, bell);
    const xs = dots.map((d) => d.x).sort((a, b) => a - b);
    expect(xs[1] - xs[0]).toBeGreaterThanOrEqual(FOUNTAIN_DOT_SPACING / 2 - 1e-9);
    expect(xs[2] - xs[1]).toBeGreaterThanOrEqual(FOUNTAIN_DOT_SPACING / 2 - 1e-9);
  });

  it("a range with no height (all samples equal) packs a row without NaN", () => {
    const bell = bellFor(30, 30, 30, 4);
    const dots = packFountainDots([30, 30, 30, 30], y, bell);
    for (const d of dots) {
      expect(Number.isFinite(d.x)).toBe(true);
      expect(d.y).toBe(y(30));
    }
  });

  it("works upside down for negative values (the bell is still narrow at high)", () => {
    const yn = (v: number): number => 200 - v * 4; // 0 at 200 px, -40 at 360 px
    const bell: PackBell = {
      cx: 100,
      yTop: yn(-5),
      yBottom: yn(-35),
      half: 14,
      drift: false,
      valueY: yn(-20),
    };
    const samples = [-35, -30, -28, -22, -20, -18, -10, -5];
    const dots = packFountainDots(samples, yn, bell);
    expectInside(bell, dots);
    expect(dots[dots.length - 1].x).toBeCloseTo(100, 10);
  });

  // The big dot is drawn on top of the small dots, with a 2 px ring: a dot within
  // (big radius + 1 + small radius) of its centre is (partly) under it.
  const R = FOUNTAIN_DOT_RADIUS;
  const bigOuter = FOUNTAIN_BIG_DOT_RADIUS + 1;
  const distToBig = (bell: PackBell, d: { x: number; y: number }): number =>
    Math.hypot(d.x - bell.cx, d.y - bell.valueY);

  it("the big dot hides no small dot: a sample at the value sits beside it (just a guess)", () => {
    const samples = [33, 37, 40, 45, 52];
    const bell = bellFor(33, 52, 40, samples.length);
    const dots = packFountainDots(samples, y, bell);
    expectInside(bell, dots);
    // The bell at 40 is too narrow for a dot wholly clear of the big dot's ring, so the
    // one at the value shows most of itself beside it; the others clear it.
    for (const d of dots) {
      const need = d.value === 40 ? bigOuter + 1.5 : bigOuter + R;
      expect(distToBig(bell, d) + R).toBeGreaterThanOrEqual(need - 1e-9);
    }
    // Five separate dots: no two overlap.
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        expect(Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y)).toBeGreaterThanOrEqual(
          2 * R,
        );
      }
    }
  });

  it("clears the big dot on every row it reaches, above and below, drift off and on", () => {
    // The anatomy car: three 30s at the value, 29 and 31 just beside it.
    const car = [22, 24, 25, 26, 27, 27, 28, 28, 29, 30, 30, 30, 31, 31, 32, 33, 34, 36, 48, 55];
    for (const drift of [false, true]) {
      const bell = bellFor(22, 55, 30, car.length, { drift });
      const dots = packFountainDots(car, y, bell);
      expectInside(bell, dots);
      for (const d of dots) {
        expect(distToBig(bell, d)).toBeGreaterThanOrEqual(bigOuter + R - 1e-9);
      }
    }
  });

  it("uses the jet's big dot radius on a narrow slot", () => {
    const bell = { ...bellFor(33, 52, 40, 5, { slot: 40 }), bigR: 4 };
    const dots = packFountainDots([33, 37, 40, 45, 52], y, bell);
    const at = dots.find((d) => d.value === 40)!;
    expect(distToBig(bell, at)).toBeGreaterThanOrEqual(4 + 1 + R - 1e-9);
    expectInside(bell, dots);
  });

  it("ties at the big dot's height (30 x6, 31, 25): inside the bell, none hidden", () => {
    // The bell at 30 is barely wider than the big dot, so the six 30s share the thin
    // strip beside it: inside the bell first, then visible (they may share a point).
    const ties = [30, 30, 30, 30, 30, 30, 31, 25];
    for (const pxPerUnit of [12, 30]) {
      const yy = (v: number): number => 400 - v * pxPerUnit;
      const bell: PackBell = {
        cx: 200,
        yTop: yy(31),
        yBottom: yy(25),
        half: fountainHalfWidth(ties.length, 120),
        drift: false,
        valueY: yy(30),
        baselineY: yy(0),
      };
      const dots = packFountainDots(ties, yy, bell);
      expect(dots).toHaveLength(8);
      expectInside(bell, dots);
      // Never fully covered by the big dot: some of every small dot shows past its ring.
      for (const d of dots) expect(distToBig(bell, d) + R).toBeGreaterThan(bigOuter);
    }
  });

  it("ties at the big dot's height with room beside it (30 x6, 36, 25): no two at one point", () => {
    const ties = [30, 30, 30, 30, 30, 30, 36, 25];
    for (const [pxPerUnit, drift] of [
      [12, false],
      [30, false],
      [12, true],
    ] as const) {
      const yy = (v: number): number => 400 - v * pxPerUnit;
      const bell: PackBell = {
        cx: 200,
        yTop: yy(36),
        yBottom: yy(25),
        half: fountainHalfWidth(ties.length, 120),
        drift,
        valueY: yy(30),
        baselineY: yy(0),
      };
      const dots = packFountainDots(ties, yy, bell);
      expect(dots).toHaveLength(8);
      expectInside(bell, dots);
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          expect(Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y)).toBeGreaterThan(0.5);
        }
      }
      for (const d of dots) expect(distToBig(bell, d) + R).toBeGreaterThan(bigOuter);
    }
  });

  it("negative values: the clear lane follows the stem, from the baseline down to the big dot", () => {
    const yn = (v: number): number => 200 - v * 6; // 0 at 200 px
    const gain = [2, 4, 6, 8, 10, 10, 12, 14, 16, 18, 20];
    const loss = gain.map((v) => -v);
    const bellOf = (lo: number, hi: number, value: number): PackBell => ({
      cx: 100,
      yTop: yn(hi),
      yBottom: yn(lo),
      half: fountainHalfWidth(gain.length, 120),
      drift: false,
      valueY: yn(value),
      baselineY: yn(0),
    });
    const cases: Array<[number[], PackBell]> = [
      [gain, bellOf(2, 20, 10)],
      [loss, bellOf(-20, -2, -10)],
    ];
    for (const [samples, bell] of cases) {
      const dots = packFountainDots(samples, yn, bell);
      expectInside(bell, dots);
      const top = Math.min(bell.valueY, bell.baselineY!);
      const bottom = Math.max(bell.valueY, bell.baselineY!);
      // Beside the stem, wherever the bell is wide enough for the lane (at the tip the
      // bell is a point, and the dot there stays inside it).
      const onStem = dots.filter(
        (d) =>
          d.y >= top && d.y <= bottom && bellAt(bell, d.y).halfWidth - 1.5 >= FOUNTAIN_LANE_OFFSET,
      );
      expect(onStem.length).toBeGreaterThan(0);
      for (const d of onStem) {
        expect(Math.abs(d.x - bell.cx)).toBeGreaterThanOrEqual(FOUNTAIN_LANE_OFFSET - 1e-9);
      }
    }
  });

  it("below the baseline (no stem there) a lone dot may use the centre", () => {
    // value 10, range -8..20: the stem stops at 0, so -8 sits on the centre line.
    const bell: PackBell = { ...bellFor(-8, 20, 10, 4), baselineY: y(0) };
    const dots = packFountainDots([-8, 5, 10, 20], y, bell);
    const low = dots.find((d) => d.value === -8)!;
    expect(low.x).toBeCloseTo(bellAt(bell, low.y).centre, 10);
    expectInside(bell, dots);
  });

  it("with drift the lane and the big dot stay at the stem (cx), not the leaning centre", () => {
    const car = [22, 24, 25, 26, 27, 27, 28, 28, 29, 30, 30, 30, 31, 31, 32, 33, 34, 36, 48, 55];
    const bell = { ...bellFor(22, 55, 30, car.length, { drift: true }), baselineY: y(0) };
    const dots = packFountainDots(car, y, bell);
    for (const d of dots.filter((p) => p.y >= bell.valueY)) {
      expect(Math.abs(d.x - bell.cx)).toBeGreaterThanOrEqual(FOUNTAIN_LANE_OFFSET - 1e-9);
    }
  });

  // Bells read back from the examples as a browser draws them (the y scale fitted to the
  // drawn dots, the rest from the drawn marks), where a small dot went further out of the
  // fountain, further under the big dot or closer to another dot than it had to.
  const internet7am = [
    95, 93, 97, 94, 91, 96, 94, 98, 93, 95, 88, 94, 96, 92, 97, 94, 93, 95, 96, 94,
  ];
  const internet1am = [
    96, 94, 98, 95, 93, 97, 90, 95, 99, 94, 96, 92, 97, 95, 98, 93, 96, 95, 97, 94,
  ];
  const browserCases: Array<{
    name: string;
    samples: number[];
    y: (v: number) => number;
    bell: Omit<PackBell, "drift">;
    drifts: boolean[];
  }> = [
    {
      // 3 px below the tip, where no whole disc fits: it went 1.06 px out (1.25 with the
      // drift) where a spot on the axis is 0.24 px out.
      name: "home-internet 9 pm at 390 x 340: the 77 just under the tip",
      samples: [66, 38, 71, 58, 22, 75, 62, 45, 80, 34, 68, 63, 27, 73, 52, 62, 77, 31, 64, 60],
      y: (v) => 170 - v,
      bell: {
        cx: 237.1,
        yTop: 90,
        yBottom: 148,
        half: 16.19,
        valueY: 108,
        baselineY: 170,
        bigR: 6.5,
      },
      drifts: [false, true],
    },
    {
      // With the drift the 61 went 0.68 px out, at every 340 px tall size.
      name: "key-often-bad at 700 x 340: the 61 beside the tip",
      samples: [30, 36, 42, 48, 50, 52, 53, 54, 55, 55, 55, 56, 57, 58, 58, 59, 60, 60, 61, 62],
      y: (v) => 269 - (v * 21.9) / 7,
      bell: {
        cx: 360,
        yTop: 269 - (62 * 21.9) / 7,
        yBottom: 269 - (30 * 21.9) / 7,
        half: fountainHalfWidth(20, 200),
        valueY: 269 - (55 * 21.9) / 7,
        baselineY: 269,
        bigR: 6.5,
      },
      drifts: [false, true],
    },
    {
      // 2 px below the tip the 41 went 1.62 px out through the dome's side; on the axis
      // it is 0.20 px out.
      name: "commute E-bike at 700 x 340: the 41 two px below the tip",
      samples: [37, 38, 36, 39, 42, 38, 39, 38, 35, 40, 37, 38, 39, 41, 36, 38, 40, 37, 39, 38],
      y: (v) => 215 - v * 2.0625,
      bell: {
        cx: 539.5,
        yTop: 215 - 42 * 2.0625,
        yBottom: 215 - 35 * 2.0625,
        half: fountainHalfWidth(20, 200),
        valueY: 215 - 38 * 2.0625,
        baselineY: 215,
        bigR: 6.5,
      },
      drifts: [false, true],
    },
    {
      // The three 96s, 2.65 px below the tip, went up to 1.82 px out (best 0.11).
      name: "home-internet 7 am at 700 x 340: the 96s just under the tip",
      samples: internet7am,
      y: (v) => 209 - v * 1.325,
      bell: {
        cx: 116.3,
        yTop: 209 - 98 * 1.325,
        yBottom: 209 - 88 * 1.325,
        half: fountainHalfWidth(20, 200),
        valueY: 209 - 94 * 1.325,
        baselineY: 209,
        bigR: 6.5,
      },
      drifts: [false, true],
    },
    {
      // The three 16.5s were drawn 0.35-0.44 px apart with 4.8 px of room at 0.6 px.
      name: "phone-battery Year 3 at 700 x 340: three 16.5s at the top",
      samples: [
        15.5, 13, 16, 11, 14.5, 16.5, 12, 15, 17, 10, 16, 13, 14.5, 16.5, 11, 15.5, 12.5, 16, 14,
        15, 16.5,
      ],
      y: (v) => 209 - v * 6.36,
      bell: {
        cx: 403.75,
        yTop: 209 - 17 * 6.36,
        yBottom: 209 - 10 * 6.36,
        half: fountainHalfWidth(21, 200),
        valueY: 209 - 15 * 6.36,
        baselineY: 209,
        bigR: 6.5,
      },
      drifts: [false, true],
    },
    {
      // A 10 px tall bell of 20 dots: the three 95s were wholly under the big dot, though
      // a sliver where each shows is within 0.6 px of the outline.
      name: "home-internet 7 am at 390 x 340: three 95s beside the big dot",
      samples: internet7am,
      y: (v) => 170 - v,
      bell: { cx: 85.3, yTop: 72, yBottom: 82, half: 16.19, valueY: 76, baselineY: 170, bigR: 6.5 },
      drifts: [false, true],
    },
    {
      // The same for the three 96s at 1 am.
      name: "home-internet 1 am at 390 x 340: three 96s beside the big dot",
      samples: internet1am,
      y: (v) => 170 - v,
      bell: {
        cx: 287.7,
        yTop: 71,
        yBottom: 80,
        half: 16.19,
        valueY: 75,
        baselineY: 170,
        bigR: 6.5,
      },
      drifts: [false, true],
    },
  ];
  for (const c of browserCases) {
    it(`${c.name}: the best spot its row has, drift off and on`, () => {
      for (const drift of c.drifts) {
        const bell: PackBell = { ...c.bell, drift };
        expectInside(bell, packFountainDots(c.samples, c.y, bell));
      }
    });
  }

  it("a dot less than a radius below the tip sits where its disc pokes out least", () => {
    // The E-bike bell: the 41 is 2 px below the tip, so its disc reaches above it; the
    // best spot is on the axis, where it pokes 0.2 px through the dome's sides.
    const c = browserCases[2];
    const bell: PackBell = { ...c.bell, drift: false };
    const dots = packFountainDots(c.samples, c.y, bell);
    const d41 = dots.find((d) => d.value === 41)!;
    const pts = bellOutline(bell);
    const row = rowAt(pts, d41.y);
    expect(row.best).toBeLessThan(0.3);
    expect(overflowAt(pts, d41.x, d41.y)).toBeLessThanOrEqual(0.6);
  });

  it("packs 1 jet x 2000 samples fast (only neighbours within a spacing are checked)", () => {
    // Deterministic pseudo-random samples, 0..100, bunched near 40.
    let seed = 7;
    const rnd = (): number => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const samples = Array.from({ length: 2000 }, () => {
      const u = (rnd() + rnd() + rnd()) / 3;
      return Math.round(u * 1000) / 10;
    });
    const bell: PackBell = { ...bellFor(0, 100, 40, samples.length), baselineY: y(0) };
    // CPU time, the best of five runs after a warm-up: other test files busy on the same
    // machine (the suite runs in parallel) slow the wall clock and delay the JIT, not the
    // work this call does.
    packFountainDots(samples, y, bell);
    let ms = Infinity;
    let dots: ReturnType<typeof packFountainDots> = [];
    for (let run = 0; run < 5; run++) {
      const t0 = process.cpuUsage();
      dots = packFountainDots(samples, y, bell);
      const t = process.cpuUsage(t0);
      ms = Math.min(ms, (t.user + t.system) / 1000);
    }
    expect(dots).toHaveLength(2000);
    expectInside(bell, dots);
    expect(ms, `${ms.toFixed(1)} ms`).toBeLessThan(60);
  });
});
