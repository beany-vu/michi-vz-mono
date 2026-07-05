# Provider et état partagé

`@michi-vz/react` fournit une couche de contexte React - `MichiVzProvider` +
`useChartContext` - qui permet à un arbre de graphiques de partager couleurs, mises en
évidence et état d'affichage sans prop-drilling.

## MichiVzProvider

Enveloppez une sous-arborescence pour partager l'état entre tous les graphiques qu'elle contient :

```tsx
import { MichiVzProvider, LineChart } from "@michi-vz/react";

export default function Dashboard() {
  return (
    <MichiVzProvider
      colorsMapping={{ North: "#b23a2e", South: "#4a90d9" }}
      highlightItems={["North"]}
    >
      <LineChart dataSet={dataSet} xAxisDataType="date_annual" />
    </MichiVzProvider>
  );
}
```

Toutes les props sont optionnelles. Le provider les fusionne dans chaque graphique de
l'arbre via `resolveEffectiveProps`.

### Props

| Prop | Type | Rôle |
|---|---|---|
| `colorsMapping` | `Record<string, string>` | Libellé → couleur hexadécimale. Appliqué aux marques et lu par la sonde canvas. |
| `highlightItems` | `string[]` | Libellés à dessiner en pleine opacité ; les autres sont atténués. |
| `disabledItems` | `string[]` | Libellés entièrement masqués du graphique. |
| `hiddenItems` | `string[]` | Libellés exclus du rendu (complément de `visibleItems`). |
| `visibleItems` | `string[]` | Liste blanche explicite ; les libellés qui n'en font pas partie sont masqués. |
| `fontFamily` | `string` | Définit `--michi-vz-font-family` pour que le texte SVG et le texte canvas correspondent. La famille doit déjà être chargée par la page. |
| `singlePointLine` | `boolean \| SinglePointLineConfig` | Comment rendre une série avec un seul point de donnée (point, courte ligne, etc.). |
| `categoryMetadata` | `Record<string, { color?: string; label?: string }>` | Surcharges de couleur/libellé par catégorie. |
| `colorsBasedMapping` | `Record<string, string>` | Contrat de couleur secondaire (par ex. pour les remplissages d'aires par rapport aux traits). |
| `locale` | `string` | Locale BCP-47 transmise aux formateurs d'axes (par ex. `"fr"`, `"ar"`). |
| `dir` | `"ltr" \| "rtl"` | Direction du texte. `"rtl"` inverse les axes horizontaux. |

En coulisses, `MichiVzProvider` crée un `MichiVzStore` (via `createMichiVzStore` de
`@michi-vz/core`) au premier rendu, et le resynchronise quand les props changent. Le store
est agnostique du framework ; un futur coordinateur de web components pourra partager la
même instance de store.

## useChartContext

Lisez l'état partagé actuel depuis n'importe où dans l'arbre du provider :

```tsx
import { useChartContext } from "@michi-vz/react";

function MyLegend() {
  const { colorsMapping, disabledItems } = useChartContext();
  return (
    <ul>
      {Object.entries(colorsMapping).map(([label, color]) => (
        <li key={label} style={{ opacity: disabledItems.includes(label) ? 0.3 : 1 }}>
          <span style={{ background: color, width: 12, height: 12, display: "inline-block" }} />
          {label}
        </li>
      ))}
    </ul>
  );
}
```

`useChartContext` s'abonne via `useSyncExternalStore` - les mises à jour sont sans
déchirure (tear-free) sous le rendu concurrent. Quand aucun `MichiVzProvider` n'est présent
dans l'arbre, il renvoie des valeurs par défaut vides et sûres (`colorsMapping: {}`,
`highlightItems: []`, etc.) afin que vous ne lisiez jamais `undefined`.

## Le contrat de couleur legendData

Pour les **graphiques en canvas**, le moteur ne peut pas lire directement les variables CSS
au moment du dessin - il utilise à la place une sonde `getComputedStyle`. Quand un graphique
est rendu avec `skipColorMappingDispatch` (le consommateur contrôle les couleurs, pas le
moteur), le flux d'autorité de couleur est le suivant :

