import { describe, it, expect, beforeEach } from "vitest";
import { mountLineChart, type LineChartContext, type LineChartProps } from "@michi-vz/core";
import { createAgentRegistry, chartHandle, createAgent } from "../src/agent";
import { createMcpServer, type JsonRpcMessage, type McpTransport } from "../src/mcp";

function host(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

const props: LineChartProps = {
  xAxisDataType: "number",
  dataSet: [
    { label: "A", series: [{ date: 2018, value: 10, certainty: true }, { date: 2019, value: 30, certainty: true }] },
    { label: "B", series: [{ date: 2018, value: 5, certainty: true }, { date: 2019, value: 8, certainty: true }] },
  ],
};

beforeEach(() => {
  document.body.innerHTML = "";
});

function setup() {
  const chart = mountLineChart(host(), props);
  const registry = createAgentRegistry();
  registry.register(chartHandle("revenue", chart, props));
  return { chart, registry };
}

describe("agent registry", () => {
  it("exposes read + drive tools over a chart", () => {
    const { registry } = setup();
    expect(registry.list()).toEqual(["revenue"]);
    const names = registry.tools().map((t) => t.name);
    expect(names).toEqual(
      expect.arrayContaining(["list_charts", "get_chart_context", "set_filter", "highlight", "set_data"])
    );
    const ctx = registry.call("get_chart_context", { chart: "revenue" }) as LineChartContext;
    expect(ctx.chartType).toBe("line-chart");
    expect(registry.call("list_series", { chart: "revenue" })).toEqual(["A", "B"]);
  });

  it("drive tools re-render the chart (set_data changes context)", () => {
    const { chart, registry } = setup();
    registry.call("set_data", {
      chart: "revenue",
      dataSet: [{ label: "A", series: [{ date: 2018, value: 1, certainty: true }, { date: 2019, value: 2, certainty: true }] }],
    });
    expect((chart.getContext() as LineChartContext).series.length).toBe(1);
  });

  it("throws helpfully on unknown chart / tool", () => {
    const { registry } = setup();
    expect(() => registry.call("get_chart_context", { chart: "nope" })).toThrow(/Unknown chart/);
    expect(() => registry.call("bogus_tool")).toThrow(/Unknown tool/);
  });
});

describe("in-page agent (mock LLM)", () => {
  it("executes tool calls then returns text", async () => {
    const { registry } = setup();
    let turn = 0;
    const agent = createAgent({
      registry,
      llm: () => {
        turn++;
        return turn === 1
          ? { toolCalls: [{ tool: "highlight", args: { chart: "revenue", labels: ["A"] } }] }
          : { text: "Highlighted A." };
      },
    });
    const run = await agent.ask("highlight A");
    expect(run.text).toBe("Highlighted A.");
    expect(run.calls[0].tool).toBe("highlight");
    expect(run.calls[0].result).toEqual({ ok: true });
  });
});

describe("MCP server", () => {
  it("answers initialize / tools.list / tools.call / resources", () => {
    const { registry } = setup();
    const transport: McpTransport = { send: () => {}, onMessage: () => {} };
    const server = createMcpServer(registry, transport, { name: "test" });

    const init = server.handle({ jsonrpc: "2.0", id: 1, method: "initialize" }) as JsonRpcMessage;
    expect((init.result as { serverInfo: { name: string } }).serverInfo.name).toBe("test");

    const list = server.handle({ jsonrpc: "2.0", id: 2, method: "tools/list" }) as JsonRpcMessage;
    const toolNames = (list.result as { tools: Array<{ name: string }> }).tools.map((t) => t.name);
    expect(toolNames).toContain("set_filter");

    const call = server.handle({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "summarize_chart", arguments: { chart: "revenue" } },
    }) as JsonRpcMessage;
    expect((call.result as { content: Array<{ text: string }> }).content[0].text).toContain("Line chart");

    const read = server.handle({
      jsonrpc: "2.0",
      id: 4,
      method: "resources/read",
      params: { uri: "michivz://chart/revenue" },
    }) as JsonRpcMessage;
    const text = (read.result as { contents: Array<{ text: string }> }).contents[0].text;
    expect(JSON.parse(text).chartType).toBe("line-chart");

    expect(server.handle({ jsonrpc: "2.0", method: "notifications/initialized" })).toBeNull();
  });

  it("wires requests through a transport", () => {
    const { registry } = setup();
    let handler: (m: JsonRpcMessage) => void = () => {};
    const sent: JsonRpcMessage[] = [];
    const transport: McpTransport = { send: (m) => sent.push(m), onMessage: (h) => { handler = h; } };
    createMcpServer(registry, transport);
    handler({ jsonrpc: "2.0", id: 1, method: "tools/list" });
    expect(sent[0].result).toBeTruthy();
  });
});
