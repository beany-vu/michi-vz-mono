---
title: Validate API
---

# Validate API

Brengt slechte data aan het licht en kleurt de foutieve punten rood op de grafiek; voor het volledige verhaal, zie de **[Insights-gids](/nl/guide/insights)**.

Probeer het - de foutieve punten kleuren rood en verschijnen als waarschuwingen:

<InsightsDemo feature="validate" />

## Import

```ts
import { validate, validateSeries, invalidPoints } from "@michi-vz/insights/validate";
```

## Signatuur & opties

`validate(options?)` retourneert een plugin die problemen meldt via `onDataWarning` en, wanneer markering aanstaat, een rode marker tekent op elk ongeldig punt.

| Naam | Type | Standaard | Wat het doet |
| --- | --- | --- | --- |
| `options.highlight` | `boolean` | `true` | Markeer ongeldige punten op de grafiek met een rode marker. Zet op `false` voor alleen waarschuwingen. |

Twee helpers voeren dezelfde controles uit zonder grafiek:

| Functie | Retourneert | Wat het doet |
| --- | --- | --- |
| `validateSeries(series)` | `DataWarning[]` | Meldt problemen op datasetniveau: `non-finite-value`, `duplicate-date`, `non-monotonic-date`, en `empty-dataset`. |
| `invalidPoints(series)` | `Array<{ index, date, value, kind }>` | Somt elk foutief punt op, waarbij `kind` `"non-finite"`, `"duplicate-date"`, of `"non-monotonic"` is. |

Dit is iets anders dan `highlightItems`, dat een hele serie markeert; `validate` markeert in plaats daarvan de foutieve punten.

## Voorbeeld

```ts
import { validate } from "@michi-vz/insights/validate";

// Warn via onDataWarning and mark bad points red.
chart.use(validate());

// Warnings only, no red markers.
chart.use(validate({ highlight: false }));
```

**[Insights-gids](/nl/guide/insights)**
