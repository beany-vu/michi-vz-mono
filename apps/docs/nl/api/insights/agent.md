---
title: Agent & MCP API
---

# Agent & MCP API

Verpak een gemonteerde grafiek zodat een AI-agent deze kan lezen én aansturen - in-page via een
tool-aanroepende agent, of buiten het proces via MCP; voor het volledige verhaal, zie de
**[Insights-gids](/nl/guide/insights)**.

Probeer het - typ een commando (zelfs een slordig commando zoals "hilight north") en de grafiek reageert:

<InsightsDemo feature="agent" />

## Import

::: code-group

```ts [Agent]
import { createAgent, createAgentRegistry, chartHandle } from "@michi-vz/insights/agent";
```

```ts [MCP]
import { createMcpServer, stdioTransport, messagePortTransport } from "@michi-vz/insights/mcp";
```

:::

## Signatuur & opties

### `chartHandle(name, instance, props)`

| Argument | Type | Standaard | Wat het doet |
| --- | --- | --- | --- |
| `name` | `string` | vereist | Stabiele id die de agent en tools gebruiken om deze grafiek aan te spreken. |
| `instance` | gemonteerde grafiek | vereist | De grafiek die is geretourneerd door `mount*` (of een framework-wrapper). |
| `props` | grafiek-props | vereist | De props waarmee de grafiek is gerenderd, zodat de handle ze kan lezen of bijwerken. |

Retourneert een `ChartHandle` die de grafiek beschikbaar stelt om te lezen en aan te sturen.

### `createAgentRegistry()`

Retourneert een register van handles.

| Lid | Type | Wat het doet |
| --- | --- | --- |
| `register(handle)` | `(handle: ChartHandle) => void` | Voegt een grafiekhandle toe aan het register. |
| `unregister(name)` | `(name: string) => void` | Verwijdert de handle die is geregistreerd onder `name`. |
| `list()` | `() => string[]` | Somt de namen van alle geregistreerde grafieken op. |
| `tools()` | `() => Tool[]` | Retourneert de tool-definities die de agent of MCP-server kan aanroepen. |
| `call(tool, args)` | `(tool: string, args: object) => Promise<unknown>` | Roept een tool op naam aan tegen de bijbehorende grafiek. |

### `createAgent(options)`

| Optie | Type | Standaard | Wat het doet |
| --- | --- | --- | --- |
| `charts` | `ChartHandle[]` | `[]` | Handles om automatisch te registreren; een snelkoppeling om `register` niet zelf te hoeven aanroepen. |
| `registry` | `AgentRegistry` | een nieuwe | Hergebruik een bestaand register in plaats van er een nieuwe te maken. |
| `llm` | `LlmCaller` | vereist | Je eigen LLM-aanroeper (bring-your-own); de agent voedt deze met tools en prompts. |
| `maxSteps` | `number` | onbegrensd | Beperkt het aantal tool-aanroep-iteraties per `ask`. |

Retourneert `{ registry, ask(prompt) }`, een in-page tool-aanroepende agent.

### `createMcpServer(registry, transport, options?)`

| Argument | Type | Standaard | Wat het doet |
| --- | --- | --- | --- |
| `registry` | `AgentRegistry` | vereist | Het register waarvan de server de grafieken en tools beschikbaar stelt. |
| `transport` | `Transport` | vereist | `stdioTransport()` voor Claude Code, Codex, of Cursor, of `messagePortTransport(port)` om een webapp te overbruggen. |
| `options` | `object` | `{}` | Optionele serverconfiguratie (naam, versie, en vergelijkbare metadata). |

Retourneert een MCP-(JSON-RPC-)server.

### Tools

Het register stelt `list_charts` beschikbaar, en elke geregistreerde grafiek stelt `get_chart_context`,
`summarize_chart`, `list_series`, `set_filter`, `highlight`, `set_disabled`, en `set_data` beschikbaar,
plus eventuele plugin-tools met de grafieknaam als voorvoegsel (een grafiek die geregistreerd is als
`revenue` met de forecast-plugin stelt `revenue.forecast` beschikbaar). Elke grafiekcontext is ook
leesbaar als een `michivz://chart/<name>`-resource.

## Voorbeeld

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

**[Insights-gids](/nl/guide/insights)**
