// Renderer-agnostic semantic context for Sankey. Derived from the laid-out graph
// (not the DOM), so SVG and canvas produce identical context. The a11y table is
// the link list — the readable substance of a sankey ("X → Y: value").
import type { SankeyLaidNode, SankeyLaidLink } from "../sankeyChart/layout";
import type { SankeyChartContext, SankeyNodeContext, SankeyLinkContext } from "../types";

const round = (n: number): number => Math.round(n * 100) / 100;

export interface BuildSankeyContextInput {
  title?: string;
  renderer: "svg" | "canvas";
  nodes: SankeyLaidNode[];
  links: SankeyLaidLink[];
  colorsMapping: Record<string, string>;
  linkColorMode: "source" | "target";
}

export function buildSankeyContext(input: BuildSankeyContextInput): SankeyChartContext {
  const { nodes, links, colorsMapping, linkColorMode } = input;

  const nodeCtx: SankeyNodeContext[] = nodes.map((n) => ({
    kind: "node",
    id: n.id,
    label: n.label,
    color: colorsMapping[n.id] ?? "",
    value: round(n.value),
    depth: n.depth,
  }));

  const linkCtx: SankeyLinkContext[] = links.map((l) => {
    const key = linkColorMode === "target" ? l.targetId : l.sourceId;
    return {
      kind: "link",
      source: l.sourceId,
      target: l.targetId,
      value: round(l.value),
      color: colorsMapping[key] ?? "",
    };
  });

  const totalFlow = round(links.reduce((a, l) => a + l.value, 0));
  const columnCount = nodes.reduce((m, n) => Math.max(m, n.depth), 0) + (nodes.length ? 1 : 0);

  let largestLink: { source: string; target: string; value: number } | null = null;
  for (const l of links) {
    if (!largestLink || l.value > largestLink.value) {
      largestLink = { source: l.sourceId, target: l.targetId, value: round(l.value) };
    }
  }
  let busiestNode: { id: string; value: number } | null = null;
  for (const n of nodes) {
    if (!busiestNode || n.value > busiestNode.value) busiestNode = { id: n.id, value: round(n.value) };
  }

  const titlePart = input.title ? `"${input.title}" ` : "";
  let summary = `Sankey diagram ${titlePart}with ${nodes.length} node${nodes.length === 1 ? "" : "s"} in ${columnCount} column${columnCount === 1 ? "" : "s"} and ${links.length} link${links.length === 1 ? "" : "s"} (total flow ${totalFlow}).`;
  if (largestLink) {
    summary += ` Largest flow: ${largestLink.source} → ${largestLink.target} (${largestLink.value}).`;
  }

  const headers = ["Source", "Target", "Value"];
  const rows = linkCtx.map((l) => [l.source, l.target, l.value]);

  return {
    chartType: "sankey-chart",
    title: input.title,
    renderer: input.renderer,
    nodes: nodeCtx,
    links: linkCtx,
    stats: {
      nodeCount: nodes.length,
      linkCount: links.length,
      columnCount,
      totalFlow,
      largestLink,
      busiestNode,
    },
    colorsMapping,
    summary,
    a11yTable: { headers, rows },
  };
}
