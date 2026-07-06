// onDataWarning checks for RadialTree: empty dataset, empty groups (a node with
// an explicit but empty `children` array), non-finite/negative leaf values (the
// pure layer clamps negatives to 0 - this just flags it), duplicate labels
// anywhere in the tree, and nesting deeper than the 2-level (group + leaf)
// contract the consumer targets (tolerated - every extra level still gets a
// sized circle - but worth surfacing).
import type { DataWarning, RadialTreeNode } from "../types";

export function checkRadialTreeData(dataSet: RadialTreeNode[]): DataWarning[] {
  const warnings: DataWarning[] = [];
  if (!dataSet || dataSet.length === 0) {
    warnings.push({ type: "empty-dataset", message: "RadialTree chart received an empty dataSet." });
    return warnings;
  }

  const seen = new Set<string>();
  let maxDepth = 0;

  const walk = (nodes: RadialTreeNode[], depth: number): void => {
    maxDepth = Math.max(maxDepth, depth);
    for (const n of nodes) {
      if (seen.has(n.label)) {
        warnings.push({
          type: "duplicate-label",
          message: `RadialTree has a duplicate label "${n.label}".`,
          label: n.label,
        });
      }
      seen.add(n.label);

      if (n.children !== undefined) {
        if (n.children.length === 0) {
          warnings.push({
            type: "empty-group",
            message: `RadialTree group "${n.label}" has an empty children array.`,
            label: n.label,
          });
        } else {
          walk(n.children, depth + 1);
        }
        continue;
      }

      if (n.value !== undefined && !Number.isFinite(Number(n.value))) {
        warnings.push({
          type: "non-finite-value",
          message: `RadialTree leaf "${n.label}" has a non-finite value.`,
          label: n.label,
        });
      } else if (n.value !== undefined && Number(n.value) < 0) {
        warnings.push({
          type: "non-finite-value",
          message: `RadialTree leaf "${n.label}" has a negative value (${n.value}); it is clamped to 0.`,
          label: n.label,
        });
      }
    }
  };
  walk(dataSet, 1);

  if (maxDepth > 2) {
    warnings.push({
      type: "excess-depth",
      message: `RadialTree data nests ${maxDepth} levels deep; the consumer contract is 2 (group + leaf). Deeper levels are tolerated and still rendered.`,
    });
  }

  return warnings;
}
