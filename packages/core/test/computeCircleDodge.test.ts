import { describe, it, expect } from "vitest";
import { computeCircleDodgeOffsets } from "../src/barBell/computeCircleDodge";

describe("computeCircleDodgeOffsets", () => {
  it("returns all zeros when no caps overlap (gaps >= a diameter)", () => {
    expect(computeCircleDodgeOffsets([0, 20, 40], 6)).toEqual([0, 0, 0]);
  });

  it("spreads an overlapping cluster symmetrically around the centre line", () => {
    // 3 caps at the same x → spread to [-d, 0, +d] with d = 2*radius = 12.
    expect(computeCircleDodgeOffsets([10, 10, 10], 6)).toEqual([-12, 0, 12]);
  });

  it("compresses a cluster to fit within boxHeight instead of spilling out", () => {
    // 3 caps, box height 20 → centre span capped at boxHeight-diameter=8 over 2
    // gaps → step 4 → [-4, 0, +4] (smaller than the natural 12).
    expect(computeCircleDodgeOffsets([5, 5, 5], 6, 20)).toEqual([-4, 0, 4]);
  });

  it("leaves a lone cap unmoved", () => {
    expect(computeCircleDodgeOffsets([7], 6)).toEqual([0]);
  });
});
