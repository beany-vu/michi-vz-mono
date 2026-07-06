import { describe, it, expect } from "vitest";
import { processRadialTreeData } from "../src/radialTree/data";
import { buildRadialTreeColors } from "../src/radialTree/colors";
import { buildRadialTreeRadiusScale } from "../src/radialTree/scales";
import { layoutRadialTree, radialProjection } from "../src/radialTree/layout";
import {
  buildRadialTreeRenderModel,
  computeLabelDensity,
  wrapCenterLabel,
  centerLineOffsets,
} from "../src/radialTree/renderModel";
import { buildRadialTreeContext } from "../src/context/buildRadialTreeContext";
import { checkRadialTreeData } from "../src/validate/radialTreeWarnings";
import type { RadialTreeNode } from "../src/types";

const twoGroupData: RadialTreeNode[] = [
  {
    label: "Sectors",
    children: [
      { label: "Coffee", value: 10 },
      { label: "Tea", value: 30 },
    ],
  },
  {
    label: "Regions",
    children: [
      { label: "Africa", value: 5 },
      { label: "Asia", value: 55 },
    ],
  },
];

describe("radialTree/data - processRadialTreeData", () => {
  it("computes a group's value as the sum of its children (own value ignored)", () => {
    const p = processRadialTreeData(twoGroupData);
    const sectors = p.groups.find((g) => g.label === "Sectors")!;
    expect(sectors.value).toBe(40);
    const regions = p.groups.find((g) => g.label === "Regions")!;
    expect(regions.value).toBe(60);
  });

  it("tags every node with its top-level ancestor as groupLabel + a full path", () => {
    const p = processRadialTreeData(twoGroupData);
    const coffee = p.leaves.find((l) => l.label === "Coffee")!;
    expect(coffee.groupLabel).toBe("Sectors");
    expect(coffee.path).toEqual(["Sectors", "Coffee"]);
  });

  it("clamps a negative leaf value to 0", () => {
    const p = processRadialTreeData([{ label: "G", children: [{ label: "Bad", value: -5 }] }]);
    expect(p.leaves[0].value).toBe(0);
  });

  it("drops disabledItems subtrees and prunes now-empty parents", () => {
    const p = processRadialTreeData(twoGroupData, { disabledItems: ["Coffee", "Tea"] });
    expect(p.groups.map((g) => g.label)).toEqual(["Regions"]);
  });

  it("reports groupKeys in encounter order and maxDepth", () => {
    const p = processRadialTreeData(twoGroupData);
    expect(p.groupKeys).toEqual(["Sectors", "Regions"]);
    expect(p.maxDepth).toBe(2);
  });

  it("tolerates a leaf with no children array at the top level (maxDepth 1)", () => {
    const p = processRadialTreeData([{ label: "Standalone", value: 5 }]);
    expect(p.maxDepth).toBe(1);
    expect(p.leaves.map((l) => l.label)).toEqual(["Standalone"]);
  });

  it("tolerates nesting deeper than 2 levels", () => {
    const p = processRadialTreeData([
      { label: "A", children: [{ label: "B", children: [{ label: "C", value: 1 }] }] },
    ]);
    expect(p.maxDepth).toBe(3);
    expect(p.leaves.map((l) => l.label)).toEqual(["C"]);
  });
});

describe("radialTree/colors - buildRadialTreeColors", () => {
  it("assigns from the palette in encounter order", () => {
    const colors = buildRadialTreeColors(["A", "B"], ["#111", "#222"]);
    expect(colors.getColor("A")).toBe("#111");
    expect(colors.getColor("B")).toBe("#222");
  });

  it("colorsMapping wins over the palette", () => {
    const colors = buildRadialTreeColors(["A"], ["#111"], { A: "#ff00ff" });
    expect(colors.getColor("A")).toBe("#ff00ff");
  });

  it("skipColorMappingDispatch resolves everything to transparent", () => {
    const colors = buildRadialTreeColors(["A"], ["#111"], undefined, true);
    expect(colors.getColor("A")).toBe("transparent");
  });
});

describe("radialTree/scales - buildRadialTreeRadiusScale", () => {
  it("scales linearly over the domain of ALL node values (groups and leaves)", () => {
    const p = processRadialTreeData(twoGroupData);
    const radiusOf = buildRadialTreeRadiusScale(p.nodes, [2, 32]);
    // domain min = 5 (Africa leaf), max = 60 (Regions group)
    expect(radiusOf(5)).toBeCloseTo(2, 5);
    expect(radiusOf(60)).toBeCloseTo(32, 5);
  });

  it("does not throw for a degenerate (all-equal) domain", () => {
    const radiusOf = buildRadialTreeRadiusScale(
      [{ label: "a", value: 10, groupLabel: "a", path: ["a"], isLeaf: true }],
      [2, 32]
    );
    expect(Number.isFinite(radiusOf(10))).toBe(true);
  });

  it("does not throw for an empty node list", () => {
    const radiusOf = buildRadialTreeRadiusScale([], [2, 32]);
    expect(Number.isFinite(radiusOf(0))).toBe(true);
  });
});

