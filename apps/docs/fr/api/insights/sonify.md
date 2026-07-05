---
title: API Sonify
---

# API Sonify

Entendre une série de données comme une hauteur de son dans le temps - une aide à l'accessibilité
("entendre la tendance") : les valeurs basses correspondent à des notes graves, les valeurs hautes à des
notes aiguës, de sorte qu'une série croissante *sonne* comme si elle montait. Pour la démo avec un bouton
de lecture, voir le **[guide Insights](/fr/guide/insights#more-from-the-toolbox)**.

Essayez-le - appuyez sur play pour entendre la tendance (les barres sont la sortie pure de `valuesToTones()`) :

<PluginLab feature="sonify" />

## Import

```ts
import { sonify, valuesToTones } from "@michi-vz/insights/sonify";
// also re-exported from the package root: import { sonify } from "@michi-vz/insights";
```

## `sonify` - jouer une série

```ts
await sonify(values, { duration: 3, minFreq: 220, maxFreq: 880 });
```

Planifie une tonalité par valeur via l'API Web Audio. C'est un **no-op silencieux** là où il n'y a pas
d'`AudioContext` (SSR / jsdom / navigateurs non pris en charge), donc il est sûr de l'appeler n'importe où.

## `valuesToTones` - le mappage pur

```ts
const tones = valuesToTones(values, { duration: 3 });
// → [{ time, duration, freq, value }, ...]
```

Déterministe et testable - la même entrée produit toujours les mêmes tonalités (la démo les dessine comme
des barres). Les valeurs non finies sont ignorées lors du calcul de la plage min/max.

| Option | Type | Défaut | Ce que ça fait |
| --- | --- | --- | --- |
| `duration` | `number` | `3` | Durée totale de lecture, en secondes. |
| `minFreq` | `number` | `220` | Hauteur (Hz) associée à la valeur minimale. |
| `maxFreq` | `number` | `880` | Hauteur (Hz) associée à la valeur maximale. |

Chaque `Tone` est `{ time, duration, freq, value }` (secondes / secondes / Hz / valeur source).

**[guide Insights](/fr/guide/insights#more-from-the-toolbox)**
