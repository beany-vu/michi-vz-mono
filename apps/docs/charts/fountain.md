---
title: Fountain (Jet d'Eau)
description: "Fountain (Jet d'Eau) chart: a big dot for the usual value, a fountain from the lowest to the highest, and one small dot per real measurement, so you can count how often it goes past your limit. Experimental."
---
# Fountain (Jet d'Eau)

<span class="vp-badge warning">Experimental</span> <span class="vp-badge tip">Comparison</span>

::: warning Experimental - not yet stable
Unlike the other 21 charts (which are stable), the Fountain chart is **experimental**: its API, visuals, and `ChartContext` shape may change in future releases. Core 1.29 redrew it from scratch; see [Migrating from core 1.28](#migrating). Pin a version if you depend on it.
:::

**"How long does my commute take?"** "About 30 minutes" is true, but it is not the whole answer. Some days it takes 22 minutes and some days 55. What you really want to know is how often it goes past the time you allow. The fountain chart shows all of it on one axis: the usual time, the best and the worst day, and every single day as a dot you can count.

It is named after the Jet d'Eau in Geneva: a thin stem rises from the lake into a fountain of falling water.

<ChartDemo chart="fountain-chart" :index="0" :legend="false" :height="480" />

Each small dot is one of the last 20 working days. The car usually takes 30 minutes, but 3 of its 20 days went past the 45-minute line, so a bad car day happens sometimes. The bus went past it on 8 days out of 20, so a bad bus day is common. The train and the e-bike never reach the line.

## How to read it {#how-to-read-it}

::: tip The rules
- **The big dot is the number to quote**: the usual value. Half of the measurements are below it, half above.
- **A small dot is one real measurement**: 20 small dots are 20 days.
- **Many small dots close together** show what usually happens.
- **A red dashed line** is a promise or a limit.
- **How often?** Count the small dots past the line: **1-2 of 20 is rare, 3-4 is sometimes, 5 or more is common.** Under each column the chart does the counting for you: "17 of 20 within 45 min" means 17 days on the good side, so 3 went past.
- **A tall fountain** means it changes a lot. A short one means it is about the same every time.
- **More small dots in total** means more measurements, so you can trust it more. It is not a bigger value.
- **A few small dots** means it is just a guess. Under 10, the chart says so ("only 5 days").
- **Left and right mean nothing.** The small dots only move sideways so that none of them hides another.
:::

### The parts of a fountain {#anatomy}

<ChartDemo chart="fountain-chart" :index="16" :legend="false" :height="420" />

1. **Stem**: a bar from 0 up to the big dot. It stops at the big dot. Higher means more minutes, and here more minutes means slower.
2. **Big dot**: the usual day, 30 minutes. Half of the days were faster, half slower. Use this number.
3. **Fountain**: its top is the worst day (55 minutes) and its flat base is the best day (22 minutes). Its width means nothing: it only makes room for the small dots.
4. **Small dots**: one per real day, each at its exact height, always inside the fountain. Where they crowd, between 25 and 35 minutes, is what usually happens. The two high up are the only slow days.
5. **The line and its count**: the red dashed line is a promise or a limit, here the 45 minutes you allow. Under the column, "18 of 20 within 45 min" counts the small dots on the good side of it.

The numbers are printed under the column too (usual, best, worst) and shown in the tooltip, so nobody has to measure anything off the axis.

### Six patterns to look for {#patterns}

Each fountain below is the same trip, timed on different days, on the same axis: minutes, higher = slower.

#### Steady

A short fountain with the small dots close together: the same time almost every day.

<ChartDemo chart="fountain-chart" :index="17" :legend="false" :height="320" />

#### Changes a lot

A tall fountain with small dots all the way up: slow days are common, so plan extra time.

<ChartDemo chart="fountain-chart" :index="18" :legend="false" :height="320" />

#### Rare bad days

Most small dots low, an empty gap, then one or two high: usually fine, and bad days are rare.

<ChartDemo chart="fountain-chart" :index="19" :legend="false" :height="320" />

#### Often bad

Most small dots high and the big dot near the top: slow is the normal day here.

<ChartDemo chart="fountain-chart" :index="20" :legend="false" :height="320" />

#### Just a guess

Only 5 small dots: too few days to trust yet. The chart adds "only 5 days" under the column.

<ChartDemo chart="fountain-chart" :index="21" :legend="false" :height="320" />

#### Enough days

The same shape with 20 small dots: more days counted, so it is safer to trust. The fountain reaches from the same best day to the same worst day as the one above; only the number of small dots changed (the fountain is a little wider only to make room for them).

<ChartDemo chart="fountain-chart" :index="22" :legend="false" :height="320" />

## When to use it, and when not {#when-to-use}

**Use it** when each column has one number people quote, the real range around it, and ideally the measurements themselves, and the question is "how often does it go past my limit?" Commutes, delivery times, prices across shops, test scores in a class, battery life: anything measured again and again.

- It reads best with **2 to 12 columns** and 10 to 30 small dots in each.
- Add a **reference line with `goodSide`** when there is a promise, a budget or a pass mark. The chart then does the counting for the reader.
- Say which way is good in `yAxisTitle`, for example "minutes (higher = slower)".

**Use another chart** when:

- you compare two values per row (before and after, 2010 and 2023): the [Gap Chart](/charts/gap);
- you forecast many periods ahead and the forecast gets less sure the further out it goes: the [Fan Chart](/charts/fan);
- you split a total into its parts: the [Vertical Stack Bar](/charts/vertical-stack-bar);
- you only have one number per item and no range: a plain bar chart says it faster.

## Examples {#examples}

Sixteen everyday questions. The numbers are illustrative: made up to look real, not taken from a published source.

### How long is my commute, really? {#commute-by-mode}

<ChartDemo chart="fountain-chart" :index="0" :legend="false" :height="480" />

**How to read it.** Each small dot is one of the last 20 working days. The car's small dots bunch between 25 and 35 minutes, and only 3 days went past the 45 minutes I allow, up to 55. So a bad car day happens sometimes. The bus went past 45 minutes on 8 days out of 20, so a bad bus day is common. The small dots of the train and the e-bike never reach the line: they take about the same time every day.

**Why this chart.** A bar of the usual day makes the car the winner. The fountain shows that the car can also make you 25 minutes late. The small dots show how often: 3 days out of 20 for the car, 8 out of 20 for the bus, and never for the train or the e-bike. On a morning when you cannot be late, take the train.

### I pay for 100 Mbps. What do I really get? {#home-internet-promised-vs-real}

<ChartDemo chart="fountain-chart" :index="1" :legend="false" :height="480" />

**How to read it.** At 9 pm the big dot says 62, but the fountain falls to 22. The small dots show it is not one unlucky test: on 5 of the 20 evenings the speed was under 40, less than half of what you pay for. At 5 pm only two small dots sit low, so a slow late afternoon is rare. At 7 am and 1 am the small dots are packed near the top: those hours are reliable.

**Why this chart.** The usual speeds average over 80, close enough to 100 to shrug off. The 9 pm fountain shows that evenings can fall to about a fifth of the promise, and the small dots show this happens about one evening in four, not once. That is the evidence to take to the provider.

### How long does food delivery really take? {#food-delivery-real-time}

<ChartDemo chart="fountain-chart" :index="2" :legend="false" :height="480" />

**How to read it.** Each small dot is one order. On a Friday night the usual wait is 45 minutes, but 5 of the last 20 orders took over an hour, so slow deliveries are common: order before you get hungry, or collect it yourself. On a rainy Sunday almost every order is a bit slow, yet only 2 of 18 went past an hour.

**Why this chart.** The usual waits run from 25 to 50 minutes, and as bars they all look like a normal wait. The fountains show that Friday night and a rainy Sunday can both take 80 to 90 minutes. The small dots show which one to worry about: on Friday one order in four ran past an hour, while on a rainy Sunday only two did. At weekday lunch most small dots sit within five minutes of the app's 30, and late at night nearly every order beats it.

### Is the Black Friday deal really cheaper? {#black-friday-tv}

<ChartDemo chart="fountain-chart" :index="3" :legend="false" :height="480" />

**How to read it.** Each small dot is one shop's price for the same TV. In late October and early November the small dots climb: most shops raise the price. In Black Friday week they drop back to about where they were in early October, so most "deals" are only 5 to 55 € under the October line. Just one small dot sits down at 600 €: one shop out of 15 really sells it cheaper.

**Why this chart.** A line of the usual price shows only a small dip. The fountain shows prices creeping up in the weeks before, and a low end that reaches 600 € in Black Friday week, but on its own it cannot say how many shops are that cheap. The small dots can: one shop sits alone at 600 € and the other 14 are bunched around the October line. A real deal is rare, and the chart shows it.

### Will my online order arrive in time? {#parcel-delivery-by-origin}

<ChartDemo chart="fountain-chart" :index="4" :legend="false" :height="440" />

**How to read it.** From China the big dot says 12 days, but the fountain reaches 30. Count the small dots: 4 of the 20 parcels took more than 3 weeks, so a slow parcel from China is not rare. Order a birthday present a month ahead. From the UK most small dots sit at 5 to 7 days: 5 parcels took longer, and only 3 of them more than 10 days. From Germany every small dot is between 2 and 5 days.

**Why this chart.** A bar of the usual days only says that far away is slower. The fountain shows that far away is also less predictable: an order from Germany never takes more than 5 days, while one from China can take a month if it gets stuck in customs. The small dots show how often that happens. The UK and China fountains both reach far up, but from the UK only 3 parcels took more than 10 days, while from China 4 in 20 took over 3 weeks. That tells you whether the present arrives before the birthday.

### Can I trust the forecast for Saturday's barbecue? {#weather-forecast-week}

<ChartDemo chart="fountain-chart" :index="5" :legend="false" :height="440" />

**How to read it.** Saturday's fountain stays between 22° and 28°, above the 20° line either way, so the barbecue is safe to plan. Tuesday's stretches from 17° to 27° and dips below the line, so it is closer to a guess.

**Why this chart.** A forecast line looks just as sure about Tuesday as about today. The fountains grow taller over the week, so you see at a glance that Saturday's number is safe to plan on and Tuesday's is not. Each fountain sits about evenly around its big dot, because the forecast can be wrong in either direction.

### Where can I afford a two-bedroom flat? {#rent-by-city}

<ChartDemo chart="fountain-chart" :index="6" :legend="false" :height="480" />

**How to read it.** Look at the 1,000 € budget line. The fountains of Lisbon, Berlin and Madrid all reach it, but count the small dots there, because each small dot is one flat. Lisbon has only one flat that cheap and Madrid has two. Berlin has five, so it is the only city where a 1,000 € flat is easy to find.

**Why this chart.** A bar of the usual rent makes Lisbon, Berlin and Madrid look about the same. The fountains show that all three reach down to 1,000 €, and the small dots show how often that happens. In Lisbon it is one lucky flat, and the next one up is 1,180 €. In Madrid it is two flats and in Berlin five. At the top, Lisbon's 2,300 € is a single flat, while most of its flats cost between 1,250 and 1,600 €.

### Is it cheaper to shop across the border from Switzerland? {#border-basket}

<ChartDemo chart="fountain-chart" :index="7" :legend="false" :height="420" />

**How to read it.** Every neighbour's fountain tops out below the bottom of Switzerland's (86 CHF), so even the dearest shop across the border beats the cheapest Swiss one.

**Why this chart.** A bar only says Switzerland costs more. The fountains answer the real question, whether the trip pays off whichever shop you go to: the Swiss fountain and the others do not even overlap. Here each fountain sits about evenly around its big dot, because a cheap shop saves about as much as a dear one costs extra.

### Why am I so tired on Mondays? {#sleep-by-night}

<ChartDemo chart="fountain-chart" :index="8" :legend="false" :height="480" />

**How to read it.** Each small dot is one night. Sunday's big dot is only half an hour below a weeknight's, but 5 of its 16 small dots sit under 5 hours. About one Sunday in three is a bad one, and you feel it on Monday morning. Most weeknight small dots sit between 6 and 7 hours, with just one short night.

**Why this chart.** Bars say Sunday (6 hours) is barely worse than a weeknight (6.5). The fountain shows that Sunday swings the most, down to 3.5 hours. The small dots show that this is a habit, not a one-off: 5 of the last 16 Sundays were under 5 hours, so Sunday is the night to fix.

### Will my phone still last the day? {#phone-battery-year-by-year}

<ChartDemo chart="fountain-chart" :index="9" :legend="false" :height="480" />

**How to read it.** The line is a full day: off the charger at 7 am and still on at 10 pm. Each small dot is one day, so count the small dots under the line. In year 1 not one day fell short. In year 2, three days did. In year 3, ten of the 21 days did, and on three of them the phone died before 7 pm. Year 4 (dashed) is a guess, and there even a normal day falls short.

**Why this chart.** The normal-day big dot only slides from 18 to 15 hours in three years, so a plain line looks fine. The small dots show what really changed. When the phone was new, it lasted the day every single day. By year 3 it fell short about every other day. That is the point when a new battery is worth buying.

### How often is my train really late? {#train-really-late}

<ChartDemo chart="fountain-chart" :index="10" :legend="false" :height="480" />

**How to read it.** Count the small dots above the dashed line. Those are the trips the railway itself calls late: 5 of 20 on the 7:42, 9 on the 17:48 home, and just 1 on the 7:12. A small dot right on the line (exactly 5 minutes) does not count as late.

**Why this chart.** A bar of average lateness would put the 7:42 at 5.5 minutes, as if every trip were a little late. In fact half the trips were 2 to 4 minutes late, and three were 12, 18 and 25. A line over time would hide the choice between trains. Here you see at a glance that the 7:12 almost always gets you in on time, while the 7:42 ruins about one morning in four and the 17:48 nearly one evening in two.

### Which shifts are worth it for the tips? {#tips-per-shift}

<ChartDemo chart="fountain-chart" :index="11" :legend="false" :height="480" />

**How to read it.** Count the small dots above the dashed €60 line: every Saturday night cleared it, Friday missed it twice, and weekday lunch never came close.

**Why this chart.** A bar of the usual tips puts Friday (€84) right next to Saturday (€97) and makes them look alike. The small dots show that Friday fell under €60 twice while Saturday never did, and that is what decides which shift to swap away. A line chart has no time order to follow here.

### Which board game can we finish before bedtime? {#board-game-before-bedtime}

<ChartDemo chart="fountain-chart" :index="12" :legend="false" :height="480" />

**How to read it.** Ticket to Ride usually takes 55 minutes, yet 4 of its 15 games ran past the dashed one-hour bedtime line. Scrabble usually takes 48 and ran over in just 2 of 14. Uno never ran over; Monopoly ran over every time.

**Why this chart.** A bar of the usual time says Scrabble (48 min) and Ticket to Ride (55 min) both fit in an hour. The small dots show that Ticket to Ride ran past bedtime in 4 of 15 games and Scrabble in just 2 of 14. That is the difference between a calm bedtime and a fight.

### Is the weekly food shop going over €100 more often? {#weekly-shop-trend}

<ChartDemo chart="fountain-chart" :index="13" :legend="false" :height="480" />

**How to read it.** The big dot only crept up from €88 to €98, but the small dots over the €100 line went from 2 weeks to 6 out of 13.

**Why this chart.** A line of the usual weekly bill looks calm and stays under budget. The small dots show the over-budget weeks tripling (2, 3, 4, then 6 of 13), and that is what a family actually feels. A bar per season would hide it the same way.

### How often does my daughter swim 50 m fast enough for the swim meet? {#swim-gala-time}

<ChartDemo chart="fountain-chart" :index="14" :legend="false" :height="480" />

**How to read it.** Lower is faster. Small dots below the dashed line are swims fast enough for the swim meet: none in the autumn term, 2 of 14 in the spring term and 5 of 13 in the summer term.

**Why this chart.** A line of her usual time only drops under 40 s next autumn, so it says "not ready yet". The small dots show she already beat the qualifying time on 5 of 13 swims this summer, so she could enter now. A line cannot show that.

### How many in the class fail each test? {#class-test-pass-mark}

<ChartDemo chart="fountain-chart" :index="15" :legend="false" :height="480" />

**How to read it.** Count the small dots under the dashed pass line: Science's big dot sits safely at 58, yet 7 of 25 pupils failed it, and 8 failed French.

**Why this chart.** A bar of each subject's usual score puts all five above the pass mark and calls it a good term. The small dots show 7 failures in Science and 8 in French next to none in Reading, which is the thing a parent or a teacher needs to act on.

## Data shape {#data-shape}

Each `dataSet` item is one jet: one column in snapshot mode, one period in trend mode.

| Field | What it is |
| --- | --- |
| `label` | The column name (snapshot) or the series name (trend). |
| `value` | The big dot: the number to quote. Optional when `samples` are given; it is then the middle one, with half of the samples below it and half above. |
| `low`, `high` | The base and the top of the fountain. |
| `spread` | Shorthand for an even range: `low = value - spread`, `high = value + spread`. |
| `samples` | The real measurements, one small dot each. |
| `forecast` | A period that has not happened yet (see [Trend and forecast](#trend-and-forecast)). |
| `date` | The x position in trend mode. |
| `color`, `code` | A colour for this item, and a stable id carried into the context. |

The range comes from the first of: `low` and `high`, then `spread`, then the lowest and highest sample. With none of them there is no fountain, just the stem and the big dot. A sample outside `low`/`high`, or a value outside the range, widens the range to fit and sends a [data warning](/api/fountain#warnings), so nothing is hidden. Negative values are fine: the stem then runs down from 0.

## The switches {#switches}

| Prop | Default | What it does |
| --- | --- | --- |
| `showRange` | `true` | Draws the fountain. `false` keeps the stem and the big dot only; the small dots hide too, because they need the fountain to sit in. |
| `showSamples` | `true` | Draws one small dot per sample, when items have `samples`. |
| `showValueLabels` | `true` | Prints the numbers under each x label: "usual 30", the two end words, "only 5 days" under 10 samples, and the counts. |
| `drift` | `false` | The Geneva look: the top of every fountain bends to one side by the same amount. It carries no data. |
| `referenceLines` | none | Dashed red lines at values that matter. With `goodSide`, each column counts its small dots on the good side. |
| `endLabels` | `["lowest", "highest"]` | Words for the two ends of the fountain, for example `["best", "worst"]` or `["cheapest", "dearest"]`. |
| `readingGuide` | `false` | A key under the plot, on one line when it fits; otherwise it wraps between its rules (at each " · "). `true` prints the default one, with only the rules for the marks the chart draws; a string replaces it. |
| `sampleWord` | `"measurements"` | The plural word for the small dots: "20 days", "only 5 orders". |
| `labels` | English words | The other words the chart prints: `usual`, `of`, `only` and `forecast`, for other languages. |
| `yAxisTitle` | none | The title beside the y-axis, for example "minutes (higher = slower)". |

### Stem and big dot only: `showRange: false` {#show-range}

Without the fountain the chart becomes a lollipop chart: a bar up to each big dot. The small dots and the end words go; the counts under each column stay, because they come from the samples.

<ChartDemo chart="fountain-chart" :index="24" :legend="false" :height="440" />

### The Geneva look: `drift: true` {#drift}

The top of every fountain bends to the right by the same amount, like the real Jet d'Eau on a breezy day. Every jet bends the same way, so the bend tells the reader nothing. First-time readers found it confusing, which is why it is off by default: use it for a poster, not for a decision.

<ChartDemo chart="fountain-chart" :index="23" :legend="false" :height="440" />

### Lines, counts and your own words {#words}

```ts
const props = {
  yAxisTitle: "minutes (higher = slower)",
  endLabels: ["best", "worst"], // "best 22", "worst 55"
  sampleWord: "days", // "20 days", "only 5 days": plural, never changed
  referenceLines: [
    {
      value: 45,
      label: "Time I allow: 45 min", // printed at the right end of the line
      goodSide: "below", // count the small dots at or below 45
      countLabel: "within 45 min", // "17 of 20 within 45 min"
    },
  ],
  readingGuide: true, // or your own one-line key
  // The chart's own words, for another language:
  labels: { usual: "habituel", of: "sur", only: "seulement", forecast: "prévision" },
};
```

- A count includes the small dots exactly on the line: "below" counts the ones at or below it, "above" the ones at or above it.
- Forecast columns and columns without samples get no count.
- Without a `countLabel`, the words are "below the line" or "above the line".
- `showValueLabels: false` removes the lines under the x labels. The tooltip still shows the same numbers.

## Trend and forecast {#trend-and-forecast}

**Snapshot mode** is the default (`xAxisDataType: "band"`): one column per `label`. For **trend mode**, set a temporal or numeric `xAxisDataType` (`"number"`, `"date_annual"` or `"date_monthly"`) and give every item a `date`. The jets then sit along the x-axis, and a dashed grey line joins the big dots (`showTrendLine`: on by default in trend mode with one series; off with several series and in snapshot mode). In trend mode `label` is the name of the series, so one series keeps one colour.

A **`forecast: true`** item is a period that has not happened yet. It gets a dashed stem and outline, a lighter fill, a hollow big dot, no small dots and no counts, and "(forecast)" after its x label.

Periods with names (hours, terms, seasons) sit at 1, 2, 3 and so on along a number axis, and `xAxisFormat` prints the names:

```ts
const names = ["Year 1 (new)", "Year 2", "Year 3", "Year 4"];

const props = {
  xAxisDataType: "number",
  xAxisFormat: (d) => names[Number(d) - 1],
  yAxisTitle: "hours (higher = longer)",
  endLabels: ["shortest", "longest"],
  sampleWord: "days",
  referenceLines: [
    { value: 15, label: "a full day", goodSide: "above", countLabel: "lasted the day" },
  ],
  dataSet: [
    { label: "Battery", date: 1, value: 18, low: 15, high: 20, samples: [18.5, 19, 17.5 /* … */] },
    { label: "Battery", date: 2, value: 17, low: 13, high: 19, samples: [17, 18, 16.5 /* … */] },
    { label: "Battery", date: 3, value: 15, low: 10, high: 17, samples: [15.5, 13, 16 /* … */] },
    { label: "Battery", date: 4, value: 12, low: 7, high: 14, forecast: true },
  ],
};
```

The full chart is in the gallery: [Will my phone still last the day?](#phone-battery-year-by-year). Keep trend mode to a handful of periods (about 3 to 12), so each fountain has room.

## Play through the periods {#timeline}

In trend mode, `timeline` adds a play button and a scrubber that step through the periods. At each step the chart draws the jets up to the active period, the whole active jet included, and hover only reaches what is drawn. Snapshot mode has no periods, so the control does not render. Off by default.

<TimelinePlayDemo chart="fountain-chart" hint="Press the play button under the chart: it steps through the periods and draws the jets up to each one. Drag the scrubber to jump to any period." />

::: code-group

```tsx [React]
const ref = useRef<FountainChartHandle>(null);

<FountainChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(period) / seekIndex(i) / stepForward()
```

```vue [Vue]
<FountainChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:fountainChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyFountainChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-fountain-chart id="c"></michi-vz-fountain-chart>
<script>
  const el = document.getElementById("c");
  el.timeline = { speedMs: 1000, loop: true };
  // el.getTimeline() -> play() / pause() / seek(period) / seekIndex(i)
</script>
```

:::

- `speedMs` sets the pace, `loop` wraps around, `autoplay: true` starts on mount, `showControl: false` hides the built-in bar.
- The headless controller is always there: `chart.timeline()` has `play() / pause() / toggle() / seek(period) / seekIndex(i) / stepForward() / stepBack()`, plus `onStep` and `formatPeriod` in the config for your own controls. With named periods, give `formatPeriod` the same function as `xAxisFormat`.
- `seek(period)` looks for the period first, comparing as text, so `seek(2021)` and `seek("2021")` both land on 2021 whether your dates are numbers or strings. A number counts as a position (0 = first) only when no period matches, and a string that matches none does nothing. `seekIndex(i)` always goes by position, as the built-in scrubber does.
- Values glide between periods by default (`interpolate`); `interpolate: false` jumps. Reduced motion always jumps.
- `timeline` wins over `progressiveDraw` when both are set.

## Reveal animation

The chart wipes in from left to right on mount. Off by default: a chart opts in with the `progressiveDraw` prop.

<RevealDemo chart="fountain-chart" :height="440" />

`progressiveDraw: true` uses the defaults (1200 ms, easeInOutCubic). A config object tunes it:

::: code-group

```tsx [React]
const ref = useRef<FountainChartHandle>(null);

<FountainChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() re-runs the reveal on demand
```

```vue [Vue]
<FountainChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:fountainChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyFountainChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-fountain-chart id="c"></michi-vz-fountain-chart>
<script>
  const el = document.getElementById("c");
  el.progressiveDraw = { durationMs: 2000 };
  // el.replay() re-runs the reveal
</script>
```

:::

- `durationMs` and `easing` ("linear", "easeOutQuad", "easeInOutCubic", or your own `(t) => t` function) shape the sweep.
- `autoplay: false` renders the chart fully drawn; call `replay()` (React ref handle, web-component method, or the core instance) to run the reveal on demand. `replayOnUpdate: true` re-runs it on every data change.
- Respects `prefers-reduced-motion`: the chart renders fully drawn at once.

## Heavy data on WebGPU <span class="vp-badge warning">Experimental</span>

<script setup>
function makeFountain() {
  const dataSet = [];
  for (let i = 0; i < 200; i++) {
    const value = Math.max(8, Math.round(40 + 25 * Math.sin(i / 11) + 10 * Math.sin(i / 3.3)));
    const low = value - (3 + (i % 5));
    const high = value + Math.round(4 + 14 * Math.abs(Math.sin(i / 5)));
    dataSet.push({ label: `Jet ${i + 1}`, value, low, high });
  }
  return { dataSet, xAxisDataType: "band", showValueLabels: false };
}
</script>

FountainChart has an opt-in `renderer="webgpu"` that paints every stem, fountain and big dot as GPU-instanced marks, while the axes, labels and tooltips stay on the SVG layer. It is capability-gated: on a browser without WebGPU it falls back to canvas, and `getContext().renderer` reports whichever one actually painted. Past a dozen columns the chart stops being readable as a fountain chart; this demo is a stress test, not a recommendation.

<WebgpuHeavyDemo element="michi-vz-fountain-chart" :make="makeFountain" caption="200 jets" />

## Usage

::: code-group

```tsx [React]
import { FountainChart } from "@michi-vz/react";

export default () => <FountainChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { FountainChart } from "@michi-vz/vue";
</script>

<template>
  <FountainChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { fountainChart } from "@michi-vz/svelte";
</script>

<div use:fountainChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyFountainChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-fountain-chart #c></michi-vz-fountain-chart>
applyFountainChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-fountain-chart id="c"></michi-vz-fountain-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, referenceLines, …
</script>
```

```ts [Vanilla JS]
import { mountFountainChart } from "@michi-vz/core";

const chart = mountFountainChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

### Web component: attributes and properties {#web-component}

Plain strings and numbers can be attributes. Arrays, objects, functions and the switches are properties.

```html
<michi-vz-fountain-chart
  id="commute"
  chart-title="How long is my commute, really?"
  y-axis-title="minutes (higher = slower)"
  sample-word="days"
  renderer="canvas"
></michi-vz-fountain-chart>
<script>
  const el = document.getElementById("commute");
  el.dataSet = [
    { label: "Car", value: 30, low: 22, high: 55, samples: [29, 31, 27 /* one per day */] },
    { label: "Train", value: 35, low: 32, high: 42, samples: [34, 35, 33 /* … */] },
  ];
  el.endLabels = ["best", "worst"];
  el.referenceLines = [
    { value: 45, label: "Time I allow: 45 min", goodSide: "below", countLabel: "within 45 min" },
  ];
  el.readingGuide = true;
  el.showRange = true; // also: showSamples, showValueLabels, drift, labels
</script>
```

- **Attributes:** `chart-title`, `y-axis-title`, `sample-word`, `x-axis-data-type`, `renderer`, `locale`, `width`, `height`, `ticks`.
- **Properties only:** `dataSet`, `referenceLines`, `endLabels`, `labels`, `readingGuide`, `showRange`, `showSamples`, `showValueLabels`, `drift`, `showTrendLine`, `colors`, `colorsMapping`, `yAxisDomain`, `xAxisFormat`, `yAxisFormat`, `timeline`, `progressiveDraw`.
- Set the title with `chartTitle` (or `chart-title`), not `title`: `title` on an HTML element is the browser's own tooltip.

## Migrating from core 1.28 {#migrating}

Core 1.29 replaces the two old silhouettes (the jet and the plume) with one look where every mark is read off the y-axis. Old code keeps working; here is what changes.

- **Removed props are ignored.** `style`, `frothLayers`, `bloomExponent`, `stemFraction`, `showDroplets` and `showMist` are still accepted for one release, change nothing, and each sends an `ignored-option` [data warning](/api/fountain#warnings). Delete them. On the web component, `fountainStyle` (`fountain-style`) is ignored the same way.
- **Per-item `density` and `lean` are ignored**, with an `ignored-option` warning. Give real `samples` instead of a density; for the leaning look use the chart-wide `drift`.
- **`spread` now draws a real range.** `{ value: 30, spread: 8 }` still works: the fountain runs from 22 to 38 on the y-axis. The old chart drew the spread as a width that was never on the axis. If your spread measured something else (a loss, a gap, a share), it no longer fits this chart: move that number to the tooltip or to another chart.
- **`predicted` and `certainty` still work**; the new name is `forecast` (`certainty: false` is `forecast: true`).
- **The y-axis** now includes 0, every `low` and `high` and every reference line, plus 10% headroom. Negative values are drawn below the lake.
- **In trend mode, items without a `date`** are skipped with a `missing-date` warning. They used to switch the whole chart to snapshot mode.
- **Loading and no data.** The fountain now takes `isLoading`, `isNodata`, `noDataLabel` and `suppressDefaultOverlay`, like the other charts. An empty `dataSet` shows the no-data overlay ("No data available", or your `noDataLabel`) instead of empty axes: pass `isLoading` while the data loads, or `isNodata: false` to keep the empty axes.
- **Colours** come from the whole `dataSet` in first-seen order, so disabling a label never recolours the others, and a per-item `color` is honoured.
- **TypeScript: `value` and `spread` are now optional** in `FountainDataItem`, because an item may give only `samples`. Code that reads `.value` or `.spread` from your own items may need a check or `?? 0`. `tooltipFormatter` receives the item with its `value` filled in (the median of the samples when the item gives none), so `d.value` is always a number there, and a formatter typed `(d: FountainDataItem) => string` still fits.
- **Context.** `jets[].spread`, `jets[].spreadRatio` and `jets[].upperBound` stay as deprecated aliases; use `range`, `rangeRatio` and `high`. `jets[].lean` is always `null`. `stats.frothiest` is a deprecated alias; use `stats.widestRange`. See [getContext()](/api/fountain#getcontext).

## API

Props are typed as `FountainChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, or experimental `"webgpu"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context). Full reference: [Fountain API](/api/fountain).
