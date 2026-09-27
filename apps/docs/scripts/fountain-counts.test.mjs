// Guards the numbers on the Fountain (Jet d'Eau) chart page against the example data
// (packages/examples), because the page asks readers to count the small dots:
// - every count, usual value, lowest and highest the English gallery states is the
//   data's own;
// - every verdict ("rare", "sometimes", "common") in every locale is the rules box's band
//   for the count behind it: 1-2 of 20 is rare, 3-4 is sometimes, 5 or more is common;
// - each gallery item carries the same numbers in the four locales.
// Run: `pnpm --filter docs test` (node --test; needs @michi-vz/examples built).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { examples } from "@michi-vz/examples";

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS = resolve(HERE, "..");
const LOCALES = ["", "fr/", "nl/", "vi/"];
const pages = Object.fromEntries(
  LOCALES.map((l) => [l, readFileSync(resolve(DOCS, `${l}charts/fountain.md`), "utf8")]),
);

// ---- The data ----

const byId = new Map(examples["fountain-chart"].map((e) => [e.id, e.props]));
/** One jet of an example: by label (snapshot) or by position (trend). */
function jet(id, key) {
  const props = byId.get(`fountain-${id}`);
  assert.ok(props, `no example fountain-${id}`);
  const item =
    typeof key === "number" ? props.dataSet[key] : props.dataSet.find((d) => d.label === key);
  assert.ok(item, `fountain-${id} has no jet ${key}`);
  return item;
}
const n = (j) => j.samples.length;
const over = (j, v) => j.samples.filter((x) => x > v).length;
const under = (j, v) => j.samples.filter((x) => x < v).length;
const between = (j, lo, hi) => j.samples.filter((x) => x >= lo && x <= hi).length;
const min = (j) => Math.min(...j.samples);
const max = (j) => Math.max(...j.samples);
const WORDS = "none one two three four five six seven eight nine ten".split(" ");

// ---- The page ----

/** The intro above the rules box, or one gallery item from its heading to the next. */
function section(md, slug) {
  if (slug === "intro") return md.slice(0, md.indexOf("{#how-to-read-it}"));
  const start = md.indexOf(`{#${slug}}`);
  assert.ok(start >= 0, `no #${slug} on the page`);
  const ends = ["\n### ", "\n## "].map((h) => md.indexOf(h, start)).filter((i) => i >= 0);
  return md.slice(start, Math.min(...ends));
}

/** One of the six patterns, found by the example its demo shows. */
function pattern(md, index) {
  const at = md.indexOf(`<ChartDemo chart="fountain-chart" :index="${index}"`);
  assert.ok(at >= 0, `no pattern demo ${index}`);
  return md.slice(md.lastIndexOf("\n#### ", at), at);
}

