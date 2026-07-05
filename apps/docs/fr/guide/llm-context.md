---
title: Contexte LLM - un graphique qu'une IA peut lire et piloter
---

# Contexte LLM : un graphique qu'une IA peut lire et piloter

Confier un graphique à un chatbot revient d'habitude à en faire une capture d'écran et à
espérer que le modèle lise les pixels. Un graphique michi-vz s'en dispense : il fournit un
**`ChartContext`** structuré que le modèle peut lire directement, et expose ses commandes
comme des **outils** que le modèle peut appeler. Un assistant peut ainsi *comprendre* le
graphique et le *modifier* - par des appels de fonction, pas par devinette.

<InsightsDemo feature="forecast" />

> La phrase sous le graphique est son `getContext().summary` - écrite à partir des données,
> pas extraite du DOM. Un modèle reçoit cela, plus l'intégralité du contexte structuré
> ci-dessous.

## Ce qu'est le contexte

Chaque graphique dérive un **`ChartContext`** agnostique du moteur de rendu à partir de son
modèle de données (jamais du DOM), si bien qu'il est **identique en mode SVG et en mode
canvas** - même en canvas, où il n'y a pas de nœuds par marque à extraire.

```ts
const ctx = chart.getContext(); // or el.getContext() on the web component / wrappers
```

Il expose trois choses à partir d'une seule source :

1. **Du JSON structuré** - type de graphique, axes/domaines, statistiques par série
   (min/max/premier/dernier, variation, tendance, corrélation, écarts, totaux…). Prêt pour
   l'usage d'outils par un LLM, le RAG, ou les agents.
2. **Un `summary` déterministe en langage naturel** - basé sur des règles, sans modèle
   requis ; il sert aussi de texte alternatif.
3. **Un `a11yTable` agnostique du graphique** (`headers` + `rows`) qui alimente un tableau
   DOM visuellement masqué à côté du graphique, afin que les lecteurs d'écran et les outils
   d'extraction du DOM obtiennent un contenu réel, même en mode canvas.

```jsonc
{
  "chartType": "line-chart",
  "renderer": "svg",
  "series": [{ "label": "North", "change": 20, "trend": "up", "gaps": 0 }],
  "stats": { "seriesCount": 2, "largestMover": { "label": "North", "change": 20 } },
  "summary": "Line chart with 2 series over 8 points. North rose the most (20).",
  "a11yTable": { "headers": ["Series", "Points", "First", "Last", "Change", "Trend"], "rows": [/* … */] }
}
```

La forme est une union discriminée indexée sur `chartType`, si bien qu'elle se restreint
proprement graphique par graphique.

## Parlez à votre graphique : un chatbot qui le pilote

Parce que le sens est structuré **et** que les commandes sont des outils, un chatbot
n'extrait pas les pixels - il appelle des fonctions. Chaque bouton ci-dessous est un
véritable appel d'outil sur le graphique (les appels exacts qu'un client MCP comme Claude
Code effectuerait) :

<InsightsDemo feature="agent" />

Tapez une commande - même approximative comme *"hilight east"* - et le graphique répond.
Le moteur **⚡ Instantané** achemine vos mots vers les outils du graphique avec un
comparateur **tolérant aux fautes de frappe** (et suggère une correction en cas de doute :
*"did you mean highlight East?"*). Basculez sur **Modèle réel** et choisissez un petit LLM
exécuté dans le navigateur (**Qwen / Llama / Gemma**) qui lit le contexte du graphique et
interprète les requêtes en langage libre ; il revient au comparateur instantané s'il n'est
pas chargé ou s'il trébuche.

Dans les deux cas, la *lecture* est exacte : une réponse à *« quelle série a le plus
progressé ? »* provient directement du `getContext()` déterministe (meilleur mouvement,
variation en %, totaux) - le même contexte qu'utilisent les fonctionnalités d'insights -
seule la formulation est floue, jamais les chiffres. Connectez votre propre appelant et
l'agent obtient ce contexte ainsi que les outils :

```ts
import { createAgent, chartHandle } from "@michi-vz/insights/agent";

const agent = createAgent({ charts: [chartHandle("sales", chart, props)], llm: myCaller });
await agent.ask("Highlight North, hide South, and forecast next quarter");
// the agent reads getContext(), calls highlight / set_disabled / forecast_series, and replies.
```

La zone de saisie de chat ci-dessus est une petite version construite pour cette
documentation. Pour une interface de chat soignée dans votre propre application,
**[deep-chat](https://deepchat.dev)** est un charmant web component de chat agnostique de
framework - intégrez-le, pointez-le vers votre LLM, et donnez-lui le même `getContext()`
et les mêmes outils. (Un coup de chapeau à l'équipe de deep-chat.)

> Un modèle peut se tromper avec assurance et des modèles différents répondent
> différemment - ne faites donc pas confiance à l'IA aveuglément. Le contexte structuré et
> les outils sont déterministes ; c'est le modèle par-dessus qu'il faut vérifier.

Les mêmes outils sont exposés via **MCP** (Model Context Protocol), de sorte que Claude
Code, Cursor et Claude Desktop se connectent sans intégration personnalisée. La liste
complète des outils, les ressources `michivz://chart/<name>`, et la démo du registre se
trouvent dans **[Insights → Agents & MCP](/fr/guide/insights)**.
