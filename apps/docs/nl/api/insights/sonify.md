---
title: Sonify API
---

# Sonify API

Hoor een dataserie als toonhoogte in de tijd - een toegankelijkheidshulpmiddel ("hoor de trend"): lage
waarden worden gekoppeld aan lage tonen, hoge waarden aan hoge tonen, zodat een stijgende reeks ook echt
*klinkt* alsof hij stijgt. Voor de demo met een afspeelknop, zie de **[Insights-gids](/nl/guide/insights#more-from-the-toolbox)**.

Probeer het - druk op play om de trend te horen (de balken zijn de pure `valuesToTones()`-uitvoer):

<PluginLab feature="sonify" />

## Import

```ts
import { sonify, valuesToTones } from "@michi-vz/insights/sonify";
// also re-exported from the package root: import { sonify } from "@michi-vz/insights";
```

## `sonify` - speel een serie af

```ts
await sonify(values, { duration: 3, minFreq: 220, maxFreq: 880 });
```

Plant één toon per waarde via de Web Audio API. Het is een **elegante no-op** wanneer er geen
`AudioContext` beschikbaar is (SSR / jsdom / niet-ondersteunde browsers), dus het is overal veilig om
aan te roepen.

## `valuesToTones` - de pure mapping

```ts
const tones = valuesToTones(values, { duration: 3 });
// → [{ time, duration, freq, value }, ...]
```

Deterministisch en testbaar - dezelfde invoer levert altijd dezelfde tonen op (de demo tekent deze als
balken). Niet-eindige waarden worden genegeerd bij het berekenen van het min/max-bereik.

| Optie | Type | Standaard | Wat het doet |
| --- | --- | --- | --- |
| `duration` | `number` | `3` | Totale afspeellengte, in seconden. |
| `minFreq` | `number` | `220` | Toonhoogte (Hz) gekoppeld aan de minimumwaarde. |
| `maxFreq` | `number` | `880` | Toonhoogte (Hz) gekoppeld aan de maximumwaarde. |

Elke `Tone` is `{ time, duration, freq, value }` (seconden / seconden / Hz / bronwaarde).

**[Insights-gids](/nl/guide/insights#more-from-the-toolbox)**