test("en: the gallery's numbers are the example data's own", () => {
  const md = pages[""];
  const says = (slug, text) =>
    assert.ok(section(md, slug).includes(text), `#${slug} should say "${text}"`);

  // How long is my commute, really? (the 45-minute line; "past" = above it)
  const car = jet("commute-by-mode", "Car");
  const bus = jet("commute-by-mode", "Bus");
  const train = jet("commute-by-mode", "Train");
  const ebike = jet("commute-by-mode", "E-bike");
  says("intro", `but ${over(car, 45)} of its ${n(car)} days went past the 45-minute line`);
  says("intro", `The bus went past it on ${over(bus, 45)} days out of ${n(bus)}`);
  says("commute-by-mode", `Each small dot is one of the last ${n(car)} working days`);
  assert.ok(between(car, 25, 35) > n(car) / 2, "the car's small dots bunch between 25 and 35");
  says(
    "commute-by-mode",
    `${over(car, 45)} days went past the 45 minutes I allow, up to ${max(car)}`,
  );
  says("commute-by-mode", `The bus went past 45 minutes on ${over(bus, 45)} days out of ${n(bus)}`);
  assert.equal(over(train, 45) + over(ebike, 45), 0, "the train and the e-bike never reach it");
  says("commute-by-mode", `can also make you ${max(car) - car.value} minutes late`);
  says(
    "commute-by-mode",
    `${over(car, 45)} days out of ${n(car)} for the car, ${over(bus, 45)} out of ${n(bus)} for the bus, and never`,
  );

  // I pay for 100 Mbps. What do I really get? (7 am, noon, 5 pm, 9 pm, 1 am)
  const nine = jet("home-internet-promised-vs-real", 3);
  const speeds = byId.get("fountain-home-internet-promised-vs-real").dataSet.map((d) => d.value);
  says(
    "home-internet-promised-vs-real",
    `the big dot says ${nine.value}, but the fountain falls to ${nine.low}`,
  );
  says(
    "home-internet-promised-vs-real",
    `on ${under(nine, 40)} of the ${n(nine)} evenings the speed was under 40`,
  );
  assert.ok(
    speeds.reduce((a, b) => a + b) / speeds.length > 80,
    "the usual speeds average over 80",
  );
  assert.equal(Math.round(100 / nine.low), 5, "9 pm falls to about a fifth of the promise");
  assert.equal(Math.round(n(nine) / under(nine, 40)), 4, "about one evening in four");

  // How long does food delivery really take? (an hour = 60 minutes)
  const friday = jet("food-delivery-real-time", "Friday night");
  const sunday = jet("food-delivery-real-time", "Rainy Sunday");
  const lunch = jet("food-delivery-real-time", "Weekday lunch");
  const late = jet("food-delivery-real-time", "Late night");
  const waits = byId.get("fountain-food-delivery-real-time").dataSet.map((d) => d.value);
  says(
    "food-delivery-real-time",
    `the usual wait is ${friday.value} minutes, but ${over(friday, 60)} of the last ${n(friday)} orders took over an hour`,
  );
  says("food-delivery-real-time", `only ${over(sunday, 60)} of ${n(sunday)} went past an hour`);
  says(
    "food-delivery-real-time",
    `The usual waits run from ${Math.min(...waits)} to ${Math.max(...waits)} minutes`,
  );
  says("food-delivery-real-time", `can both take ${friday.high} to ${sunday.high} minutes`);
  assert.equal(n(friday) / over(friday, 60), 4, "on Friday one order in four ran past an hour");
  says("food-delivery-real-time", `on a rainy Sunday only ${WORDS[over(sunday, 60)]} did`);
  assert.ok(between(lunch, 25, 35) > n(lunch) / 2, "weekday lunch: most within five minutes of 30");
  assert.ok(under(late, 30) >= n(late) - 2, "late at night nearly every order beats 30");

  // Is the Black Friday deal really cheaper? (early Oct, late Oct, early Nov, Black Friday week, early Dec)
  const tv = (i) => jet("black-friday-tv", i);
  const bf = tv(3);
  const deals = bf.samples.filter((x) => x < 800 && x >= 700);
  assert.ok(tv(1).value > tv(0).value && tv(2).value > tv(1).value, "prices climb before");
  assert.ok(deals.length > under(bf, 800) / 2, "most deals are close to the October line");
  says(
    "black-friday-tv",
    `only ${800 - Math.max(...deals)} to ${800 - Math.min(...deals)} € under the October line`,
  );
  says("black-friday-tv", `Just one small dot sits down at ${min(bf)} €: one shop out of ${n(bf)}`);
  assert.equal(under(bf, 700), 1, "one shop sits alone at the low end");
  says("black-friday-tv", `the other ${n(bf) - 1} are bunched around the October line`);

  // Will my online order arrive in time? (3 weeks = 21 days)
  const china = jet("parcel-delivery-by-origin", "From China");
  const uk = jet("parcel-delivery-by-origin", "From the UK");
  const germany = jet("parcel-delivery-by-origin", "From Germany");
  says(
    "parcel-delivery-by-origin",
    `From China the big dot says ${china.value} days, but the fountain reaches ${china.high}`,
  );
  says(
    "parcel-delivery-by-origin",
    `${over(china, 21)} of the ${n(china)} parcels took more than 3 weeks`,
  );
  assert.ok(between(uk, 5, 7) > n(uk) / 2, "most UK small dots sit at 5 to 7 days");
  says(
    "parcel-delivery-by-origin",
    `${over(uk, 7)} parcels took longer, and only ${over(uk, 10)} of them more than 10 days`,
  );
  says(
    "parcel-delivery-by-origin",
    `From Germany every small dot is between ${min(germany)} and ${max(germany)} days`,
  );
  says(
    "parcel-delivery-by-origin",
    `from the UK only ${over(uk, 10)} parcels took more than 10 days, while from China ${over(china, 21)} in ${n(china)} took over 3 weeks`,
  );

  // Can I trust the forecast for Saturday's barbecue? (today, Fri, Sat, Sun, Mon, Tue)
  const days = byId.get("fountain-weather-forecast-week").dataSet;
  const [sat, tue] = [days[2], days[5]];
  says("weather-forecast-week", `Saturday's fountain stays between ${sat.low}° and ${sat.high}°`);
  assert.ok(sat.low > 20 && tue.low < 20, "Saturday stays above the 20° line, Tuesday dips below");
  says("weather-forecast-week", `Tuesday's stretches from ${tue.low}° to ${tue.high}°`);
  const heights = days.map((d) => d.high - d.low);
  assert.ok(
    heights.every((h, i) => i === 0 || h >= heights[i - 1]),
    "taller over the week",
  );
  says("weather-forecast-week", "The fountains grow taller over the week");
  // "About evenly": the two sides of each fountain differ by at most a fifth of its height.
  const even = (d) => Math.abs(d.high - d.value - (d.value - d.low)) <= (d.high - d.low) / 5;
  assert.ok(days.every(even), "each forecast fountain sits about evenly around its big dot");
  says("weather-forecast-week", "Each fountain sits about evenly around its big dot");

  // Where can I afford a two-bedroom flat? (the 1,000 € budget: at or under it counts)
  const lisbon = jet("rent-by-city", "Lisbon");
  const atMost = (j, v) => j.samples.filter((x) => x <= v).length;
  const cheap = ["Lisbon", "Berlin", "Madrid"].map((c) => jet("rent-by-city", c));
  assert.ok(
    cheap.every((j) => j.low <= 1000),
    "the three fountains reach the budget line",
  );
  says(
    "rent-by-city",
    `Lisbon has only ${WORDS[atMost(cheap[0], 1000)]} flat that cheap and Madrid has ${WORDS[atMost(cheap[2], 1000)]}. Berlin has ${WORDS[atMost(cheap[1], 1000)]}`,
  );
  const next = [...lisbon.samples].sort((a, b) => a - b)[1];
  says("rent-by-city", `the next one up is ${next.toLocaleString("en")} €`);
  says(
    "rent-by-city",
    `In Madrid it is ${WORDS[atMost(cheap[2], 1000)]} flats and in Berlin ${WORDS[atMost(cheap[1], 1000)]}`,
  );
  says("rent-by-city", `Lisbon's ${max(lisbon).toLocaleString("en")} € is a single flat`);
  assert.equal(over(lisbon, 2000), 1, "Lisbon's dearest flat is alone at the top");
  assert.ok(between(lisbon, 1250, 1600) > n(lisbon) / 2, "most Lisbon flats cost 1,250 to 1,600 €");

  // Is it cheaper to shop across the border from Switzerland?
  const [swiss, ...neighbours] = byId.get("fountain-border-basket").dataSet;
  says("border-basket", `the bottom of Switzerland's (${swiss.low} CHF)`);
  assert.ok(
    neighbours.every((d) => d.high < swiss.low),
    "every neighbour tops out below it",
  );
  assert.ok([swiss, ...neighbours].every(even), "each fountain sits about evenly");
  says("border-basket", "each fountain sits about evenly around its big dot");

  // Why am I so tired on Mondays? (hours of sleep)
  const sun = jet("sleep-by-night", "Sunday night");
  const week = jet("sleep-by-night", "Weeknights (Mon-Thu)");
  const nights = byId.get("fountain-sleep-by-night").dataSet;
  assert.equal(week.value - sun.value, 0.5, "half an hour below a weeknight");
  says("sleep-by-night", `${under(sun, 5)} of its ${n(sun)} small dots sit under 5 hours`);
  assert.equal(Math.round(n(sun) / under(sun, 5)), 3, "about one Sunday in three");
  assert.ok(
    between(week, 6, 7) > n(week) / 2 && under(week, 6) === 1,
    "weeknights: 6 to 7, one short",
  );
  says(
    "sleep-by-night",
    `Sunday (${sun.value} hours) is barely worse than a weeknight (${week.value})`,
  );
  const range = (d) => d.high - d.low;
  assert.ok(
    nights.every((d) => range(d) <= range(sun)),
    "Sunday swings the most",
  );
  says("sleep-by-night", `down to ${min(sun)} hours`);
  says("sleep-by-night", `${under(sun, 5)} of the last ${n(sun)} Sundays were under 5 hours`);

  // Will my phone still last the day? (15 hours: 7 am to 10 pm; 12 hours: 7 pm)
  const year = (i) => jet("phone-battery-year-by-year", i);
  assert.equal(under(year(0), 15), 0, "in year 1 not one day fell short");
  says("phone-battery-year-by-year", `In year 2, ${WORDS[under(year(1), 15)]} days did`);
  says(
    "phone-battery-year-by-year",
    `In year 3, ${WORDS[under(year(2), 15)]} of the ${n(year(2))} days did, and on ${WORDS[under(year(2), 12)]} of them the phone died before 7 pm`,
  );
  assert.ok(
    year(3).forecast && year(3).value < 15,
    "year 4 is a guess, and a normal day falls short",
  );
  says(
    "phone-battery-year-by-year",
    `only slides from ${year(0).value} to ${year(2).value} hours in three years`,
  );
  assert.equal(Math.round(n(year(2)) / under(year(2), 15)), 2, "about every other day in year 3");

  // How often is my train really late? (over 5 minutes is late)
  const t712 = jet("train-really-late", "7:12 train");
  const t742 = jet("train-really-late", "7:42 train");
  const t1748 = jet("train-really-late", "17:48 home");
  says(
    "train-really-late",
    `${over(t742, 5)} of ${n(t742)} on the 7:42, ${over(t1748, 5)} on the 17:48 home, and just ${over(t712, 5)} on the 7:12`,
  );
  const mean = t742.samples.reduce((a, b) => a + b) / n(t742);
  says("train-really-late", `put the 7:42 at ${mean} minutes`);
  assert.equal(between(t742, 2, 4), n(t742) / 2, "half the 7:42 trips were 2 to 4 minutes late");
  says("train-really-late", "In fact half the trips were 2 to 4 minutes late");
  says(
    "train-really-late",
    `three were ${t742.samples
      .filter((x) => x > 10)
      .sort((a, b) => a - b)
      .join(", ")
      .replace(/, (\d+)$/, " and $1")}`,
  );
  assert.equal(n(t742) / over(t742, 5), 4, "the 7:42 ruins about one morning in four");
  assert.ok(
    over(t1748, 5) / n(t1748) >= 0.4 && over(t1748, 5) / n(t1748) < 0.5,
    "nearly one in two",
  );

  // Which shifts are worth it for the tips? (the €60 target)
  const fri = jet("tips-per-shift", "Friday night");
  const satTips = jet("tips-per-shift", "Saturday night");
  assert.equal(under(satTips, 60), 0, "every Saturday night cleared it");
  assert.equal(under(fri, 60), 2, "Friday missed it twice");
  assert.ok(max(jet("tips-per-shift", "Weekday lunch")) < 50, "weekday lunch never came close");
  says("tips-per-shift", `Friday (€${fri.value}) right next to Saturday (€${satTips.value})`);

  // Which board game can we finish before bedtime? (the one-hour line)
  const ttr = jet("board-game-before-bedtime", "Ticket to Ride");
  const scrabble = jet("board-game-before-bedtime", "Scrabble");
  says(
    "board-game-before-bedtime",
    `Ticket to Ride usually takes ${ttr.value} minutes, yet ${over(ttr, 60)} of its ${n(ttr)} games`,
  );
  says(
    "board-game-before-bedtime",
    `Scrabble usually takes ${scrabble.value} and ran over in just ${over(scrabble, 60)} of ${n(scrabble)}`,
  );
  assert.equal(over(jet("board-game-before-bedtime", "Uno"), 60), 0, "Uno never ran over");
  assert.ok(min(jet("board-game-before-bedtime", "Monopoly")) > 60, "Monopoly ran over every time");
  says(
    "board-game-before-bedtime",
    `Ticket to Ride ran past bedtime in ${over(ttr, 60)} of ${n(ttr)} games and Scrabble in just ${over(scrabble, 60)} of ${n(scrabble)}`,
  );

  // Is the weekly food shop going over €100 more often? (four seasons, then a forecast)
  const season = (i) => jet("weekly-shop-trend", i);
  const overBudget = [0, 1, 2, 3].map((i) => over(season(i), 100));
  says(
    "weekly-shop-trend",
    `from €${Math.round(season(0).value)} to €${Math.round(season(3).value)}`,
  );
  says(
    "weekly-shop-trend",
    `went from ${overBudget[0]} weeks to ${overBudget[3]} out of ${n(season(3))}`,
  );
  says(
    "weekly-shop-trend",
    `(${overBudget.slice(0, 3).join(", ")}, then ${overBudget[3]} of ${n(season(3))})`,
  );

  // How often does my daughter swim 50 m fast enough? (the 40 s qualifying time)
  const term = (i) => jet("swim-gala-time", i);
  assert.equal(under(term(0), 40), 0, "none in the autumn term");
  says(
    "swim-gala-time",
    `${under(term(1), 40)} of ${n(term(1))} in the spring term and ${under(term(2), 40)} of ${n(term(2))} in the summer term`,
  );
  assert.ok(
    term(3).forecast && term(3).value < 40 && term(2).value >= 40,
    "under 40 s only next autumn",
  );
  says("swim-gala-time", `on ${under(term(2), 40)} of ${n(term(2))} swims this summer`);

  // How many in the class fail each test? (the pass mark: under 50 fails)
  const science = jet("class-test-pass-mark", "Science");
  const french = jet("class-test-pass-mark", "French");
  const subjects = byId.get("fountain-class-test-pass-mark").dataSet;
  says(
    "class-test-pass-mark",
    `Science's big dot sits safely at ${science.value}, yet ${under(science, 50)} of ${n(science)} pupils failed it, and ${under(french, 50)} failed French`,
  );
  assert.ok(
    subjects.every((d) => d.value > 50),
    "all five usual scores are above the pass mark",
  );
  says(
    "class-test-pass-mark",
    `${under(science, 50)} failures in Science and ${under(french, 50)} in French`,
  );
  assert.equal(under(jet("class-test-pass-mark", "Reading"), 50), 0, "none failed Reading");
});

