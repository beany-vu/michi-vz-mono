---
title: Insights - prédire, expliquer et piloter des graphiques avec l'IA
---

# Des graphiques qui prédisent, s'expliquent et dialoguent avec l'IA

::: warning Expérimental - pas encore stable
La couche IA `@michi-vz/insights` est **expérimentale** : son API, ses sous-chemins et ses sorties peuvent changer dans les futures versions. Les 16 graphiques du cœur sont stables ; insights (et le nouveau [graphique Fontaine](/fr/charts/fountain)) ne le sont pas encore. Fixez une version si vous en dépendez.
:::

Un graphique se contente habituellement de *dessiner* le passé. `@michi-vz/insights` le fait
**prévoir l'avenir**, **s'expliquer en langage clair**, **repérer les données incorrectes** et
**répondre à un assistant IA** - le tout dans le navigateur, sans serveur et sans rien qui
quitte la page. C'est **opt-in** et cela utilise des **méthodes classiques de manuel** (pas de
boîte noire) ; chaque graphique michi-vz porte déjà un `ChartContext` structuré, et ces
fonctionnalités se contentent de le lire.

<InsightsDemo feature="forecast" />

> Ci-dessus, un véritable graphique en courbes. Activez **Forecast** pour voir une prédiction
> en pointillés + une zone de prévision ombrée ; **Explain** écrit une phrase à partir des
> données. Sans serveur - tout s'exécute dans votre navigateur.

> [!IMPORTANT] Un modèle assiste ; il ne décide pas.
> Des modèles différents donnent des réponses différentes, et même un modèle performant peut
> se tromper - d'autant plus qu'il est petit et rapide. Ces outils accélèrent la *lecture*
> d'un graphique ; ils n'en assument pas la responsabilité. Traitez toute sortie de modèle
> comme un point de départ, appuyez-vous sur le repli déterministe basé sur des règles comme
> référence honnête, et **vérifiez tout ce qui compte avant d'agir en conséquence**. L'IA est
> là pour aider, pas pour répondre à votre place.

---

## Ce que ça fait

Quatre choses deviennent possibles dès qu'un graphique porte son propre sens structuré :

### Lire et piloter des graphiques depuis un assistant IA

C'est la fonctionnalité phare. Parce que chaque graphique expose son sens (`ChartContext`)
**et** ses commandes comme des **outils**, un assistant IA peut le résumer, le filtrer, mettre
une série en évidence, ou le prévoir - par des appels de fonction, pas en extrayant des
pixels. Essayez les boutons (chacun est un véritable appel d'outil) :

<InsightsDemo feature="agent" />

```ts
// In your app - bring your own LLM caller:
import { createAgent, chartHandle } from "@michi-vz/insights/agent";
const agent = createAgent({ charts: [chartHandle("revenue", chart, props)], llm: myCaller });
await agent.ask("Filter to the top 5 and forecast next quarter");
```

Les mêmes outils sont exposés via **MCP** (Model Context Protocol), de sorte que **Claude
Code, Codex, Cursor et Claude Desktop** se connectent sans aucune intégration
personnalisée - voir **Agents & MCP** dans la référence ci-dessous.

### Prédire l'avenir

Ajoutez un seul plugin et le graphique se dote d'une prédiction en pointillés, d'une bande de
confiance, et d'un chiffre de **précision validé par backtesting** (afin qu'il soit digne de
confiance, pas une simple estimation). La prévision fonctionne sur Line, **Fan**, Range, Area
et la famille des barres empilées.

```ts
import { forecast } from "@michi-vz/insights/forecast";
mountLineChart(el, { dataSet: revenue, xAxisDataType: "date_annual" }, {
  plugins: [forecast({ method: "holt-winters", horizon: 4, level: 0.95 })],
});
// getContext().summary → "...Revenue projected to 189 by 2027 (holt-winters, MAPE 6.1%)."
```

(La démo en haut de la page en est un exemple.) Et ce n'est **pas réservé aux courbes** - la
même prévision étend un graphique Fan (bandes de confiance imbriquées), l'empilement d'un
graphique Area, une bande Range, et plus encore :

<InsightsDemo feature="forecast" chart="fan" />

<InsightsDemo feature="forecast" chart="area" />

Le **[graphique Fan](/fr/charts/fan)** est la présentation de prévision dédiée, construite en
un seul appel avec `forecastFan()`.

### S'expliquer eux-mêmes, repérer les données incorrectes

Le graphique **détecte les anomalies** (et les marque), rédige une **narration en langage
clair**, et exécute une **validation de la qualité des données** - le tout à partir du même
contexte structuré.

<InsightsDemo feature="anomaly" />

<InsightsDemo feature="validate" />

```ts
import { anomaly } from "@michi-vz/insights/anomaly";
import { narrate } from "@michi-vz/insights/narrate";
import { validate } from "@michi-vz/insights/validate";
chart.use(anomaly());   // flags + annotates outliers
chart.use(narrate());   // richer plain-English summary (also feeds screen readers)
chart.use(validate());  // warns via onDataWarning AND marks the bad points red on the chart
```

### Nettoyer et relier aussi vos données

Le même sens structuré nettoie aussi les données désordonnées et retrouve les choses par ce
qu'elles signifient, pas par la façon dont elles sont orthographiées - sans modèle par
défaut, avec un modèle réel en option quand vous en voulez plus :