describe("radialTree/layout - layoutRadialTree (cluster, not tree)", () => {
  it("places every LEAF at the SAME radial distance from the centre (dendrogram behaviour)", () => {
    const p = processRadialTreeData(twoGroupData);
    const laidOut = layoutRadialTree(p.root, { outerRadius: 100 });
    const leafRadii = laidOut.filter((n) => n.isLeaf).map((n) => n.radius);
    expect(leafRadii.length).toBe(4);
    for (const r of leafRadii) expect(r).toBeCloseTo(leafRadii[0], 5);
  });

  it("places groups closer to the centre than leaves", () => {
    const p = processRadialTreeData(twoGroupData);
    const laidOut = layoutRadialTree(p.root, { outerRadius: 100 });
    const groupRadii = laidOut.filter((n) => n.depth === 1).map((n) => n.radius);
    const leafRadii = laidOut.filter((n) => n.isLeaf).map((n) => n.radius);
    expect(Math.max(...groupRadii)).toBeLessThan(Math.min(...leafRadii));
  });

  it("is deterministic across two independent runs", () => {
    const p = processRadialTreeData(twoGroupData);
    const a = layoutRadialTree(p.root, { outerRadius: 100 });
    const b = layoutRadialTree(p.root, { outerRadius: 100 });
    expect(a.map((n) => ({ label: n.data.label, x: n.x, y: n.y }))).toEqual(
      b.map((n) => ({ label: n.data.label, x: n.x, y: n.y }))
    );
  });

  it("returns an empty array for an empty forest", () => {
    const p = processRadialTreeData([]);
    expect(layoutRadialTree(p.root, { outerRadius: 100 })).toEqual([]);
  });

  it("radialProjection(0, r) points straight up (negative y) and (180, r) points straight down", () => {
    const up = radialProjection(0, 10);
    const down = radialProjection(180, 10);
    expect(up[0]).toBeCloseTo(0, 5);
    expect(up[1]).toBeCloseTo(-10, 5);
    expect(down[0]).toBeCloseTo(0, 5);
    expect(down[1]).toBeCloseTo(10, 5);
  });

  it("each node's link ends at the parent's projected position", () => {
    const p = processRadialTreeData(twoGroupData);
    const laidOut = layoutRadialTree(p.root, { outerRadius: 100 });
    const group = laidOut.find((n) => n.depth === 1)!;
    // A depth-1 group's parent is the synthetic (invisible) root, always at radius 0.
    expect(group.link.end[0]).toBeCloseTo(0, 5);
    expect(group.link.end[1]).toBeCloseTo(0, 5);
    const leaf = laidOut.find((n) => n.isLeaf)!;
    const parentGroup = laidOut.find((n) => n.depth === 1 && n.data.label === leaf.data.groupLabel)!;
    expect(leaf.link.end[0]).toBeCloseTo(parentGroup.x, 5);
    expect(leaf.link.end[1]).toBeCloseTo(parentGroup.y, 5);
  });
});

describe("radialTree/renderModel - computeLabelDensity", () => {
  it("does not rotate/hide below the thresholds", () => {
    expect(computeLabelDensity(5, 20, 100)).toEqual({ rotateText: false, showLabels: true });
  });
  it("rotates past rotateAbove", () => {
    expect(computeLabelDensity(21, 20, 100)).toEqual({ rotateText: true, showLabels: true });
  });
  it("hides past hideAbove", () => {
    expect(computeLabelDensity(101, 20, 100)).toEqual({ rotateText: true, showLabels: false });
  });
});

describe("radialTree/renderModel - wrapCenterLabel / centerLineOffsets", () => {
  it("wraps roughly every N characters, breaking on word boundaries", () => {
    expect(wrapCenterLabel("Total Merchandise Trade", 10)).toEqual(["Total", "Merchandise", "Trade"]);
  });
  it("returns a single line for short text", () => {
    expect(wrapCenterLabel("Trade", 10)).toEqual(["Trade"]);
  });
  it("returns [] for empty text", () => {
    expect(wrapCenterLabel("", 10)).toEqual([]);
  });
  it("nudges the offsets up for 2 lines, and further for 3+", () => {
    expect(centerLineOffsets(["a"])).toEqual([0]);
    expect(centerLineOffsets(["a", "b"])).toEqual([-4, 12]);
    expect(centerLineOffsets(["a", "b", "c"])).toEqual([-16, 0, 16]);
  });
});