// ---- Verdicts, in every locale ----

const wholeWords = (alts) =>
  new RegExp(`(?<![\\p{L}\\p{N}])(${alts.join("|")})(?![\\p{L}\\p{N}])`, "iu");
/** The rules box's three bands, in each locale's words. */
const BANDS = {
  "": { rare: ["rare"], sometimes: ["sometimes"], common: ["common"] },
  "fr/": { rare: ["rares?"], sometimes: ["parfois"], common: ["fréquente?s?"] },
  "nl/": { rare: ["zeldzaam", "zelden"], sometimes: ["soms"], common: ["vaak"] },
  "vi/": { rare: ["hiếm"], sometimes: ["thỉnh thoảng"], common: ["thường xuyên", "chuyện thường"] },
};
const band = (count) => (count >= 5 ? "common" : count >= 3 ? "sometimes" : "rare");

// Each verdict: where it is, what it is about in each locale, and the count behind it.
// The six patterns are one trip on one axis, judged against the commute's 45 minutes.
const VERDICTS = [
  {
    about: "a bad car day (commute)",
    where: (md) => [section(md, "intro"), section(md, "commute-by-mode")],
    subject: {
      "": "bad car day",
      "fr/": "mauvais jour en voiture",
      "nl/": "slechte autodag",
      "vi/": "ngày tệ khi đi ô tô",
    },
    count: over(jet("commute-by-mode", "Car"), 45),
  },
  {
    about: "a bad bus day (commute)",
    where: (md) => [section(md, "intro"), section(md, "commute-by-mode")],
    subject: {
      "": "bad bus day",
      "fr/": "mauvais jour en bus",
      "nl/": "slechte busdag",
      "vi/": "ngày tệ khi đi xe buýt",
    },
    count: over(jet("commute-by-mode", "Bus"), 45),
  },
  {
    about: "a slow Friday-night delivery",
    where: (md) => [section(md, "food-delivery-real-time")],
    subject: {
      "": "slow deliveries",
      "fr/": "livraisons lentes",
      "nl/": "trage bezorging",
      "vi/": "giao chậm",
    },
    count: over(jet("food-delivery-real-time", "Friday night"), 60),
  },
  {
    // A real deal: at least 100 € under the October line.
    about: "a real Black Friday deal",
    where: (md) => [section(md, "black-friday-tv")],
    subject: {
      "": "real deal",
      "fr/": "vraie bonne affaire",
      "nl/": "echte deal",
      "vi/": "món hời thật",
    },
    count: under(jet("black-friday-tv", 3), 700),
  },
  {
    about: "slow days (pattern: changes a lot)",
    where: (md) => [pattern(md, 18)],
    subject: { "": "slow days", "fr/": "jours lents", "nl/": "langzame dagen", "vi/": "ngày chậm" },
    count: over(jet("key-changes-a-lot", 0), 45),
  },
  {
    about: "bad days (pattern: rare bad days)",
    where: (md) => [pattern(md, 19)],
    subject: { "": "bad days", "fr/": "mauvais jours", "nl/": "slechte dagen", "vi/": "ngày tệ" },
    count: over(jet("key-rare-bad-days", 0), 45),
  },
];

