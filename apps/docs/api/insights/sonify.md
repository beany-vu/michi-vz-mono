---
title: Sonify API
---

# Sonify API

Hear a data series as pitch over time - an accessibility aid ("hear the trend"): low values map to low
notes, high values to high notes, so a rising series *sounds* like it rises. For the demo with a
play button, see the **[Insights guide](/guide/insights#more-from-the-toolbox)**.

Try it - press play to hear the trend (the bars are the pure `valuesToTones()` output):

<PluginLab feature="sonify" />

## Import

```ts
import { sonify, valuesToTones } from "@michi-vz/insights/sonify";
// also re-exported from the package root: import { sonify } from "@michi-vz/insights";
```

## `sonify` - play a series

```ts
await sonify(values, { duration: 3, minFreq: 220, maxFreq: 880 });
```

Schedules one tone per value via the Web Audio API. It is a **graceful no-op** where there is no
`AudioContext` (SSR / jsdom / unsupported browsers), so it is safe to call anywhere.

## `valuesToTones` - the pure mapping

```ts
const tones = valuesToTones(values, { duration: 3 });
// → [{ time, duration, freq, value }, ...]
```

Deterministic and testable - the same input always yields the same tones (the demo draws these as
bars). Non-finite values are ignored when computing the min/max range.

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `duration` | `number` | `3` | Total playback length, in seconds. |
| `minFreq` | `number` | `220` | Pitch (Hz) mapped to the minimum value. |
| `maxFreq` | `number` | `880` | Pitch (Hz) mapped to the maximum value. |

Each `Tone` is `{ time, duration, freq, value }` (seconds / seconds / Hz / source value).

**[Insights guide](/guide/insights#more-from-the-toolbox)**
