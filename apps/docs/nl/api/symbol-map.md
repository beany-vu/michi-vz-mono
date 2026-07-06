---
title: Symboolkaart API
---

# Symboolkaart API

Een symbool-/bellenkaart waarvan overlappingen worden opgelost door een krachtsimulatie: je geeft lng/lat per item op, een eenmalige simulatie duwt overlappende cirkels uit elkaar - zie de **[Symboolkaart-demo](/nl/charts/symbol-map)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/symbol-map-chart";
// <michi-vz-symbol-map-chart> is now defined
```

```ts [Vanilla JS]
import { mountSymbolMapChart } from "@michi-vz/core";

const chart = mountSymbolMapChart(el, props);
```

:::

## Props

<PropsTable chart="symbol-map-chart" />

## Gebeurtenissen

De webcomponent verzendt deze bubbelende `CustomEvent`s (de engine biedt dezelfde functionaliteit via de `on*`-callbacks in de tabel hierboven):

| Gebeurtenis | Detail | Treedt op wanneer |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | de highlight bij hover verandert |
| `michi-vz:colormapping` | `Record<string, string>` | er een kleurtoewijzing wordt gegenereerd |
| `michi-vz:dataprocessed` | `ChartContext` | gegevens worden (opnieuw) verwerkt |
| `michi-vz:datawarning` | `DataWarning[]` | waarschuwingen worden gedetecteerd (ontbrekende/ongeldige lng-lat, negatieve waarden, dubbele ids) |

## getContext()

`mountSymbolMapChart(el, props).getContext()` retourneert een renderer-onafhankelijke **`SymbolMapChartContext`**: `stats.locatedCount` / `visibleCount` / `hiddenCount` (uitgesloten door `radiusVisibleMin`) / `invalidCount` (verworpen wegens ongeldige coördinaten) / `valueDomain` / `largest` / `smallest`, een `symbols[]`-array (één rij per zichtbaar item: `id`, `label`, `value`, `valueSecond`, `radius`, `radiusSecond`, `color`), de opgeloste `projection`-naam, een deterministische samenvatting in gewone taal, en een `a11yTable`. Zie [LLM-context](/nl/guide/llm-context).

## Bron

Props zijn getypeerd als [`SymbolMapChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
