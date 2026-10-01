# Valeurs par défaut de l'application

`setMichiVzDefaults` définit l'apparence de départ de tous les graphiques, une seule fois pour toute l'application : la palette de couleurs, la police, les coins des barres et des tuiles, et l'infobulle. C'est l'équivalent michi-vz de `Highcharts.setOptions`, et il fonctionne de la même façon avec React, Vue, Svelte, Angular et les composants web.

```ts
import { setMichiVzDefaults } from "@michi-vz/core"; // exporté aussi par chaque paquet de framework

setMichiVzDefaults({
  colors: ["#1A657D", "#3E75B0", "#21B6A8"],
  fontFamily: "Roboto",
  barRadius: 0,
  tileRadius: 0,
  tooltip: { borderRadius: 0, shadow: false },
});
```

Appelez-le avant le montage du premier graphique, par exemple près du point d'entrée de l'application. Chaque appel s'ajoute au précédent, et `resetMichiVzDefaults()` revient à l'apparence intégrée.

## Quelle valeur l'emporte

Une prop sur un graphique l'emporte toujours. Viennent ensuite les valeurs par défaut de l'application, puis l'apparence intégrée. Ainsi `<TreemapChart tileRadius={6} />` garde ses coins de 6 px même si les valeurs par défaut indiquent 0.

## Options

| Option | S'applique à | Intégré |
|---|---|---|
| `colors` | tout graphique sans prop `colors`, et sa légende | les 20 couleurs de `DEFAULT_COLORS` |
| `fontFamily` | tout le texte des graphiques, en svg, canvas et webgpu | héritée de la page |
| `barRadius` | graphiques à barres comparables (horizontal et vertical) | 5 |
| `tileRadius` | tuiles du Treemap | 1 |
| `tooltip.borderRadius` | toutes les infobulles, en px | 4 |
| `tooltip.shadow` | `false` (aucune), `true` (intégrée) ou une valeur css `box-shadow` | une ombre légère |
| `tooltip.background`, `tooltip.borderColor`, `tooltip.color` | toutes les infobulles | blanc, `#ccc`, hérité |
| `tooltip.fontSize` | toutes les infobulles, en px | `--michi-vz-font-size` (12) |

## Identique dans chaque moteur de rendu

Chaque valeur est résolue avant tout dessin : la palette et les rayons des coins dans le modèle de données du graphique, la police et l'infobulle sous forme de variables css sur le graphique. Ainsi `renderer="svg"`, `"canvas"` et `"webgpu"` dessinent les mêmes couleurs et les mêmes coins, et l'infobulle est le même élément partout.

Les valeurs de l'infobulle deviennent des variables css (`--michi-vz-tooltip-radius`, `--michi-vz-tooltip-shadow`, `--michi-vz-tooltip-bg`, `--michi-vz-tooltip-border`, `--michi-vz-tooltip-color`, `--michi-vz-tooltip-font-size`), qu'une feuille de style peut encore remplacer pour une page.