1. Le moteur remplit `ChartContext.legendData` après le traitement des données. Chaque entrée est un `LegendItem` :

   ```ts
   type LegendItem = {
     label: string;        // human label (e.g. "Sub-Saharan Africa")
     color: string;        // resolved colour at render time
     order: number;        // appearance order in the series
     disabled?: boolean;
     dataLabelSafe: string; // sanitizeForClassName(label) → "sub-saharan-africa"
   };
   ```

2. Une autorité de couleur côté consommateur lit `legendData` depuis `onChartDataProcessed(ctx)` et émet du CSS ciblant l'attribut `data-label-safe` :

   ```css
   /* emitted by your colour authority into a <style> block */
   .line[data-label-safe="sub-saharan-africa"] { stroke: #4a90d9; }
   .line[data-label-safe="north-africa"]       { stroke: #e8a838; }
   ```

3. Au rendu suivant, la sonde canvas appelle `getComputedStyle` sur l'élément SVG correspondant et lit la couleur - aucun problème d'opacité/de barre transparente.

Le champ `dataLabelSafe` est produit par `sanitizeForClassName` de `@michi-vz/core` et reste stable d'un rendu à l'autre pour une même chaîne de libellé.

::: tip Liste de vérification couleur pour le canvas
Pour les graphiques en canvas (`renderer="canvas"` + `skipColorMappingDispatch`) il vous faut **les deux** :

- Un bloc `<style>{cssFromLegendData}</style>` dans votre JSX - sans lui, chaque barre se rend transparente.
- Un montage inconditionnel + un remontage piloté par clé (`key={chartKey}`) plutôt que `{ready && <Chart />}` - le montage conditionnel empêche `isNodataComponent` de se déclencher sur des données vides.
:::

## Migrer depuis le package autonome `michi-vz`

Les packages du mono-repo (`@michi-vz/core` + `@michi-vz/react`) forment un sur-ensemble
compatible directement (drop-in) avec l'ancien package npm `michi-vz`. La plupart des
changements sont additifs ; le tableau ci-dessous couvre les parties qui diffèrent.

### Chemins d'import

| `michi-vz` historique | Mono `@michi-vz/react` |
|---|---|
| `import { MichiVzProvider } from "michi-vz"` | `import { MichiVzProvider } from "@michi-vz/react"` |
| `import { useChartContext } from "michi-vz"` | `import { useChartContext } from "@michi-vz/react"` |
| `import { ScatterPlotChart } from "michi-vz"` | `import { ScatterPlotChart } from "@michi-vz/react"` (alias conservé) |

### Alias ScatterPlotChart

Le graphique a été renommé `ScatterChart` dans le mono. `ScatterPlotChart`,
`ScatterPlotChartProps` et `ScatterPlotChartHandle` sont tous réexportés comme alias afin
que les imports existants compilent sans changement.

### legendData

Dans le package historique, `legendData` se trouvait sur `ChartMetadata` et n'était
disponible que pour certains graphiques. Dans le mono, c'est un champ de première classe
sur `ChartContext` (renvoyé par `chart.getContext()` et transmis à
`onChartDataProcessed`) et il est aujourd'hui rempli par `LineChart`, les autres types de
graphiques suivront.

### Aucun import CSS nécessaire

Le package historique nécessitait un import séparé,
`import "michi-vz/dist/style.css"`. Le mono injecte automatiquement le CSS de mise en
page/overlay via `ensureStyles()` au moment du montage - retirez l'import si vous en avez
un. Le CSS de couleur (fill/stroke) reste votre contrat, comme avant.

### Parité Provider / useChartContext

`MichiVzProvider` accepte exactement les mêmes props de base qu'avant (`colorsMapping`,
`highlightItems`, `disabledItems`, `fontFamily`, `singlePointLine`), plus les nouveaux
ajouts (`hiddenItems`, `visibleItems`, `categoryMetadata`, `colorsBasedMapping`, `locale`,
`dir`). `useChartContext` renvoie un sur-ensemble de l'ancien `MichiVzState` - les
déstructurations existantes restent sûres.
