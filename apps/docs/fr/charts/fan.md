---
title: Graphique en éventail
description: "Graphique en éventail pour les prévisions avec incertitude : historique plein, un tracé le plus probable en pointillés, et des bandes de confiance qui s'élargissent vers le futur."
---
# Graphique en éventail

<span class="vp-badge tip">Tendances</span> <span class="vp-badge tip">Prévision</span>

**« Quel sera le chiffre d'affaires le trimestre prochain ? »** La réponse honnête n'est jamais un nombre unique - c'est une *fourchette*, et la fourchette est tout l'intérêt. Donnez à un dirigeant un seul chiffre et vous devinez ; donnez-lui cet éventail et vous dites la vérité sur le risque. La ligne pleine est ce qui s'est déjà produit, la ligne en pointillés est le tracé unique le plus probable, et les bandes ombrées montrent le degré de certitude de la prévision - s'élargissant à mesure qu'elles s'avancent dans le futur, car plus on regarde loin devant, moins on peut savoir.

<ChartDemo chart="fan-chart" :height="380" />

## Données volumineuses sur WebGPU <span class="vp-badge warning">Expérimental</span>

<script setup>
function makeFan() {
  const n = 1500;
  const dataSet = [];
  const bands = [];
  let level = 100;
  const cutoff = Math.round(n * 0.85);
  for (let i = 0; i < n; i++) {
    level += (Math.random() - 0.48) * 2 + Math.sin(i / 40) * 0.6;
    const certainty = i < cutoff;
    dataSet.push({ date: i, value: Math.round(level * 100) / 100, certainty });
    if (!certainty) {
      const h = i - cutoff + 1;
      const spread = Math.sqrt(h) * 1.8;
      bands.push({ date: i, valueMin: Math.round((level - spread) * 100) / 100, valueMax: Math.round((level + spread) * 100) / 100, valueMedium: Math.round(level * 100) / 100 });
    } else {
      bands.push({ date: i, valueMin: level, valueMax: level, valueMedium: level });
    }
  }
  return {
    dataSet: [
      {
        label: "Revenue",
        color: "#2563eb",
        series: dataSet,
        bands: [{ level: 0.95, series: bands }],
      },
    ],
    xAxisDataType: "number",
    fillOpacity: 0.22,
  };
}
</script>

Le `renderer="webgpu"` optionnel de FanChart peint ses marques de ligne et de bande sur le GPU tandis que les axes, étiquettes et infobulles restent sur la couche SVG. C'est conditionné par les capacités du navigateur : sur un navigateur sans WebGPU, il rétrograde automatiquement vers canvas, et `getContext().renderer` indique lequel a effectivement peint.

<WebgpuHeavyDemo element="michi-vz-fan-chart" :make="makeFan" caption="~1 500 points" />

## Comment le lire

- **Ligne pleine - historique.** Les valeurs réelles que vous avez déjà.
- **Ligne en pointillés - le tracé le plus probable** (la *médiane* de la prévision) : une meilleure estimation, jamais toute l'histoire.
- **Bandes imbriquées - confiance.** De l'intérieur vers l'extérieur = **50 % / 80 % / 95 %**. La valeur réelle devrait tomber dans la bande à 95 % environ **19 fois sur 20**. On planifie contre la bande, pas contre la ligne.
- **Pourquoi ça s'évase.** Le mois prochain est assez prévisible ; dans un an, ça ne l'est pas. L'incertitude s'accumule avec la distance, donc les bandes s'élargissent.

> Lisez votre **pire scénario** en bas de la bande extérieure et votre **meilleur scénario** en haut. L'éventail est votre scénario de base / optimiste / pessimiste en une seule image - pas besoin d'onglet de scénario séparé.

## Les mathématiques, en termes simples

Vous n'avez pas besoin des équations pour utiliser le graphique, mais voici ce qu'il y a sous le capot - et pourquoi vous pouvez lui faire confiance :

- **La médiane** vient du lissage exponentiel de **Holt-Winters**. Il suit deux quantités mobiles, le **niveau** actuel et la **tendance** (pente), et les projette vers l'avant ; si la série a une saisonnalité récurrente, il la suit aussi. (Vous préférez une ligne droite ? `method: "linear"` ajuste plutôt une régression par moindres carrés ordinaires.)
  > `ℓₜ = α·yₜ + (1−α)(ℓₜ₋₁ + bₜ₋₁)` · `bₜ = β(ℓₜ − ℓₜ₋₁) + (1−β)bₜ₋₁` · `ŷₜ₊ₕ = ℓₜ + h·bₜ`
- **Les bandes** viennent des *erreurs passées du modèle lui-même*. Il mesure de combien ses valeurs ajustées se sont trompées (la dispersion résiduelle `σ`) et élargit l'intervalle comme `ŷ ± z·σ·√h` - `z = 1.96` pour 95 %, et le `√h` est exactement pourquoi l'éventail s'ouvre avec l'horizon `h`.
- **Devriez-vous lui faire confiance ?** Un **backtest** cache les derniers points réels, les re-prévoit, et rapporte l'erreur (`MAPE`, `RMSE`). Vous obtenez un score d'honnêteté *avant* de miser sur le chiffre, pas après.

Tout cela tourne **dans le navigateur** - pas de backend de science des données, pas d'aller-retour serveur. (Power BI, à titre de comparaison, ne prévoit que sur un graphique en courbes et s'arrête là où commence la véritable modélisation.)

> Construisez les données en un seul appel avec `forecastFan()` depuis [`@michi-vz/insights/forecast`](/fr/guide/insights), ou fournissez-lui `series` (historique + médiane `certainty:false`) et des `bands` imbriquées.

## Usage

::: code-group

```ts [Insights (un seul appel)]
import { mountFanChart } from "@michi-vz/core";
import { forecastFan } from "@michi-vz/insights/forecast";

// history = DataPoint[] of actuals; build the fan (median + 50/80/95% bands)
const item = forecastFan(history, { method: "holt-winters", horizon: 4, levels: [0.5, 0.8], level: 0.95 }, "Revenue");
const chart = mountFanChart(el, { dataSet: [item], xAxisDataType: "date_annual" });
```

```ts [Vanilla JS]
import { mountFanChart } from "@michi-vz/core";

const chart = mountFanChart(el, props); // props.dataSet = FanDataItem[]
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-fan-chart id="c"></michi-vz-fan-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet (series + bands), title, …
</script>
```

:::

## Forme des données

Un `FanDataItem` est une série de ligne familière plus des bandes imbriquées :

```ts
interface FanDataItem {
  label: string;
  color?: string;
  series: DataPoint[];   // history (certainty:true) then forecast median (certainty:false → dashed)
  bands: { level: number; series: RangeDataPoint[] }[]; // drawn widest-first, graduated opacity
}
```

## API

Les props sont typées comme `FanChartProps` dans [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) et reflètent `LineChartProps` (`width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer`, `highlightItems`, `disabledItems`, `fillOpacity`, et les callbacks `on*`). `onChartDataProcessed` / `getContext()` renvoient le [ChartContext](/fr/guide/llm-context) agnostique du moteur de rendu.