describe("radialTree/renderModel - buildRadialTreeRenderModel", () => {
  it("gives every node a sized circle and shows name+value at low density", () => {
    const p = processRadialTreeData(twoGroupData);
    const laidOut = layoutRadialTree(p.root, { outerRadius: 100 });
    const colors = buildRadialTreeColors(p.groupKeys, ["#111", "#222"]);
    const radiusOf = buildRadialTreeRadiusScale(p.nodes, [2, 32]);
    const model = buildRadialTreeRenderModel(laidOut, colors, radiusOf, {
      leafCount: p.leaves.length,
      rotateAbove: 20,
      hideAbove: 100,
      outerRadius: 100,
      highlightItems: [],
      valueFormatter: (n) => String(n),
    });
    expect(model.marks.length).toBe(6); // 2 groups + 4 leaves
    expect(model.rotateText).toBe(false);
    expect(model.showLabels).toBe(true);
    const coffee = model.marks.find((m) => m.label === "Coffee")!;
    expect(coffee.labelText).toBe("Coffee");
    expect(coffee.valueText).toBe("10");
    expect(coffee.markRadius).toBeGreaterThan(0);
  });

  it("abbreviates to 3 chars + '.' and rotates once leafCount exceeds rotateAbove", () => {
    const p = processRadialTreeData(twoGroupData);
    const laidOut = layoutRadialTree(p.root, { outerRadius: 100 });
    const colors = buildRadialTreeColors(p.groupKeys, ["#111", "#222"]);
    const radiusOf = buildRadialTreeRadiusScale(p.nodes, [2, 32]);
    const model = buildRadialTreeRenderModel(laidOut, colors, radiusOf, {
      leafCount: 25,
      rotateAbove: 20,
      hideAbove: 100,
      outerRadius: 100,
      highlightItems: [],
      valueFormatter: (n) => String(n),
    });
    expect(model.rotateText).toBe(true);
    const coffee = model.marks.find((m) => m.label === "Coffee")!;
    expect(coffee.labelText).toBe("Cof.");
    expect(coffee.valueText).toBe("");
  });

  it("hides all labels once leafCount exceeds hideAbove", () => {
    const p = processRadialTreeData(twoGroupData);
    const laidOut = layoutRadialTree(p.root, { outerRadius: 100 });
    const colors = buildRadialTreeColors(p.groupKeys, ["#111", "#222"]);
    const radiusOf = buildRadialTreeRadiusScale(p.nodes, [2, 32]);
    const model = buildRadialTreeRenderModel(laidOut, colors, radiusOf, {
      leafCount: 150,
      rotateAbove: 20,
      hideAbove: 100,
      outerRadius: 100,
      highlightItems: [],
      valueFormatter: (n) => String(n),
    });
    expect(model.showLabels).toBe(false);
    expect(model.marks.every((m) => m.labelText === "")).toBe(true);
  });

  it("truncates a depth-1 group's name to 10 chars in the medium-density band, but shows a leaf's full name", () => {
    const p = processRadialTreeData([
      {
        label: "A Very Long Group Name",
        children: [{ label: "Short Leaf", value: 1 }],
      },
    ]);
    const laidOut = layoutRadialTree(p.root, { outerRadius: 100 });
    const colors = buildRadialTreeColors(p.groupKeys, ["#111"]);
    const radiusOf = buildRadialTreeRadiusScale(p.nodes, [2, 32]);
    const model = buildRadialTreeRenderModel(laidOut, colors, radiusOf, {
      leafCount: 11, // > rotateAbove/2 (10), <= rotateAbove (20)
      rotateAbove: 20,
      hideAbove: 100,
      outerRadius: 100,
      highlightItems: [],
      valueFormatter: (n) => String(n),
    });
    const group = model.marks.find((m) => m.depth === 1)!;
    expect(group.labelText).toBe("A Very Lon..");
    const leaf = model.marks.find((m) => m.isLeaf)!;
    expect(leaf.labelText).toBe("Short Leaf");
    expect(leaf.valueText).toBe("1");
  });

  it("dims nodes not in highlightItems (checked by own label or group label)", () => {
    const p = processRadialTreeData(twoGroupData);
    const laidOut = layoutRadialTree(p.root, { outerRadius: 100 });
    const colors = buildRadialTreeColors(p.groupKeys, ["#111", "#222"]);
    const radiusOf = buildRadialTreeRadiusScale(p.nodes, [2, 32]);
    const model = buildRadialTreeRenderModel(laidOut, colors, radiusOf, {
      leafCount: p.leaves.length,
      rotateAbove: 20,
      hideAbove: 100,
      outerRadius: 100,
      highlightItems: ["Sectors"],
      valueFormatter: (n) => String(n),
    });
    const coffee = model.marks.find((m) => m.label === "Coffee")!;
    const africa = model.marks.find((m) => m.label === "Africa")!;
    expect(coffee.dimmed).toBe(false); // group label "Sectors" matches
    expect(africa.dimmed).toBe(true);
  });

  it("builds a wrapped centre label + a quarter-outer-radius centre circle when centerLabel is set", () => {
    const p = processRadialTreeData(twoGroupData);
    const laidOut = layoutRadialTree(p.root, { outerRadius: 100 });
    const colors = buildRadialTreeColors(p.groupKeys, ["#111", "#222"]);
    const radiusOf = buildRadialTreeRadiusScale(p.nodes, [2, 32]);
    const model = buildRadialTreeRenderModel(laidOut, colors, radiusOf, {
      leafCount: p.leaves.length,
      rotateAbove: 20,
      hideAbove: 100,
      outerRadius: 100,
      centerLabel: "Total Trade",
      highlightItems: [],
      valueFormatter: (n) => String(n),
    });
    expect(model.centerRadius).toBe(25);
    expect(model.centerLines.map((l) => l.text)).toEqual(["Total", "Trade"]);
  });

  it("omits the centre circle/label when centerLabel is absent", () => {
    const p = processRadialTreeData(twoGroupData);
    const laidOut = layoutRadialTree(p.root, { outerRadius: 100 });
    const colors = buildRadialTreeColors(p.groupKeys, ["#111", "#222"]);
    const radiusOf = buildRadialTreeRadiusScale(p.nodes, [2, 32]);
    const model = buildRadialTreeRenderModel(laidOut, colors, radiusOf, {
      leafCount: p.leaves.length,
      rotateAbove: 20,
      hideAbove: 100,
      outerRadius: 100,
      highlightItems: [],
      valueFormatter: (n) => String(n),
    });
    expect(model.centerRadius).toBe(0);
    expect(model.centerLines).toEqual([]);
  });
});