- **[Réconcilier les libellés](#reconcile-labels)** - fusionner `USA` / `united states` /
  `U.S.A.` en un seul groupe propre, afin que les totaux cessent de se scinder selon
  l'orthographe.
- **[Faire correspondre des jeux de données](#match-across-datasets)** - relier deux listes
  orthographiées différemment (un export CRM et un export ERP) en un seul graphique honnête et
  joint.
- **[Recherche intelligente](#smart-search)** - trouver une série par ce que vous voulez dire
  (« argent qui rentre »), pas par son libellé exact.
- **[Apportez votre propre modèle](#bring-a-model)** - chaque fonctionnalité adossée à un
  modèle revient à une réponse déterministe basée sur des règles ; basculez **Real model**
  dans la démo de narration pour comparer en direct, côte à côte, la prose d'un petit modèle
  exécuté dans le navigateur.

---

## Exemples concrets

Chaque graphique ci-dessous est authentique - il calcule dans votre navigateur au chargement
de la page, et il est cliquable (basculez Canvas/SVG, cliquez sur **Explain ▸**). L'important
n'est pas la démo ; c'est qu'un analyste, un banquier, un scientifique pharmaceutique, ou un
historien obtienne la réponse *sur le graphique* - sans notebook, sans serveur. Chaque terme
est expliqué la première fois qu'il apparaît, et regroupé dans le [Glossaire](#glossary).

### Prévision : où cela mène-t-il, et l'objectif sera-t-il atteint ?

La ligne en pointillés projette la tendance récente. La **bande de confiance** ombrée est
l'erreur passée propre au modèle, elle montre donc une *fourchette* honnête plutôt qu'un
chiffre unique optimiste. Et là où la projection rejoint un objectif, un **point d'atteinte**
rouge marque *quand* l'objectif est atteint - répondant à la fois à « où cela va-t-il ? » et à
la question de recherche d'objectif « y arrivera-t-on, et quand ? ».

**Le taux de croissance annualisé du chiffre d'affaires d'une banque - le plan de fin d'année
est-il atteignable ?**

<InsightsDemo feature="forecast" dataset="bank-revenue" />

**Un essai clinique - inscrira-t-il son 300e patient avant la date limite de lecture des
résultats ?**

<InsightsDemo feature="forecast" dataset="pharma-enrollment" />

**L'inflation (IPC) - la bande est large car l'avenir est réellement incertain.**

<InsightsDemo feature="forecast" dataset="cpi" />

**Un réseau électrique - la demande de pointe atteindra-t-elle la capacité avant la
construction de la prochaine centrale ?**

<InsightsDemo feature="forecast" dataset="energy-demand" />

**Un portefeuille SaaS - à quelle distance le revenu récurrent est-il du prochain jalon ?**

<InsightsDemo feature="forecast" dataset="saas-mrr" />

### Scénarios : optimiste, central, pessimiste

Une seule projection suffit rarement. Ajoutez des lignes de **scénario** - une hypothèse de
croissance optimiste et une pessimiste - et le même historique s'ouvre en éventail entre
optimiste / central / pessimiste, à la manière d'un directeur financier ou d'un test de
résistance bancaire qui encadre l'avenir.

**Un test de résistance bancaire - le chiffre d'affaires selon un scénario favorable et un
scénario sévère, comparé à la ligne du plan.**

<InsightsDemo feature="forecast" dataset="scen-bank-stress" />

**La trésorerie disponible d'une startup - quand la caisse tombe-t-elle à zéro si le prochain
tour de table prend un trimestre de retard ?**

<InsightsDemo feature="forecast" dataset="scen-startup-runway" />

**Le lancement d'un nouveau médicament - adoption forte contre adoption lente dès le premier
jour.**

<InsightsDemo feature="forecast" dataset="scen-pharma-uptake" />

### Narration : le graphique rédige son propre titre (et n'invente jamais rien)

Un graphique chargé cache sa propre histoire. `narrate()` lit les données et rédige une
phrase simple : elle nomme le **meilleur mouvement** (la série qui a le plus bougé entre le
début et la fin) et la répartition hausse/baisse. Chaque chiffre est calculé à partir des
nombres, donc - contrairement à un chatbot - elle ne peut pas en inventer un. Cliquez sur
**Explain ▸** pour voir la phrase.

**Une banque de détail - les dépôts numériques dépassent discrètement le réseau d'agences.**

<InsightsDemo feature="narrate" dataset="narr-bank-channel" />

**Un essai avec deux sites - lequel porte réellement l'étude ?**

<InsightsDemo feature="narrate" dataset="narr-pharma-sites" />

**Les salaires réels - une décennie qui a perdu du terrain, malgré la récente reprise.**

<InsightsDemo feature="narrate" dataset="narr-real-wages" />

**Un siècle d'urbanisation - les campagnes se vident à mesure que les villes se remplissent.**

<InsightsDemo feature="narrate" dataset="narr-urbanisation" />

**Le mix électrique - le charbon sort, les renouvelables prennent la tête.**

<InsightsDemo feature="narrate" dataset="narr-energy-mix" />

### Anomalie : qu'est-ce qui ne cadre pas ?

Une **anomalie** est une année qui se démarque du reste de la série. Par défaut, elle est
détectée avec un **z-score** (le nombre d'écarts-types séparant un point de la moyenne ; au-delà
d'environ trois, il est signalé) et marquée d'un point - transformant « s'est-il passé quelque
chose d'inhabituel ? » en un simple coup d'œil. La logique exacte des trois méthodes de
détection (z-score, bornes IQR, bande de prévision), leurs seuils et leurs limites sont
détaillés dans [Méthodologie](#methodology---the-exact-logic-behind-every-insight).

**Une banque - l'année où les pertes liées à la fraude à la carte s'écartent de la tendance
(une brèche ou une vague d'arnaques).**

<InsightsDemo feature="anomaly" dataset="anom-fraud" />

**Sécurité des médicaments - l'année où les événements indésirables rapportés s'envolent, un
signal pour la pharmacovigilance.**

<InsightsDemo feature="anomaly" dataset="anom-adverse" />

**Opérations - l'année où la latence de pointe explose, marquant une panne majeure.**

<InsightsDemo feature="anomaly" dataset="anom-latency" />

**Commerce de détail - l'année où les retours de produits bondissent, pointant vers un lot
défectueux.**

<InsightsDemo feature="anomaly" dataset="anom-returns" />

**Une économie - l'année où le PIB plonge, un choc récessif au milieu d'une croissance
régulière.**

<InsightsDemo feature="anomaly" dataset="anom-gdp" />

## Encore plus dans la boîte à outils

Le tableau des **Sous-chemins** vers la fin en liste davantage que la galerie ci-dessus. Voici
six autres de ces plugins en action réelle - chacun sans modèle, déterministe, et à connecter
en quelques lignes. Ils répondent à des questions qu'un graphique ordinaire laisse de côté :
*qu'est-ce qu'il faudrait pour atteindre le chiffre, quelles sont les chances, quand la
tendance a-t-elle vraiment changé, et qu'est-ce qui est saisonnier par rapport à la croissance
réelle.*

**Recherche d'objectif (goal-seek) - qu'est-ce qu'il faudrait pour atteindre le chiffre ?** La
prévision fait avancer le temps ; la recherche d'objectif le fait remonter *à rebours* depuis
une cible que vous fixez. Déplacez la cible et observez le rythme requis (la ligne dorée en
pointillés) réagir, avec un verdict sur la capacité de votre rythme récent à l'atteindre.

<PluginLab feature="goalseek" />

**Monte Carlo - les chances, pas juste une ligne.** Une seule ligne de prévision cache le
risque. Ceci exécute des centaines de futurs simulés et rapporte la *bande* ainsi que la
probabilité de franchir une cible - déterminé par une graine, donc reproductible exactement,
avec un bouton **Re-roll** pour voir la dispersion évoluer.

<PluginLab feature="montecarlo" />

**Points de rupture - quand la tendance a-t-elle vraiment changé ?** Les moyennes brouillent le
moment où une histoire bascule. Ceci trouve où la pente change structurellement et colore la
ligne par régime - ici un pic net suivi d'un déclin.

<PluginLab feature="changepoints" />

**Saisonnalité - séparer la vraie croissance du « c'est encore décembre ».** Un seul appel
scinde une ligne ondulante en une tendance lisse et une vague saisonnière répétitive, et
détecte la longueur du cycle par lui-même.

<PluginLab feature="seasonal" />

**Agréger - des lignes brutes vers un graphique en un seul appel.** Avant de pouvoir tracer des
données, il faut généralement les *mettre en forme*. `aggregate()` fait du group-by + des
mesures sans aucune dépendance (avec option DuckDB-Wasm pour du vrai SQL sur des millions de
lignes). Changez le regroupement et il se recalcule.

<PluginLab feature="sql" />

**Sonification - entendre la tendance.** Un gain d'accessibilité : chaque valeur devient une
hauteur de son, si bien qu'une série croissante *sonne* comme telle. Appuyez sur lecture - les
barres sont la sortie pure et testable de `valuesToTones()`.

<PluginLab feature="sonify" />

## Nettoyer, faire correspondre et rechercher vos données

Quatre choses que l'IA apporte à vos données, le tout dans le navigateur : **réconcilier** des
libellés désordonnés au sein d'une liste, **faire correspondre** deux listes qui orthographient
les choses différemment, **rechercher** une série par le sens, et **catégoriser** du texte
libre sans aucune règle - propulsé par de petits modèles ouverts, pas un modèle géant dans le
cloud.

**Transformer le texte en sens.** Un *embedding* est une façon de transformer un mot ou une
phrase en une liste de nombres, disposée de sorte que les choses qui *signifient* la même
chose se retrouvent proches les unes des autres - permettant à un ordinateur de dire que `USA`
et `United States` sont le même endroit, même s'ils ne partagent aucune lettre.
`@michi-vz/insights` n'invente rien de tout cela ; il montre comment *tirer parti* des modèles
open source déjà construits par la communauté : de petits **modèles d'embedding** (la famille
BERT / MiniLM) et des **LLM ouverts suffisamment petits** (Qwen, Gemma, Phi), tous exécutés
**côté client dans votre navigateur** - sans serveur, sans clé API, rien n'est envoyé nulle
part. Pointés sur les données de votre graphique, ils en améliorent la **qualité** et nettoient
les **données incorrectes et désordonnées** : quatre problèmes quotidiens se résolvent d'un
seul geste - **fusionner** ce qui signifie la même chose, **faire correspondre** ce que deux
systèmes orthographient différemment, **trouver** ce que vous voulez dire, **trier** le
non-trié. Le mode **sans modèle** par défaut s'exécute instantanément hors ligne (n-grammes de
caractères, excellent pour l'orthographe et les fautes de frappe) ; **choisissez un modèle**
dans le menu déroulant (MiniLM ~23 Mo → MPNet ~110 Mo, tailles affichées, chargé à la demande)
pour passer de la correspondance de *lettres* à la correspondance de *sens* - et faites appel à
un petit LLM pour **certifier** le résultat.

### Réconcilier les libellés

**Le problème que tout analyste connaît.** Vos données arrivent de trois sources et chacune
orthographie la même chose différemment - `United States`, `united states`, `USA`. Groupez par
correspondance exacte et votre graphique scinde un seul pays en trois courtes barres avec des
**totaux erronés**, et un après-midi entier part à écrire à la main une table de
correspondance.

**Les embeddings corrigent cela par le sens.** Transformez chaque libellé en vecteur et
fusionnez ceux qui se retrouvent proches. Le mode **sans modèle** par défaut (instantané, hors
ligne) réduit déjà l'orthographe, la casse, l'espacement et les fautes de frappe. Chargez un
vrai modèle (le menu déroulant affiche la taille de chacun) et il fusionne aussi les
abréviations et les traductions - `USA` ≈ `United States`, `Deutschland` ≈ `Germany`, `Nippon`
≈ `Japan`. **Certify** ajoute alors un petit LLM qui confirme chaque groupe et appose le nom
faisant autorité.

<EmbeddingsLab />

> Commencez sur **Raw labels** pour ressentir le désordre - 10 barres, des totaux scindés -
> puis cliquez sur **Reconcile**. Sans modèle, les variantes orthographiques sont fusionnées
> hors ligne ; charger un modèle (MiniLM → MPNet) fusionne aussi les abréviations et les
> traductions, jusqu'aux 3 véritables pays. **Certify** transmet ces groupes à un petit LLM
> exécuté dans le navigateur pour obtenir un nom faisant autorité.

> [!NOTE] La similarité propose, un modèle *certifie*.
> Un modèle d'embedding s'exécute entièrement **hors ligne** - il n'a pas d'accès internet et
> ne vérifie rien. Il fusionne `Deutschland` avec `Germany` parce que leurs vecteurs se sont
> retrouvés proches l'un de l'autre pendant l'entraînement, pas parce qu'il « connaît » le pays.
> La fusion n'est donc pas décidée sur le seul seuil brut : un libellé ne rejoint un groupe que
> lorsqu'il est **nettement plus proche de ce groupe que de tout autre** (une marge de
> confiance), ce qui empêche deux pays distincts de fusionner simplement parce qu'ils sont
> proches. Pour une réponse *faisant autorité*, **Certify** exécute une **cascade** (pas un
> mélange d'experts - cela, c'est interne à un seul modèle) : les embeddings proposent les
> fusions à moindre coût, puis un **petit** LLM exécuté dans le navigateur (Qwen / Gemma,
> tailles affichées) confirme que chaque groupe est bien un seul pays et renvoie le nom
> canonique. Ce modèle connaît réellement les pays, mais il nécessite **WebGPU** et les poids se
> téléchargent une seule fois. (Dans une vraie application, un appelant personnalisé pourrait
> pointer vers un modèle plus gros ou un serveur **Ollama** local à la place ; un site web
> statique ne peut pas appeler Ollama directement - la politique CORS du navigateur bloque
> `localhost`. Voir **Agents & MCP** ci-dessous.)

> [!NOTE] Le pari : un modèle rapide termine, un plus intelligent affine.
> Le flux ci-dessus est une expérience délibérée - laisser un modèle rapide et naïf (les
> embeddings) faire l'essentiel du travail, puis n'appeler un modèle plus lourd et plus
> intelligent (un petit LLM) que pour affiner ce qui reste. Cela échange un peu de précision
> initiale contre de la vitesse et du coût, et ne paie le modèle plus gros que là où cela compte
> vraiment. C'est une hypothèse mise à l'épreuve ici, pas une doctrine établie ; on peut
> soutenir le contraire, et l'approche - ainsi que ces résultats - évoluera à mesure que les
> modèles évoluent.

### Faire correspondre des jeux de données

**Le problème suivant : deux sources distinctes, pas une seule liste désordonnée.** Un export
CRM et un export ERP nomment chacun les mêmes clients, pays, ou produits - orthographiés
légèrement différemment dans chaque système. `reconcileLabels` nettoie les doublons *au sein*
d'une liste ; `matchLabels` relie des entités *entre* deux listes, de sorte que deux jeux de
données ne forment plus qu'un seul graphique honnête.

<MatchLab />

> Deux petits jeux de données, désaccordés exprès. Cliquez sur **Match** et les paires
> confiantes s'illuminent avec leur similarité ; le reste reste honnêtement non apparié (avec
> une indication du plus proche raté) plutôt que d'être forcé - et les lignes jointes se
> dessinent en un seul graphique, deux sous-barres par ligne.

### Recherche intelligente

Un tableau de bord avec des dizaines de séries et vous ne vous souvenez plus du nom exact.
Tapez ce que vous *voulez dire* et les embeddings classent chaque série par similarité - aucun
mot-clé n'a besoin de correspondre.

<SemanticSearchLab />

> Essayez d'abord `customer` - le mode sans modèle trouve les KPI clients par lettres
> partagées. Puis `money coming in` : seul **BERT** atteint `Revenue`, car ils partagent le
> *sens*, pas l'orthographe.

### Catégoriser

Une pile de commentaires d'enquête sans étiquettes. Donnez aux embeddings uniquement les
**noms des thèmes** (aucune liste de mots-clés, aucun entraînement) et chaque commentaire tombe
dans son thème le plus proche - le texte non structuré devient ainsi un graphique exploitable.
C'est le cas qui a réellement besoin d'un modèle : `keeps freezing` → **Performance** ne partage
aucune lettre avec un nom de thème.

<CategorizeLab />

> **Chargez BERT** et regardez les commentaires se ranger dans les bons thèmes par le sens -
> `too expensive` → Pricing, `love the clean new look` → Design & UX - aucun d'eux ne partage
> de mot-clé avec son thème.

Comment l'écrire - réconcilier d'abord, puis les autres usages des embeddings :

::: code-group

```ts [Reconcile labels]
import { reconcileLabels } from "@michi-vz/insights/embeddings";
// one call: groups messy labels by meaning, with a confidence gate + a tidy representative name
const groups = await reconcileLabels(rawLabels); // { backend: "transformers" } adds synonyms
// → [{ name: "United States", members: ["United States", "USA", ...] }, ...]
// now sum your series by group.name instead of the raw label → clean, correct totals
```

```ts [Match two datasets]
import { matchLabels } from "@michi-vz/insights/embeddings";
const { matches, unmatchedSource, unmatchedTarget } = await matchLabels(crmCountries, erpCountries);
// matches → [{ source: "USA", target: "United States", similarity: 0.91 }, ...]
const rows = matches.map((m) => ({
  label: m.target,
  valueBased: crmTotals[m.source],     // two sources, one row -
  valueCompared: erpTotals[m.target],  // feeds straight into mountComparableHorizontalBarChart
}));
```

```ts [Embed with BERT]
import { createEmbedder, cosineSimilarity } from "@michi-vz/insights/embeddings";
// opt into a small in-browser BERT (MiniLM via Transformers.js, WebGPU); lazy, nothing bundled
const e = await createEmbedder({ backend: "transformers" }); // default all-MiniLM-L6-v2
const [a, b] = await e.embed(["USA", "United States"]);
cosineSimilarity(a, b); // ≈ 0.8 - close, even with no letters in common
```

```ts [Search by meaning]
import { findSimilar } from "@michi-vz/insights/embeddings";
// rank a large chart catalog by what a query means, not how it is spelled
const ranked = await findSimilar("revenue", chartLabels, (l) => l);
```

```ts [Dashboard RAG]
import { findSimilar } from "@michi-vz/insights/embeddings";
// retrieve the charts most relevant to a question, feed THEIR context to an LLM (see Agents)
const top = (await findSimilar(question, charts, (c) => c.getContext().summary)).slice(0, 3);
```

:::

Même moteur, autres usages : **rechercher** dans un grand catalogue de graphiques par le sens,
**regrouper** des séries similaires, et le **RAG à l'échelle d'un tableau de bord** - récupérer
les bons graphiques pour qu'un agent puisse répondre à travers un tableau de bord entier (voir
**Agents & MCP**). Les embeddings sont la couche de récupération ; ce qui est notable est ce
qui se trouve par-dessus.

## Méthodologie - la logique exacte derrière chaque insight

Rien ici n'est une boîte noire : chaque insight est une méthode de manuel nommée que vous
pouvez vérifier à la main. Cette section énonce l'algorithme, ses valeurs par défaut, et ses
limites, fonctionnalité par fonctionnalité.

### Prévision

- **Méthode (par défaut `"holt-winters"`) :** le lissage exponentiel double de Holt - deux
  estimations continues, le *niveau* et la *tendance*, mises à jour à chaque point
  (`alpha = 0.5` pour le niveau, `beta = 0.3` pour la tendance ; pas encore de terme saisonnier).
  La prévision étend le dernier niveau le long de la dernière tendance. `method: "linear"`
  ajuste à la place une seule ligne des moindres carrés ordinaires à travers toute la série et
  l'étend.
- **Bande de confiance :** l'erreur type résiduelle de l'ajustement à un pas en avant sur
  l'échantillon, élargie par `sqrt(step)` à mesure que la prévision s'éloigne, multipliée par la
  valeur z de votre `level` (95% par défaut). Une bande large signifie que le modèle a mal
  ajusté l'historique ; cette honnêteté est la fonctionnalité elle-même.
- **Précision (MAPE/RMSE) :** un vrai backtest en retenue (holdout) - le dernier tiers de la
  série (jusqu'à l'horizon) est masqué, le modèle est ajusté sur le reste, et ses prédictions
  sont notées par rapport à ce qui s'est réellement passé. Les séries de moins de 6 points
  reviennent à une précision sur l'échantillon.
- **Limites :** axes des x numériques uniquement ; pas de terme de saisonnalité (une série
  fortement saisonnière prévoira sa tendance, pas son ondulation - décomposez d'abord, voir
  ci-dessous).

### Détection d'anomalies

Trois méthodes via `anomaly({ method, threshold })` ; chaque point signalé porte
`{ index, value, score, kind }` et le résultat de l'outil inclut désormais cette explication
mot pour mot :

- **`zscore` (par défaut, seuil 3) :** `score = |valeur - moyenne| / écart-type` sur la série
  elle-même ; signalé au-delà du seuil (`kind: "high"` au-dessus de la moyenne, `"low"`
  en-dessous). 3 est la coupure conservatrice de manuel ; 2 signale des pics plus légers. Mise
  en garde : une forte tendance gonfle l'écart-type et masque les valeurs aberrantes -
  utilisez `forecast` dans ce cas.
- **`iqr` (seuil 1.5) :** les bornes de Tukey - signalé en dessous de `Q1 - k*IQR` ou au-dessus
  de `Q3 + k*IQR` (Q1/Q3 = 25e/75e percentile). Les quartiles ignorent les extrêmes, ce qui
  reste donc robuste quand les données contiennent déjà des points extrêmes.
- **`forecast` :** sensible à la tendance - chaque point est testé contre une prévision à un pas
  en avant construite UNIQUEMENT à partir de l'historique qui le précède, signalé lorsqu'il
  sort de la bande à 95% ; `score` = nombre d'erreurs types d'écart.

### Narration

Le narrateur par défaut est **basé sur des règles et déterministe** - il lit uniquement le
`ChartContext` structuré (jamais les pixels bruts, jamais un modèle) : le meilleur mouvement
par variation absolue (avec son pourcentage), la répartition de tendance hausse/baisse, et le
plus grand total pour les graphiques catégoriels. Même entrée, même phrase, à chaque fois - et
il ne peut pas inventer un chiffre absent du contexte. La prose adossée à un modèle
(`explainChart`) est opt-in et revient toujours aux règles.

### Validation

Des vérifications pures de forme/statistiques sur la série : jeux de données vides, valeurs non
finies, dates dupliquées, et dates non monotones - chacune rapportée sous forme d'un
`DataWarning` typé avec l'index exact, et éventuellement annotée sur le graphique.

### Points de rupture, saisonnalité, Monte Carlo

- **Points de rupture :** pour chaque scission candidate, une ligne OLS est ajustée avant et une
  après ; la scission est notée par `|slopeAfter - slopeBefore|` et seuls les maxima locaux
  au-dessus d'un seuil sont conservés. Une détection simple et explicable des changements de
  tendance.
- **Saisonnalité :** décomposition additive classique - une tendance en moyenne mobile centrée,
  une composante saisonnière par phase centrée sur la moyenne, et un résidu ; la période est
  détectée par autocorrélation.
- **Monte Carlo :** la prévision déterministe est le chemin central ; de nombreux futurs sont
  simulés en ajoutant un bruit résiduel gaussien mis à l'échelle par `se*sqrt(step)`, avec un
  PRNG **déterminé par une graine** (mulberry32) afin que les exécutions soient reproductibles.
  Les quantiles des exécutions donnent la bande ; les décomptes de la dernière étape donnent les
  probabilités de dépassement.

### Embeddings (réconciliation, correspondance, recherche, tri)

L'embedder par défaut est un **hachage sans modèle** (n-grammes de caractères dans un vecteur de
taille fixe, normalisé L2) - entièrement hors ligne et déterministe ; il fusionne les variantes
d'orthographe/casse/fautes de frappe mais pas les vrais synonymes. `backend: "transformers"`
passe à MiniLM (voir
[D'où viennent les modèles](#where-models-come-from-and-how-to-change-it)). La similarité est
cosinus ; les seuils de fusion sont par défaut de 0.6 (hachage) / 0.7 (modèle).

`reconcileLabels` regroupe *au sein* d'une liste (liaison simple gloutonne, filtrée par une
marge de confiance afin qu'un libellé ne rejoigne qu'un groupe dont il est nettement le plus
proche). `matchLabels` relie plutôt *entre* deux listes : chaque libellé source s'apparie avec
sa seule meilleure cible, la même marge de confiance filtre le choix de la source, et par
défaut une paire ne compte que comme une **meilleure correspondance mutuelle** - chaque côté
choisit l'autre en premier - ce qui est précisément ce qui empêche deux lignes source d'entrer
en collision sur la même cible. Tout ce qui ne franchit pas les filtres est rapporté comme non
apparié avec son plus proche raté, jamais silencieusement écarté.

## Pourquoi lui faire confiance (et à qui cela s'adresse)

- **Pas une boîte noire.** Chaque chiffre repose sur une méthode de manuel nommée (Holt, MAPE,
  z-score, IQR, OLS…) - la logique exacte par fonctionnalité est détaillée dans
  [Méthodologie](#methodology---the-exact-logic-behind-every-insight) ci-dessus. Les mêmes
  primitives qu'utilise une bibliothèque de statistiques.
- **Déterministe et testé.** Les fonctionnalités statistiques donnent la même sortie pour la
  même entrée et sont couvertes par une suite de tests étendue ; tout ce qui est aléatoire
  (Monte Carlo) est déterminé par une graine.
- **Les données restent dans le navigateur.** Pas de serveur, pas d'envoi. Les backends de
  modèle distants sont strictement opt-in et documentés comme « les données quittent le
  client ».
- **Aucun verrouillage.** Aucun modèle n'est jamais embarqué ; les fonctionnalités basées sur un
  modèle sont opt-in et **reviennent** à une version statistique/basée sur des règles
  fonctionnelle si un modèle n'est pas disponible.

**À qui cela s'adresse :**

- **Vous construisez un produit (analytique embarquée) ?** Livrez à *vos* utilisateurs des
  graphiques qui prévoient et s'expliquent eux-mêmes - côté client, sans service Python à faire
  tourner.
- **Vous êtes analyste de données / de marché ?** Les méthodes que vous connaissez déjà
  (Holt-Winters, MAPE, z-score) - désormais exécutées à l'exécution dans l'application, pas
  seulement dans un notebook (voir **par rapport à un flux pandas / notebook** ci-dessous).
- **Vous construisez avec des agents IA ?** Vos graphiques deviennent des outils MCP qu'un
  agent peut lire et piloter.

## Bien démarrer

```bash
npm i @michi-vz/insights
```

```ts
import { mountLineChart } from "@michi-vz/core";
import { forecast } from "@michi-vz/insights/forecast";

const chart = mountLineChart(el, { dataSet: revenue, xAxisDataType: "date_annual" }, {
  plugins: [forecast({ horizon: 4 })],
});
```

C'est tout - le graphique prévoit désormais l'avenir. Tout ce qui suit est la référence.

---

## Prévision

```ts
forecast({
  method: "holt-winters",                                   // or "linear" / lazy "arima"
  horizon: 8,
  level: 0.95,
  zone: true,                                               // shade the forecast region (toggleable)
  scenarios: [{ name: "optimistic", growth: 0.15 }, { name: "pessimistic", growth: -0.1 }],
  trendline: true,
  threshold: { value: 0, label: "Break-even" },             // reference line + "fall point"
  onThresholdBreach: (b) => alertOps(b),                    // fires when the forecast crosses it
});
```

D'autres fonctions d'aide pures et déterministes dans `@michi-vz/insights/forecast` :
`forecastFan()`, `decompose()` / `detectPeriod()` (saisonnalité STL), `detectChangepoints()`,
`monteCarloForecast()`, `requiredGrowth()` / `pacingToGoal()` (recherche d'objectif et taux de
croissance annualisé).

## Narration : personnaliser, localiser (i18n), ou apporter un modèle

Voici la narration - un graphique à deux séries qui rédige sa propre phrase. Cliquez sur
**Explain ▸** pour la phrase instantanée basée sur des règles ; basculez sur **Real model**
pour charger un petit modèle de langage exécuté dans le navigateur (sa taille est affichée
avant tout téléchargement) et lisez sa prose à côté des règles, côte à côte :

<InsightsDemo feature="narrate" model-explain />

Le `narrate()` par défaut est **basé sur des règles** (sans modèle). Personnalisez-le de trois
façons :

```ts
import { narrate, explainChart, SLM_PRESETS } from "@michi-vz/insights/narrate";

// 1. i18n - translate the built-in phrases (the sentence logic stays):
narrate({ strings: {
  topMover: (label, dir, pct) => `${label} a ${dir === "rose" ? "le plus augmenté" : "le plus baissé"}${pct}.`,
  trendSplit: (up, down) => `${up} séries en hausse et ${down} en baisse.`,
}});

// 2. Fully custom narrator - any wording, any language:
narrate({ render: (ctx) => myTemplate(ctx) });
```

### Apporter un modèle

Essayez-le en direct dans la démo ci-dessus : basculez **Real model**, choisissez un petit
modèle par sa taille, et comparez sa prose à la phrase basée sur des règles, côte à côte.

`explainChart(ctx, { backend, model })` améliore la prose avec un modèle et **revient toujours**
au texte basé sur des règles. Aucun plugin nécessaire - appelez-le à la demande. Les **petits
modèles de langage exécutés dans le navigateur** sont privilégiés (local d'abord, privé, sans
serveur) :

```ts
// In-browser via Transformers.js (ONNX + WebGPU). Phi-3-mini (MIT) or Google Gemma 2 (2B):
await explainChart(chart.getContext(), { backend: "transformers", model: SLM_PRESETS.transformers.phi3 });
await explainChart(chart.getContext(), { backend: "transformers", model: SLM_PRESETS.transformers.gemma });

// In-browser via WebLLM (WebGPU):
await explainChart(chart.getContext(), { backend: "webllm", model: SLM_PRESETS.webllm.gemma });

// Or your own remote model (data leaves the client - opt-in):
await explainChart(chart.getContext(), { backend: "remote", caller: (prompt) => callClaude(prompt) });
```

**Vous faites déjà tourner une IA locale ?** Connectez-la directement - aucun téléchargement,
aucun Hugging Face, les prompts ne partent que vers le point de terminaison que vous nommez.
Deux appelants prêts à l'emploi couvrent les serveurs locaux courants :

```ts
import { ollamaCaller, openaiCompatCaller } from "@michi-vz/insights/narrate";

// Ollama (native API, default http://localhost:11434):
await explainChart(ctx, {
  backend: "remote",
  caller: ollamaCaller({ model: "llama3.2" }),
});

// LM Studio, llama.cpp server, vLLM, LocalAI - anything OpenAI-compatible:
await explainChart(ctx, {
  backend: "remote",
  caller: openaiCompatCaller({ url: "http://localhost:1234", model: "qwen2.5" }),
});
```

Les deux lèvent une exception en cas d'échec, donc la narration revient à la phrase
déterministe basée sur des règles - le graphique ne se retrouve jamais vide parce qu'un
serveur local était hors service.

`SLM_PRESETS` fournit des identifiants de modèle pour **Phi-3-mini** et **Gemma 2 (2B)**. Le
modèle est chargé de façon paresseuse uniquement lorsqu'il est appelé ; rien n'est embarqué, et
s'il ne peut pas se charger, le texte basé sur des règles est renvoyé. Combinez avec
`strings` / `render` pour que même le repli soit dans votre langue.

Un premier chargement de modèle télécharge des poids, montrez donc un indicateur de chargement
avec `onProgress` (connecté à Transformers.js / WebLLM). Les démos ci-dessus utilisent un
indicateur de « réflexion » calme, de style nordique, pendant l'exécution :

```ts
await explainChart(ctx, {
  backend: "transformers",
  model: SLM_PRESETS.transformers.gemma,
  onProgress: (p) => setLoading(p.status, p.progress), // drive your own loading UI
});
```

### D'où viennent les modèles (et comment le changer)

Le téléchargement d'un modèle ne devrait jamais être une surprise. Voici exactement ce que
chaque backend récupère, depuis où, par défaut :

| Backend | Télécharge ? | Source par défaut |
| --- | --- | --- |
| `rules` (par défaut) | Rien | Entièrement hors ligne, déterministe |
| `transformers` | Poids du modèle, à la première utilisation | **`https://huggingface.co`** (mis en cache dans le navigateur après le premier chargement) |
| `webllm` | Poids du modèle, à la première utilisation | Le registre pré-construit de WebLLM (hébergé sur Hugging Face), mis en cache dans le navigateur |
| `remote` | Rien | Vos prompts partent vers **votre** point de terminaison (l'option `caller`) - par exemple un serveur Ollama/llama.cpp local ou votre API. Les données quittent la page ; c'est l'opt-in. |

Interrogez la bibliothèque elle-même avant de charger quoi que ce soit, et montrez-le à vos
utilisateurs :

```ts
import { describeModelSource, SLM_PRESETS } from "@michi-vz/insights";

const src = describeModelSource("transformers", SLM_PRESETS.transformers.phi3);
// { host: "https://huggingface.co",
//   url:  "https://huggingface.co/Xenova/Phi-3-mini-4k-instruct/resolve/main/",
//   downloads: true, note: "Transformers.js downloads the model files from ..." }
```

Et redirigez-le avec `modelSource` (fonctionne sur `explainChart` et `createEmbedder`) :

```ts
// A mirror (e.g. hf-mirror.com, or your artifact proxy):
await explainChart(ctx, {
  backend: "transformers",
  modelSource: { remoteHost: "https://models.example.com" },
});

// Self-hosted, fully offline - serve the model directory from your own origin
// and FORBID any remote download (intranet/compliance):
await explainChart(ctx, {
  backend: "transformers",
  model: "my-fine-tuned-model",
  modelSource: { localModelPath: "/models/", allowRemoteModels: false },
});

// WebLLM self-hosting: point its registry at your own weights:
await explainChart(ctx, {
  backend: "webllm",
  webllmAppConfig: { model_list: [{ model: "https://your.cdn/phi3/", model_id: "phi3", model_lib_url: "https://your.cdn/phi3/lib.wasm" }] },
});

// No download at all - your own API (local or remote):
await explainChart(ctx, { backend: "remote", caller: (prompt) => fetch("/api/llm", { method: "POST", body: prompt }).then(r => r.text()) });
```

## Agents & MCP

Le même registre alimente la démo ci-dessous - chaque bouton est un véritable appel d'outil sur
le graphique (les outils identiques qu'un client MCP comme Claude Code invoquerait) :

<InsightsDemo feature="agent" />

```ts
import { createAgentRegistry, chartHandle } from "@michi-vz/insights/agent";
import { createMcpServer, stdioTransport } from "@michi-vz/insights/mcp";
const registry = createAgentRegistry();
registry.register(chartHandle("revenue", chart, props));
createMcpServer(registry, stdioTransport(), { name: "michi-vz" });
```

Outils : `get_chart_context`, `summarize_chart`, `list_series`, `forecast_series`,
`detect_threshold_breach`, `set_filter`, `highlight`, `set_disabled`, `set_data`. Le contexte de
chaque graphique est aussi une ressource lisible `michivz://chart/<name>`. Un
`messagePortTransport` fait le pont avec les graphiques d'une application web en cours
d'exécution.

---

## Référence

### Sous-chemins

Chaque capacité est son propre import tree-shakeable :

| Import | Ce que vous obtenez | API |
| --- | --- | --- |
| `@michi-vz/insights/forecast` | Plugin `forecast()` (prédiction en pointillés + bande + précision validée par backtesting), scénarios, ligne de tendance, seuil + « point d'atteinte », `forecastFan()` | [forecast](/fr/api/insights/forecast) |
| `@michi-vz/insights/forecast` (extras) | `decompose()` / `detectPeriod()` (saisonnalité), `detectChangepoints()`, `monteCarloForecast()`, `requiredGrowth()` / `pacingToGoal()` (recherche d'objectif) | [forecast extras](/fr/api/insights/forecast-extras) |
| `@michi-vz/insights/anomaly` | `anomaly()` / `detectAnomalies()` - valeurs aberrantes par z-score / IQR / bande de prévision | [anomaly](/fr/api/insights/anomaly) |
| `@michi-vz/insights/validate` | `validate()` - avertissements plus riches sur la qualité des données | [validate](/fr/api/insights/validate) |
| `@michi-vz/insights/narrate` | `narrate()` / `explainChart()` - base de règles, SLM/distant en option | [narrate](/fr/api/insights/narrate) |
| `@michi-vz/insights/embeddings` | `reconcileLabels()` / `matchLabels()` / `findSimilar()` / `createEmbedder()` - repli par hachage, BERT/MiniLM en option | [embeddings](/fr/api/insights/embeddings) |
| `@michi-vz/insights/sql` | `aggregate()` - group-by/mesures (DuckDB-Wasm en option) | [aggregate](/fr/api/insights/sql) |
| `@michi-vz/insights/sonify` | `sonify()` - entendre une série sous forme de hauteur de son | [sonify](/fr/api/insights/sonify) |
| `@michi-vz/insights/agent` | `createAgent()` + registre d'outils | [agent & MCP](/fr/api/insights/agent) |
| `@michi-vz/insights/mcp` | `createMcpServer()` - Claude Code / Codex / Cursor | [agent & MCP](/fr/api/insights/agent) |

### Comment ça marche (la logique, en termes simples)

- **Forecast.** Ajuster un modèle (Holt-Winters suit le *niveau* + la *tendance* ; la régression
  linéaire ajuste une ligne au mieux) → projeter en avant. La **bande** provient de la
  dispersion des erreurs passées propres au modèle (s'élargissant avec la distance). Un
  **backtest** masque les derniers points réels et mesure l'erreur → le chiffre de précision.
- **Anomaly.** Calculer la moyenne et la dispersion, puis signaler les points qui sont trop
  éloignés - par **z-score** (le nombre d'écarts-types séparant un point de la moyenne ;
  signalé au-delà d'environ 3) ou par **IQR** (si un point sort de la plage médiane habituelle
  des données).
- **Narrate / Explain - d'où viennent les mots.** Par **défaut, il n'y a aucun modèle d'IA du
  tout** : `narrate()` lit le `ChartContext` structuré (tendance, plus gros mouvement,
  variation en %, totaux) et remplit des modèles de phrases. C'est un assemblage de chaînes pur
  et déterministe - instantané et hors ligne. `explainChart()` peut **optionnellement**
  monter en gamme vers un véritable modèle de langage **génératif** : `backend: "transformers"`
  charge un petit modèle de génération de texte (par défaut Phi-3-mini) dans le navigateur via
  Transformers.js, `backend: "webllm"` exécute Llama/Phi sur WebGPU, ou `backend: "remote"`
  appelle un modèle de votre choix (par exemple une API Claude). Chacun d'eux reçoit le
  `ChartContext` comme prompt et **revient aux règles** si indisponible.
  > **Pas BERT.** BERT (dans `@michi-vz/insights/embeddings`) transforme le texte en vecteurs
  > pour la *similarité / recherche*, pas pour rédiger des phrases. La narration est basée sur
  > des règles par défaut, ou sur un petit LLM génératif en option - deux métiers différents.

### Glossaire

Significations en langage clair des termes utilisés par ces graphiques :

- **Point d'atteinte (fall point)** - l'endroit où la ligne projetée est censée atteindre une
  cible qui vous importe (un seuil de rentabilité, un objectif), qu'elle y monte ou qu'elle y
  descende ; il répond à « quand y arriverons-nous ? ».
- **Bande de confiance (intervalle de prédiction)** - la zone ombrée autour de la ligne de
  prévision montrant la fourchette dans laquelle la valeur future devrait atterrir ; étroite
  signifie plutôt sûr, large signifie une estimation approximative, et elle s'élargit à mesure
  qu'elle s'étend plus loin dans le futur.
- **Horizon de prévision** - le nombre de périodes futures que couvre la prévision ; un horizon
  court est plus fiable, un horizon long plus spéculatif.
- **MAPE / backtest** - une note pour la précision de la prévision : les années réelles les plus
  récentes sont masquées, prédites à partir des précédentes, et l'écart moyen est rapporté en
  pourcentage (plus bas est meilleur).
- **Holt-Winters** - la méthode de prévision par défaut ; elle apprend le niveau actuel et la
  direction de la tendance et prolonge cet élan, en pondérant davantage les années récentes que
  les anciennes.
- **z-score** - à quel point une valeur est inhabituelle, compté comme le nombre d'écarts-types
  qui la séparent de la moyenne ; au-delà d'environ trois, elle est signalée comme une valeur
  aberrante.
- **IQR (bornes de Tukey)** - un test alternatif de valeur aberrante construit à partir de la
  moitié médiane des données, si bien qu'une seule valeur extrême ne peut pas le fausser ;
  robuste pour les séries irrégulières ou asymétriques.
- **Anomalie** - un point signalé comme se démarquant du reste de la série (un pic, un
  effondrement, une possible erreur de données), marqué d'un point.
- **Meilleur mouvement (top mover)** - sur un graphique multi-courbes, la série qui a le plus
  bougé entre le début et la fin ; le résumé en langage clair la nomme, si bien que le résultat
  principal est fourni au lieu d'être à chercher.
- **Seuil / ligne de référence** - une ligne horizontale à une valeur qui compte (un objectif,
  un budget, un seuil de rentabilité) ; chaque autre valeur est lue par rapport à elle, et c'est
  la ligne que la prévision surveille pour trouver le point d'atteinte.

Et les unités et abréviations que les graphiques d'exemple utilisent :

- **IPC (indice des prix à la consommation)** - la mesure standard de l'inflation : le prix
  moyen d'un panier de biens du quotidien, donc un IPC en hausse signifie que le coût de la vie
  augmente.
- **k$ / M$** - milliers / millions de dollars (donc « 120 M$ » signifie 120 millions).
- **Indice (base 100)** - une série remise à l'échelle pour que sa première année vaille 100,
  donc « en baisse à 92 » se lit d'un coup d'œil comme « 8% en dessous de son point de départ »,
  quelles que soient les unités d'origine.
- **Gigawatt (GW)** - une unité de puissance électrique ; une grande centrale électrique
  représente environ un GW.
- **Taux de croissance annualisé (run-rate)** - le rythme auquel un chiffre croît en ce moment,
  extrapolé (par exemple « 1,2 M$ par semaine »).
- **MRR (revenu récurrent mensuel)** - le revenu prévisible d'abonnement qu'une entreprise SaaS
  enregistre chaque mois, le chiffre phare sur lequel ces entreprises sont évaluées.

### Méthodes et formules

Chaque chiffre de ces démos est calculé à partir des données, jamais approximatif - et aucun
d'eux ne nécessite un diplôme de statistiques. Voici ce que fait chaque méthode en termes
simples, la formule qui la sous-tend pour les curieux, et une source gratuite et lisible. Les
références à *Hyndman* renvoient à
[*Forecasting: Principles and Practice*](https://otexts.com/fpp3/), un manuel en ligne
gratuit.

| Ce que ça fait | Méthode | Formule (pour les curieux) | En savoir plus |
| --- | --- | --- | --- |
| **Projeter une tendance en avant** - prolonge le niveau et la pente récents ; suit une saison répétitive si elle existe. | Holt-Winters | `ŷₜ₊ₕ = ℓₜ + h·bₜ` (niveau + tendance mis à jour à chaque étape) | [Lissage exponentiel](https://otexts.com/fpp3/expsmooth.html) (Hyndman, ch. 8) |
| **Ajuster une ligne droite** - la ligne la mieux ajustée à travers les points. | Régression linéaire (OLS) | `ŷ = a + b·x` (moindres carrés) | [Régression de séries temporelles](https://otexts.com/fpp3/regression.html) (Hyndman, ch. 7) |
| **Prévoir avec de l'élan** - apprend comment chaque point dépend du passé récent. | ARIMA / SARIMA (chargé à la demande) | autorégressif + moyenne mobile | [Modèles ARIMA](https://otexts.com/fpp3/arima.html) (Hyndman, ch. 9) · [bibliothèque `arima`](https://github.com/zemlyansky/arima) |
| **Montrer à quel point la prévision est sûre** - transforme les erreurs passées propres au modèle en bandes à 50/80/95% ; plus larges plus loin. | Intervalle de prédiction | `ŷ ± z·σ·√h` (z = 1,96 pour 95%) | [Intervalles de prédiction](https://otexts.com/fpp3/prediction-intervals.html) (Hyndman, §5.5) |
| **Noter la précision** - masque les points récents, les re-prédit, et rapporte l'écart. | Backtest à origine glissante | `MAPE = moyenne(\|y−ŷ\|/\|y\|)·100` · `RMSE = √moyenne((y−ŷ)²)` | [Précision de la prévision](https://otexts.com/fpp3/accuracy.html) (Hyndman, §5.8) |
| **Séparer la saison de la tendance** - scinde une série en tendance + saison répétitive + bruit résiduel. | Décomposition STL | tendance + saisonnier + résidu (Loess) | [Décomposition STL](https://otexts.com/fpp3/stl.html) (Hyndman, §3.6) |
| **Simuler de nombreux futurs** - rejoue des milliers de trajectoires plausibles pour une fourchette meilleur/pire cas. | Monte Carlo | rééchantillonnage des résidus sur N trajectoires → dispersion du résultat | [Bootstrap et simulation](https://otexts.com/fpp3/prediction-intervals.html) (Hyndman, §5.5) |
| **Signaler une valeur aberrante (simple)** - marque les points éloignés de la moyenne. | z-score | `z = (x−μ)/σ`, signalé si `\|z\| > 3` | [Détection de valeurs aberrantes](https://www.itl.nist.gov/div898/handbook/eda/section3/eda35h.htm) (manuel NIST) |
| **Signaler une valeur aberrante (robuste)** - marque les points en dehors de la plage médiane habituelle ; insensible aux extrêmes. | IQR / bornes de Tukey | `x < Q1−1,5·IQR` ou `x > Q3+1,5·IQR` | [Boîtes à moustaches et bornes](https://www.itl.nist.gov/div898/handbook/prc/section1/prc16.htm) (manuel NIST) |
| **Mesurer une relation** - à quel point deux variables évoluent ensemble, de −1 à +1. | *r* de Pearson | `r = cov(x,y)/(σₓ·σᵧ)` | [Corrélation](https://otexts.com/fpp3/regression.html) (Hyndman, ch. 7) |
| **Faire correspondre du texte par le sens** - transforme les mots en vecteurs pour que les sens similaires obtiennent un score élevé. | Similarité cosinus | `cos = (a·b)/(‖a‖·‖b‖)` | [Embeddings de phrases](https://huggingface.co/docs/transformers.js) (Transformers.js) |

### Par rapport à un flux pandas / notebook

Pas un remplacement pour l'exploration - continuez à utiliser pandas / R / un notebook pour
cela. La différence est *où l'insight s'exécute* :

| | pandas / notebook | `@michi-vz/insights` |
| --- | --- | --- |
| **S'exécute où** | votre machine, hors ligne, une fois | l'application, le navigateur de l'utilisateur |
| **Sortie** | un chiffre statique / une image à partager | le graphique *rendu* se met à jour lui-même |
| **Public** | l'analyste | les utilisateurs de votre produit |
| **Backend** | un runtime Python | aucun - zéro serveur, les données restent locales |
| **Prêt pour l'IA** | le prompt est écrit à la main | le graphique **est** la surface d'outils (MCP) |

pandas est la façon dont un insight est *découvert* ; ceci est la façon dont il est
**livré** aux utilisateurs et transformé en un graphique qu'un agent IA peut piloter - les
mêmes méthodes dignes de confiance, livrées à l'exécution.

### Pour aller plus loin

- **Forecasting: Principles and Practice** (Hyndman & Athanasopoulos) : <https://otexts.com/fpp3/>
- **Model Context Protocol** : <https://modelcontextprotocol.io> · [annonce d'Anthropic](https://www.anthropic.com/news/model-context-protocol)
- **Transformers.js** (BERT/embeddings dans le navigateur) : <https://huggingface.co/docs/transformers.js>
- **NIST/SEMATECH e-Handbook of Statistical Methods** : <https://www.itl.nist.gov/div898/handbook/>

### Principes

- **Opt-in et tree-shakeable** - les capacités inutilisées n'ajoutent aucun octet.
- **Dégradation gracieuse** - les chemins statistiques/basés sur des règles ne nécessitent
  aucun modèle ; les chemins basés sur un modèle ont un repli.
- **Confidentialité par défaut** - les données restent dans le navigateur ; les backends
  distants sont opt-in.
- **OSS permissif uniquement** - aucun modèle n'est jamais embarqué.
