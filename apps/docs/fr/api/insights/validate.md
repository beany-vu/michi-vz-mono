---
title: API Validate
---

# API Validate

Fait remonter les mauvaises données et colore en rouge les points fautifs sur le graphique ; pour l'histoire complète, voir le **[guide Insights](/fr/guide/insights)**.

Essayez-le - les mauvais points se colorent en rouge et remontent sous forme d'avertissements :

<InsightsDemo feature="validate" />

## Import

```ts
import { validate, validateSeries, invalidPoints } from "@michi-vz/insights/validate";
```

## Signature et options

`validate(options?)` retourne un plugin qui signale les problèmes via `onDataWarning` et, quand la mise en évidence est activée, dessine un marqueur rouge sur chaque point invalide.

| Nom | Type | Défaut | Ce que ça fait |
| --- | --- | --- | --- |
| `options.highlight` | `boolean` | `true` | Met en évidence les points invalides sur le graphique avec un marqueur rouge. Mettez à `false` pour n'avoir que les avertissements. |

Deux fonctions utilitaires exécutent les mêmes vérifications sans graphique :

| Fonction | Retourne | Ce que ça fait |
| --- | --- | --- |
| `validateSeries(series)` | `DataWarning[]` | Signale les problèmes au niveau du jeu de données : `non-finite-value`, `duplicate-date`, `non-monotonic-date`, et `empty-dataset`. |
| `invalidPoints(series)` | `Array<{ index, date, value, kind }>` | Liste chaque mauvais point, où `kind` vaut `"non-finite"`, `"duplicate-date"`, ou `"non-monotonic"`. |

Ceci est distinct de `highlightItems`, qui met en évidence une série entière ; `validate` met plutôt en évidence les mauvais points.

## Exemple

```ts
import { validate } from "@michi-vz/insights/validate";

// Warn via onDataWarning and mark bad points red.
chart.use(validate());

// Warnings only, no red markers.
chart.use(validate({ highlight: false }));
```

**[guide Insights](/fr/guide/insights)**
