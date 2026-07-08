# Bien démarrer

`@michi-vz` est une bibliothèque de graphiques agnostique de framework : un **moteur** en
TypeScript pur (`@michi-vz/core`), des **web components** natifs (`@michi-vz/wc`), et de
fins wrappers **React / Vue / Svelte / Angular**. Chaque graphique se rend en **SVG ou en
canvas** (plus un chemin **WebGPU** expérimental) et émet un **`ChartContext` prêt pour les
LLM**.

## Installer

Choisissez le package correspondant à votre stack - tous les détails, les dépendances peer
et l'option CDN se trouvent dans **[Installation](/fr/guide/installation)** :

```bash
npm i @michi-vz/react
# or @michi-vz/vue  ·  @michi-vz/svelte  ·  @michi-vz/angular  ·  @michi-vz/wc  ·  @michi-vz/core
```

## Afficher un graphique

::: code-group

```tsx [React]
import { LineChart } from "@michi-vz/react";

export default () => (
  <LineChart
    dataSet={[{ label: "North", series: [{ date: 2016, value: 10, certainty: true }] }]}
    xAxisDataType="date_annual"
  />
);
```

```html [Web component / no build]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-line-chart id="c" width="600" height="300"></michi-vz-line-chart>
<script>
  document.getElementById("c").dataSet = [
    { label: "North", series: [{ date: 2016, value: 10, certainty: true }] },
  ];
</script>
```

```ts [Imperative engine]
import { mountLineChart } from "@michi-vz/core";

const chart = mountLineChart(el, { dataSet, width: 600, height: 300 });
chart.update(nextProps);
chart.getContext();
chart.destroy();
```

:::

## Le contrat de couleur (light DOM)

Les graphiques se rendent dans le **light DOM** afin que le CSS du consommateur atteigne
chaque marque - y compris les pixels du canvas, via une sonde `getComputedStyle`. Colorez
les marques via leur libellé assaini :

```css
.line[data-label-safe="North"] { stroke: #b23a2e; }
.bar[data-label-safe="Africa"] { fill: #cda14a; }
```

`@michi-vz/core/styles.css` ne gère que la mise en page / les infobulles - il ne définit
jamais `fill`/`stroke`, car la couleur est votre contrat.

## Où aller ensuite

- **Choisissez un graphique** dans la [galerie](/fr/charts/) - chaque page de graphique
  propose une démo en direct, des onglets par framework, et un lien vers sa référence
  complète des props.
- **Vous vous demandez si cette bibliothèque est faite pour vous ?** [Pourquoi
  michi-vz](/fr/guide/why) - ce qui est réellement différent, et où nous sommes honnêtes
  sur les limites.
- **Déboguez ce que vous construisez** avec le [panneau DevTools](/fr/guide/devtools) -
  dimensionnement, échelles, différences d'état, et un audit d'accessibilité pour
  n'importe quel graphique de la page.
- **Faites en sorte que vos graphiques prédisent et s'expliquent eux-mêmes** avec
  [Insights](/fr/guide/insights) - prévisions, anomalies, narration, le tout dans le
  navigateur avec la
  [méthodologie détaillée](/fr/guide/insights#methodology---the-exact-logic-behind-every-insight).
- **Connectez vos graphiques à un assistant IA** via le [contexte LLM](/fr/guide/llm-context)
  et MCP.
