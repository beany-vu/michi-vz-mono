---
title: API Agent & MCP
---

# API Agent & MCP

Enveloppez un graphique monté pour qu'un agent IA puisse à la fois le lire et le piloter - dans la page via un agent à appel d'outils, ou hors processus via MCP ; pour l'histoire complète, voir le **[guide Insights](/fr/guide/insights)**.

Essayez-le - tapez une commande (même bâclée comme "hilight north") et le graphique répond :

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

## Signature et options

### `chartHandle(name, instance, props)`

| Argument | Type | Défaut | Ce que ça fait |
| --- | --- | --- | --- |
| `name` | `string` | requis | Identifiant stable que l'agent et les outils utilisent pour adresser ce graphique. |
| `instance` | graphique monté | requis | Le graphique retourné par `mount*` (ou un wrapper de framework). |
| `props` | props du graphique | requis | Les props avec lesquelles le graphique a été rendu, afin que le handle puisse les lire ou les mettre à jour. |

Retourne un `ChartHandle` qui expose le graphique pour être lu et piloté.

### `createAgentRegistry()`

Retourne un registre de handles.

| Membre | Type | Ce que ça fait |
| --- | --- | --- |
| `register(handle)` | `(handle: ChartHandle) => void` | Ajoute un handle de graphique au registre. |
| `unregister(name)` | `(name: string) => void` | Supprime le handle enregistré sous `name`. |
| `list()` | `() => string[]` | Liste les noms de tous les graphiques enregistrés. |
| `tools()` | `() => Tool[]` | Retourne les définitions d'outils que l'agent ou le serveur MCP peut appeler. |
| `call(tool, args)` | `(tool: string, args: object) => Promise<unknown>` | Invoque un outil par son nom sur le graphique correspondant. |

### `createAgent(options)`

| Option | Type | Défaut | Ce que ça fait |
| --- | --- | --- | --- |
| `charts` | `ChartHandle[]` | `[]` | Handles à enregistrer automatiquement ; un raccourci pour appeler `register` vous-même. |
| `registry` | `AgentRegistry` | un nouveau | Réutilise un registre existant au lieu d'en créer un. |
| `llm` | `LlmCaller` | requis | Votre propre appelant LLM (bring-your-own) ; l'agent lui fournit les outils et les prompts. |
| `maxSteps` | `number` | illimité | Plafonne les itérations d'appel d'outils par `ask`. |

Retourne `{ registry, ask(prompt) }`, un agent à appel d'outils dans la page.

### `createMcpServer(registry, transport, options?)`

| Argument | Type | Défaut | Ce que ça fait |
| --- | --- | --- | --- |
| `registry` | `AgentRegistry` | requis | Le registre dont le serveur expose les graphiques et les outils. |
| `transport` | `Transport` | requis | `stdioTransport()` pour Claude Code, Codex, ou Cursor, ou `messagePortTransport(port)` pour relier une application web. |
| `options` | `object` | `{}` | Configuration optionnelle du serveur (nom, version, et métadonnées similaires). |

Retourne un serveur MCP (JSON-RPC).

### Outils

Le registre expose `list_charts`, et chaque graphique enregistré expose `get_chart_context`, `summarize_chart`, `list_series`, `set_filter`, `highlight`, `set_disabled`, et `set_data`, plus les outils de plugin éventuels, nommés dans leur propre espace de noms selon le nom du graphique (un graphique enregistré sous `revenue` avec le plugin forecast expose `revenue.forecast`). Chaque contexte de graphique est aussi lisible comme une ressource `michivz://chart/<name>`.

## Exemple

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

**[guide Insights](/fr/guide/insights)**
