import { describe, it, expect } from "vitest";
import { SYMBOL_MIN_HIT_RADIUS, symbolEffectiveHitRadius, pickNearestSymbolHit } from "../src/symbolMap/hitTest";

describe("symbolMap/hitTest (B3.7 - forgiving, nearest-match-wins hit-test)", () => {
  it("SYMBOL_MIN_HIT_RADIUS floor: a small mark's effective radius is floored, a large mark's is untouched", () => {
    expect(symbolEffectiveHitRadius({ x: 0, y: 0, radius: 3, radiusSecond: null })).toBe(SYMBOL_MIN_HIT_RADIUS);
    expect(symbolEffectiveHitRadius({ x: 0, y: 0, radius: 25, radiusSecond: null })).toBe(25);
  });

  it("considers radiusSecond - the larger of the two rings floors/wins", () => {
    // valueSecond ring bigger than primary but still under the floor.
    expect(symbolEffectiveHitRadius({ x: 0, y: 0, radius: 2, radiusSecond: 5 })).toBe(SYMBOL_MIN_HIT_RADIUS);
    // valueSecond ring bigger than primary AND over the floor.
    expect(symbolEffectiveHitRadius({ x: 0, y: 0, radius: 4, radiusSecond: 12 })).toBe(12);
  });

  it("repro: a pointer at the exact center of a small (r=3) node hits it", () => {
    const tiny = { x: 50, y: 50, radius: 3, radiusSecond: null };
    expect(pickNearestSymbolHit([tiny], 50, 50)).toBe(tiny);
  });

  it("root cause reproduced: WITHOUT forgiveness a small node has no margin for pointer imprecision", () => {
    // A naive strict `dist <= radius` (the old behaviour) would already miss a
    // point just 4px off-center on an r=3 node - this is the exact bug: works
    // "in principle" at dead-center, fails in practice for any real pointer.
    const tiny = { x: 50, y: 50, radius: 3, radiusSecond: null };
    const naiveStrictHit = Math.hypot(4, 0) <= tiny.radius;
    expect(naiveStrictHit).toBe(false);
    // The forgiving hit-test recovers it.
    expect(pickNearestSymbolHit([tiny], 54, 50)).toBe(tiny);
  });

  it("forgiveness: a pointer 6px off a 3px node's center still hits (within SYMBOL_MIN_HIT_RADIUS=8)", () => {
    const tiny = { x: 0, y: 0, radius: 3, radiusSecond: null };
    expect(pickNearestSymbolHit([tiny], 6, 0)).toBe(tiny);
  });

  it("forgiveness has a limit: a pointer just past SYMBOL_MIN_HIT_RADIUS misses", () => {
    const tiny = { x: 0, y: 0, radius: 3, radiusSecond: null };
    expect(pickNearestSymbolHit([tiny], 8, 0)).toBe(tiny); // exactly at the floor: still hits
    expect(pickNearestSymbolHit([tiny], 9, 0)).toBeNull(); // past it: no longer hittable
  });

  it("nearest-match-wins: a close tiny node beats a large bubble whose forgiving radius also reaches the pointer", () => {
    const tiny = { id: "tiny", x: 0, y: 0, radius: 3, radiusSecond: null };
    // Center at (36, 0), radius 32: distance from the query point (6,0) is 30,
    // which is <= 32, so this large bubble ALSO qualifies as a candidate hit -
    // exactly the "large bubble 30px away" scenario from the task brief.
    const big = { id: "big", x: 36, y: 0, radius: 32, radiusSecond: null };
    // score(tiny) = 6/8 = 0.75; score(big) = 30/32 = 0.9375 - tiny wins.
    expect(pickNearestSymbolHit([tiny, big], 6, 0)).toEqual(tiny);
    // Order in the array must not matter (no first-match/break semantics).
    expect(pickNearestSymbolHit([big, tiny], 6, 0)).toEqual(tiny);
  });

  it("nearest-match-wins picks the OTHER way when the pointer is actually closer (normalized) to the big bubble", () => {
    const tiny = { id: "tiny", x: 0, y: 0, radius: 3, radiusSecond: null };
    const big = { id: "big", x: 36, y: 0, radius: 32, radiusSecond: null };
    // Query point dead-center on the big bubble: score(big) = 0, wins outright
    // even though it's also within tiny's forgiving radius region? (it isn't -
    // 36 > 8 - so this also proves the big bubble alone is picked correctly.)
    expect(pickNearestSymbolHit([tiny, big], 36, 0)).toEqual(big);
  });

  it("large-bubble behaviour is unchanged: pointer inside r hits it, exactly as strict containment would", () => {
    const big = { x: 100, y: 100, radius: 25, radiusSecond: null };
    expect(pickNearestSymbolHit([big], 100, 100)).toBe(big); // dead center
    expect(pickNearestSymbolHit([big], 120, 100)).toBe(big); // 20px in, inside r=25
    expect(pickNearestSymbolHit([big], 126, 100)).toBeNull(); // 26px out, outside r=25 - no floor added since 25 >= SYMBOL_MIN_HIT_RADIUS
  });

  it("returns null when the pointer is outside every mark's effective radius", () => {
    const marks = [
      { x: 0, y: 0, radius: 3, radiusSecond: null },
      { x: 200, y: 200, radius: 10, radiusSecond: null },
    ];
    expect(pickNearestSymbolHit(marks, 1000, 1000)).toBeNull();
  });
});