describe("context/buildRadialTreeContext", () => {
  it("reports leaf/group counts, grand total, largest leaf, and a natural-language summary", () => {
    const p = processRadialTreeData(twoGroupData);
    const laidOut = layoutRadialTree(p.root, { outerRadius: 100 });
    const colors = buildRadialTreeColors(p.groupKeys, ["#111", "#222"]);
    const radiusOf = buildRadialTreeRadiusScale(p.nodes, [2, 32]);
    const model = buildRadialTreeRenderModel(laidOut, colors, radiusOf, {
      leafCount: p.leaves.length,
      rotateAbove: 20,
      hideAbove: 100,
      outerRadius: 100,
      highlightItems: [],
      valueFormatter: (n) => String(n),
    });
    const ctx = buildRadialTreeContext({
      renderer: "svg",
      marks: model.marks,
      groupCount: p.groups.length,
      leafCount: p.leaves.length,
      maxDepth: p.maxDepth,
      colorsMapping: colors.generatedColorsMapping,
    });
    expect(ctx.chartType).toBe("radial-tree-chart");
    expect(ctx.stats.leafCount).toBe(4);
    expect(ctx.stats.groupCount).toBe(2);
    expect(ctx.stats.grandTotal).toBe(100);
    expect(ctx.stats.max).toEqual({ label: "Asia", value: 55 });
    expect(ctx.stats.min).toEqual({ label: "Africa", value: 5 });
    expect(ctx.summary).toContain("Radial tree");
    expect(ctx.a11yTable.headers).toEqual(["Label", "Depth", "Value"]);
  });
});

describe("validate/radialTreeWarnings - checkRadialTreeData", () => {
  it("flags an empty dataset", () => {
    expect(checkRadialTreeData([])).toEqual([
      { type: "empty-dataset", message: "RadialTree chart received an empty dataSet." },
    ]);
  });

  it("flags an empty children array as an empty-group warning", () => {
    const warnings = checkRadialTreeData([{ label: "G", children: [] }]);
    expect(warnings.some((w) => w.type === "empty-group")).toBe(true);
  });

  it("flags negative and non-finite leaf values", () => {
    const warnings = checkRadialTreeData([
      { label: "G", children: [{ label: "Bad", value: -5 }, { label: "NaN", value: NaN }] },
    ]);
    expect(warnings.filter((w) => w.type === "non-finite-value").length).toBe(2);
  });

  it("flags duplicate labels anywhere in the tree", () => {
    const warnings = checkRadialTreeData([
      { label: "Dup", children: [{ label: "Leaf", value: 1 }] },
      { label: "Dup", children: [{ label: "Leaf2", value: 1 }] },
    ]);
    expect(warnings.some((w) => w.type === "duplicate-label")).toBe(true);
  });

  it("flags nesting deeper than 2 levels as tolerated-with-warning", () => {
    const warnings = checkRadialTreeData([
      { label: "A", children: [{ label: "B", children: [{ label: "C", value: 1 }] }] },
    ]);
    expect(warnings.some((w) => w.type === "excess-depth")).toBe(true);
  });
});
