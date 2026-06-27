---
title: Agent & MCP API
---

# Agent & MCP API

Wrap a mounted chart so an AI agent can both read it and drive it - in-page via a tool-calling agent, or out-of-process over MCP; for the story and live demos, see the **[Insights guide](/guide/insights)**.

## Import

::: code-group

```ts [Agent]
import { createAgent, createAgentRegistry, chartHandle } from "@michi-vz/insights/agent";
```

```ts [MCP]
import { createMcpServer, stdioTransport, messagePortTransport } from "@michi-vz/insights/mcp";
```

:::

## Signature & options

### `chartHandle(name, instance, props)`

| Argument | Type | Default | What it does |
| --- | --- | --- | --- |
| `name` | `string` | required | Stable id the agent and tools use to address this chart. |
| `instance` | mounted chart | required | The live chart returned by `mount*` (or a framework wrapper). |
| `props` | chart props | required | The props the chart was rendered with, so the handle can read or update them. |

Returns a `ChartHandle` that exposes the chart to be read and driven.

### `createAgentRegistry()`

Returns a registry of handles.

| Member | Type | What it does |
| --- | --- | --- |
| `register(handle)` | `(handle: ChartHandle) => void` | Adds a chart handle to the registry. |
| `unregister(name)` | `(name: string) => void` | Removes the handle registered under `name`. |
| `list()` | `() => string[]` | Lists the names of all registered charts. |
| `tools()` | `() => Tool[]` | Returns the tool definitions the agent or MCP server can call. |
| `call(tool, args)` | `(tool: string, args: object) => Promise<unknown>` | Invokes a tool by name against the matching chart. |

### `createAgent(options)`

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `charts` | `ChartHandle[]` | `[]` | Handles to auto-register; a shortcut for calling `register` yourself. |
| `registry` | `AgentRegistry` | a fresh one | Reuse an existing registry instead of creating one. |
| `llm` | `LlmCaller` | required | Your own LLM caller (bring-your-own); the agent feeds it tools and prompts. |
| `maxSteps` | `number` | unbounded | Caps tool-calling iterations per `ask`. |

Returns `{ registry, ask(prompt) }`, an in-page tool-calling agent.

### `createMcpServer(registry, transport, options?)`

| Argument | Type | Default | What it does |
| --- | --- | --- | --- |
| `registry` | `AgentRegistry` | required | The registry whose charts and tools the server exposes. |
| `transport` | `Transport` | required | `stdioTransport()` for Claude Code, Codex, or Cursor, or `messagePortTransport(port)` to bridge a live web app. |
| `options` | `object` | `{}` | Optional server config (name, version, and similar metadata). |

Returns an MCP (JSON-RPC) server.

### Tools

Every registered chart exposes `get_chart_context`, `summarize_chart`, `list_series`, `set_filter`, `highlight`, `set_disabled`, and `set_data`, plus any plugin tools. Each chart context is also readable as a `michivz://chart/<name>` resource.

## Example

```ts
import { mountLineChart } from "@michi-vz/core";
import { createAgent, createAgentRegistry, chartHandle } from "@michi-vz/insights/agent";
import { createMcpServer, stdioTransport } from "@michi-vz/insights/mcp";

const chart = mountLineChart(el, props);

// In-page: a tool-calling agent that can read and drive the chart.
const agent = createAgent({
  charts: [chartHandle("revenue", chart, props)],
  llm, // bring your own LLM caller
});

const answer = await agent.ask("Which series grew the most, then highlight it.");

// Out-of-process: expose the same charts over MCP to Claude Code, Codex, or Cursor.
const registry = createAgentRegistry();
registry.register(chartHandle("revenue", chart, props));
const server = createMcpServer(registry, stdioTransport());
```

**[Insights guide](/guide/insights)**
