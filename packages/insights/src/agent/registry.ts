// Agent tool registry — the surface an in-page agent or an MCP server drives. It
// maps generic tools onto the capabilities every @michi-vz chart already exposes
// (getContext + the engine update() path) plus any plugin-provided tools. No LLM
// here; this is the deterministic, testable substrate under createAgent + the MCP server.
import type { AgentTool, ChartContext, ChartInstance } from "@michi-vz/core";

/** A mounted chart + its live props, so the agent can read AND drive it. */
export interface ChartHandle<P = unknown> {
  name: string;
  instance: ChartInstance<P>;
  getProps(): P;
  setProps(patch: Partial<P>): void;
}

/** Wrap a mounted chart into a handle that tracks props and re-renders on patch. */
export function chartHandle<P>(name: string, instance: ChartInstance<P>, initialProps: P): ChartHandle<P> {
  let props = initialProps;
  return {
    name,
    instance,
    getProps: () => props,
    setProps: (patch) => {
      props = { ...props, ...patch } as P;
      instance.update(props);
    },
  };
}

export interface AgentRegistry {
  register(handle: ChartHandle): void;
  unregister(name: string): void;
  list(): string[];
  /** all tools: the standard read/drive tools + plugin tools (namespaced `chart.tool`). */
  tools(): AgentTool[];
  call(tool: string, args?: Record<string, unknown>): unknown;
}

function seriesLabels(ctx: ChartContext | null): string[] {
  if (!ctx) return [];
  const series = (ctx as { series?: Array<{ label?: string; key?: string }> }).series;
  if (!Array.isArray(series)) return [];
  return series.map((s) => s.label ?? s.key ?? "").filter(Boolean);
}

export function createAgentRegistry(): AgentRegistry {
  const charts = new Map<string, ChartHandle>();
  const need = (name: unknown): ChartHandle => {
    const h = charts.get(String(name));
    if (!h) {
      throw new Error(
        `Unknown chart "${String(name)}". Registered: ${[...charts.keys()].join(", ") || "(none)"}`
      );
    }
    return h;
  };
  const arg = <T>(a: unknown, k: string): T => (a as Record<string, unknown> | undefined)?.[k] as T;

  function standardTools(): AgentTool[] {
    return [
      {
        name: "list_charts",
        description: "List the names of all registered charts.",
        run: () => [...charts.keys()],
      },
      {
        name: "get_chart_context",
        description: "Get the structured ChartContext (series, stats, summary) for a chart.",
        inputSchema: { chart: "string (chart name)" },
        run: (a) => need(arg(a, "chart")).instance.getContext(),
      },
      {
        name: "summarize_chart",
        description: "Get the deterministic plain-English summary of a chart.",
        inputSchema: { chart: "string" },
        run: (a) => need(arg(a, "chart")).instance.getContext()?.summary ?? null,
      },
      {
        name: "list_series",
        description: "List the series labels of a chart.",
        inputSchema: { chart: "string" },
        run: (a) => seriesLabels(need(arg(a, "chart")).instance.getContext()),
      },
      {
        name: "set_filter",
        description: "Set a chart filter {limit, criteria, sortingDir, date}.",
        inputSchema: { chart: "string", filter: "object" },
        run: (a) => {
          need(arg(a, "chart")).setProps({ filter: arg(a, "filter") } as Record<string, unknown>);
          return { ok: true };
        },
      },
      {
        name: "highlight",
        description: "Highlight series by label.",
        inputSchema: { chart: "string", labels: "string[]" },
        run: (a) => {
          need(arg(a, "chart")).setProps({ highlightItems: arg(a, "labels") ?? [] } as Record<string, unknown>);
          return { ok: true };
        },
      },
      {
        name: "set_disabled",
        description: "Disable (hide) series by label.",
        inputSchema: { chart: "string", labels: "string[]" },
        run: (a) => {
          need(arg(a, "chart")).setProps({ disabledItems: arg(a, "labels") ?? [] } as Record<string, unknown>);
          return { ok: true };
        },
      },
      {
        name: "set_data",
        description: "Replace a chart's dataSet.",
        inputSchema: { chart: "string", dataSet: "array" },
        run: (a) => {
          need(arg(a, "chart")).setProps({ dataSet: arg(a, "dataSet") } as Record<string, unknown>);
          return { ok: true };
        },
      },
    ];
  }

  function allTools(): AgentTool[] {
    const tools = standardTools();
    for (const [name, h] of charts) {
      for (const tool of h.instance.getTools?.() ?? []) {
        tools.push({ ...tool, name: `${name}.${tool.name}` });
      }
    }
    return tools;
  }

  return {
    register: (h) => {
      charts.set(h.name, h);
    },
    unregister: (name) => {
      charts.delete(name);
    },
    list: () => [...charts.keys()],
    tools: allTools,
    call: (tool, args) => {
      const found = allTools().find((t) => t.name === tool);
      if (!found) throw new Error(`Unknown tool "${tool}".`);
      return found.run(args ?? {});
    },
  };
}