for (const l of LOCALES) {
  test(`${l || "en/"}charts/fountain.md: every verdict is the rules box's band for its count`, () => {
    for (const v of VERDICTS) {
      for (const text of v.where(pages[l])) {
        const clauses = text
          .split(/(?<=[.!?;:])\s+/)
          .filter((c) => c.toLowerCase().includes(v.subject[l].toLowerCase()));
        assert.ok(clauses.length > 0, `no clause about ${v.about}`);
        for (const clause of clauses) {
          const said = Object.keys(BANDS[l]).filter((b) => wholeWords(BANDS[l][b]).test(clause));
          assert.deepEqual(said, [band(v.count)], `${v.about} is ${v.count} of 20: "${clause}"`);
        }
      }
    }
  });
}

// ---- The same numbers in every locale ----

/** The numbers in a text, sorted: thousands separators dropped, decimal commas read. */
function numbers(text, l) {
  const t =
    l === ""
      ? text.replace(/(\d),(\d{3})/g, "$1$2")
      : text.replace(/(\d)[.   ](\d{3})(?!\d)/g, "$1$2").replace(/(\d),(\d)/g, "$1.$2");
  return [...t.matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0])).sort((a, b) => a - b);
}

// Clock times ("9 pm", "21 h", "21.00 uur") and spelled-out counts ("three", "trois") are
// written differently in each language, so these items are checked by hand.
const WORDED = [
  "home-internet-promised-vs-real",
  "phone-battery-year-by-year",
  "train-really-late",
];

for (const l of LOCALES.slice(1)) {
  test(`${l}charts/fountain.md: each gallery item has the same numbers as en`, () => {
    const slugs = [...pages[""].matchAll(/^### .+ \{#([a-z0-9-]+)\}$/gm)]
      .map((m) => m[1])
      .filter((s) => byId.has(`fountain-${s}`) && !WORDED.includes(s));
    assert.equal(slugs.length, 16 - WORDED.length);
    for (const slug of slugs) {
      const strip = (s) => s.replace(/<ChartDemo[^>]*>/g, "");
      assert.deepEqual(
        numbers(strip(section(pages[l], slug)), l),
        numbers(strip(section(pages[""], slug)), ""),
        `#${slug}`,
      );
    }
  });
}
