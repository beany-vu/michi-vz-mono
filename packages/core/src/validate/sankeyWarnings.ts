// onDataWarning checks for Sankey: empty nodes/links, non-finite link values,
// duplicate node ids, and links that reference an unknown node id.
import type { DataWarning, SankeyNodeItem, SankeyLinkItem } from "../types";

export function checkSankeyData(
  nodes: SankeyNodeItem[],
  links: SankeyLinkItem[]
): DataWarning[] {
  const warnings: DataWarning[] = [];
  if (!nodes || nodes.length === 0) {
    warnings.push({ type: "empty-dataset", message: "Sankey received no nodes." });
    return warnings;
  }
  if (!links || links.length === 0) {
    warnings.push({ type: "empty-dataset", message: "Sankey received no links." });
  }

  const ids = new Set<string>();
  for (const n of nodes) {
    if (ids.has(n.id)) {
      warnings.push({
        type: "duplicate-label",
        message: `Sankey has a duplicate node id "${n.id}".`,
        label: n.id,
      });
    }
    ids.add(n.id);
  }

  for (const l of links ?? []) {
    if (l.value !== undefined && !Number.isFinite(Number(l.value))) {
      warnings.push({
        type: "non-finite-value",
        message: `Sankey link ${l.source} → ${l.target} has a non-finite value.`,
      });
    }
    if (!ids.has(l.source)) {
      warnings.push({
        type: "non-finite-value",
        message: `Sankey link references an unknown source node "${l.source}".`,
        label: l.source,
      });
    }
    if (!ids.has(l.target)) {
      warnings.push({
        type: "non-finite-value",
        message: `Sankey link references an unknown target node "${l.target}".`,
        label: l.target,
      });
    }
  }
  return warnings;
}
