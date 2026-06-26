// Unit test for the docs API extractor. Run: `pnpm --filter docs test`
// (node --test). Pins the extraction contract so the API tables can't silently
// break when types.ts / engine defaults change.
import { test } from "node:test";
import assert from "node:assert/strict";
import { extract, CHARTS, SHARED } from "./extract-props.mjs";

const data = extract();
const prop = (key, name) => data.charts[key].props.find((p) => p.name === name);

test("emits all 11 charts, keyed by element suffix", () => {
  assert.equal(Object.keys(data.charts).length, 11);
  for (const c of CHARTS) assert.ok(data.charts[c.key], `missing ${c.key}`);
});

test("each chart carries element + propsType + non-empty props", () => {
  for (const c of CHARTS) {
    const chart = data.charts[c.key];
    assert.equal(chart.element, c.element);
    assert.equal(chart.propsType, c.propsType);
    assert.ok(chart.props.length > 5, `${c.key} too few props`);
    for (const p of chart.props) {
      assert.ok(p.name && typeof p.type === "string", `${c.key}.${p.name} bad shape`);
      assert.equal(typeof p.optional, "boolean");
      assert.equal(typeof p.common, "boolean");
    }
  }
});

test("shared props are extracted once and flagged common per chart", () => {
  const names = data.shared.map((p) => p.name);
  for (const s of SHARED) assert.ok(names.includes(s), `shared missing ${s}`);
  // renderer is shared in every chart
  for (const c of CHARTS) {
    const r = prop(c.key, "renderer");
    assert.ok(r, `${c.key} missing renderer`);
    assert.equal(r.common, true);
  }
});

test("required data prop is detected (not optional)", () => {
  const ds = prop("line-chart", "dataSet");
  assert.equal(ds.optional, false);
  assert.equal(ds.type, "LineDataItem[]");
  // series/keys charts use `series`/`keys`
  assert.equal(prop("area-chart", "series").optional, false);
  assert.equal(prop("radar-chart", "axes").optional, false);
});

test("defaults are read from the engine resolve()/DEFAULT_MARGIN", () => {
  assert.equal(prop("line-chart", "renderer").default, '"svg"');
  assert.equal(prop("scatter-chart", "sizeRange").default, "[4, 20]");
  assert.equal(prop("radar-chart", "rings").default, "4");
  assert.equal(prop("radar-chart", "fillOpacity").default, "0.2");
  assert.match(prop("line-chart", "margin").default, /top: 50/);
});

test("named unions are expanded for display", () => {
  assert.equal(
    prop("line-chart", "xAxisDataType").type,
    '"date_annual" | "date_monthly" | "number"',
  );
});

test("JSDoc descriptions are captured when present", () => {
  // LineChartProps.curve has a doc comment in types.ts
  assert.match(prop("line-chart", "curve").description, /interpolation/i);
});

test("per-chart distinctive props are present", () => {
  assert.ok(prop("vertical-stack-bar-chart", "keysOrder"));
  assert.ok(prop("comparable-horizontal-bar-chart", "valueBasedOpacity"));
  assert.ok(prop("ribbon-chart", "columnWidth"));
  assert.ok(prop("gap-chart", "colorMode"));
});

test("varying-signature callbacks are NOT marked common", () => {
  assert.equal(prop("gap-chart", "tooltipFormatter").common, false);
  assert.equal(prop("line-chart", "tooltipFormatter").common, false);
});
