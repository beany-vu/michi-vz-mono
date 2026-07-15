// Guards framework-wrapper prop parity: every prop the core `<Name>Props` type
// exposes must be forwarded by the WC Lit element (its `chartProps` getter), the
// Angular applicator (`apply<Name>ChartProps`), AND the React component. Vue/
// Svelte pass the whole props object through, so they're parity-complete by
// construction and need no check. This is the regression guard for "a wrapper
// silently dropped a new prop".
// Run: `pnpm --filter docs test` (node --test).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { extract, CHARTS } from "./extract-props.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../../..");
const ANGULAR = readFileSync(resolve(REPO, "packages/angular/src/index.ts"), "utf8");
const REACT = readFileSync(resolve(REPO, "packages/react/src/index.tsx"), "utf8");
const data = extract();

// Props the wrappers intentionally do NOT forward as plain data props:
//  - on* callbacks      → WC dispatches them as DOM CustomEvents; Angular consumers
//                         subscribe to those events rather than passing functions.
//  - suppressDefaultOverlay → internal flag the React wrapper sets when it renders a
//                         custom overlay node; the other wrappers want the default overlay.
const isExcluded = (name) => /^on[A-Z]/.test(name) || name === "suppressDefaultOverlay";

const coreProps = (key) => data.charts[key].props.map((p) => p.name).filter((n) => !isExcluded(n));

// WC: the keys of the `get chartProps()` return object are the engine prop names it forwards.
function wcForwarded(wcFile) {
  const text = readFileSync(resolve(REPO, "packages/wc/src", wcFile), "utf8");
  const m = text.match(/get chartProps\(\)[^{]*\{[\s\S]*?return\s*\{([\s\S]*?)\n {4}\};/);
  if (!m) return null;
  return new Set([...m[1].matchAll(/^\s*([a-zA-Z0-9_]+)\s*:/gm)].map((x) => x[1]));
}

// Angular: `props.X` references inside the applicator whose signature names this propsType.
function angularForwarded(propsType) {
  // Tolerate a trailing comma before ")": Prettier adds one when it wraps a long
  // applicator signature across multiple lines (trailingComma: "all").
  const re = new RegExp(
    `function\\s+apply\\w+\\(\\s*el:[^,]+,\\s*props:\\s*${propsType}\\s*,?\\s*\\)[^{]*\\{([\\s\\S]*?)\\n\\}`,
  );
  const m = ANGULAR.match(re);
  if (!m) return null;
  return new Set([...m[1].matchAll(/props\.([a-zA-Z0-9_]+)/g)].map((x) => x[1]));
}

// React: unlike WC/Angular (which enumerate an explicit forwarding object), every
// React chart component in packages/react/src/index.tsx forwards props via a rest
// spread - either the WHOLE `props` object untouched (no destructuring at all:
// DualHorizontalBarChart, RangeChart, RibbonChart, PieChart, BubbleChart,
// FountainChart), or `const { <a few names>, ...coreProps } = props;` followed by
// `...coreProps` (or `...resolveEffectiveProps(coreProps, shared)`, a pure
// superset merge - see effectiveProps.ts) spread into the engine props object.
// Because a rest spread carries every key NOT explicitly named on its left-hand
// side, the only way a real core prop can be dropped is if it's named directly in
// that destructure and never re-added under its own key afterward. This is why a
// naive text search for a prop's name in the BUILT react dist can read as "zero
// mentions" even when the prop is perfectly forwarded (rest spreads don't emit the
// literal identifier) - don't use that as a signal; this static check (and the
// runtime mount in the pointLabels/drawOrder/tileValueLabels core tests) does.
//
// Exclusions beyond the shared `isExcluded` list:
//  - isLoadingComponent / isNodataComponent / children → react-only additions on
//    the `<Name>ReactProps` type, never present on the core `<Name>Props` type
//    `extract-props.mjs` reads from, so destructuring them out is never a "drop".
const REACT_ONLY_KEYS = new Set(["isLoadingComponent", "isNodataComponent", "children"]);

function reactComponentBody(reactName) {
  const start = REACT.indexOf(`function ${reactName}(props, ref) {`);
  if (start === -1) return null;
  const nextExport = REACT.indexOf("\nexport ", start);
  return REACT.slice(start, nextExport === -1 ? REACT.length : nextExport);
}

// Returns the list of core props this React component drops (empty when clean).
function reactMissing(chartKey, reactName) {
  const all = coreProps(chartKey);
  const body = reactComponentBody(reactName);
  if (body === null) return all; // component not found - can't prove anything is forwarded

  const destructureMatch = body.match(/const\s*\{([^}]*)\}\s*=\s*props;/);
  if (!destructureMatch) return []; // no destructuring: `props` passed straight through

  const rawNames = destructureMatch[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !s.startsWith("...")); // the rest element itself, handled below

  // A rename-on-destructure (`{ foo: bar, ...coreProps }`) would silently defeat
  // this check (the raw token is "foo: bar", which never matches a plain prop
  // name) - fail loudly instead of quietly missing a potential drop.
  const renamed = rawNames.filter((s) => s.includes(":"));
  if (renamed.length) {
    throw new Error(
      `${reactName}: destructuring rename(s) [${renamed.join(", ")}] aren't understood by ` +
        `this static check - update reactMissing() (wrapper-parity.test.mjs) to handle them`,
    );
  }
  const named = rawNames;

  // The rest element MUST be spread back into the engine props somewhere, or every
  // prop not explicitly re-added below would be silently dropped.
  const restSpread = /\.\.\.(coreProps|resolveEffectiveProps\(coreProps)/.test(body);
  if (!restSpread) return all;

  const afterDestructure = body.slice(
    body.indexOf(destructureMatch[0]) + destructureMatch[0].length,
  );
  const atRisk = named.filter((n) => all.includes(n) && !REACT_ONLY_KEYS.has(n));
  return atRisk.filter((n) => !new RegExp(`\\b${n}\\s*:`).test(afterDestructure));
}

for (const c of CHARTS) {
  test(`WC ${c.key} forwards every core ${c.propsType} prop`, () => {
    const fwd = wcForwarded(c.wc);
    assert.ok(fwd, `chartProps getter not found in ${c.wc}`);
    const missing = coreProps(c.key).filter((n) => !fwd.has(n));
    assert.deepEqual(
      missing,
      [],
      `${c.key} WC chartProps getter is missing: ${missing.join(", ")}`,
    );
  });

  test(`Angular ${c.key} forwards every core ${c.propsType} prop`, () => {
    const fwd = angularForwarded(c.propsType);
    assert.ok(fwd, `apply*Props for ${c.propsType} not found`);
    const missing = coreProps(c.key).filter((n) => !fwd.has(n));
    assert.deepEqual(missing, [], `${c.key} Angular applicator is missing: ${missing.join(", ")}`);
  });

  test(`React ${c.key} forwards every core ${c.propsType} prop`, () => {
    const reactName = c.mount.replace(/^mount/, "");
    const missing = reactMissing(c.key, reactName);
    assert.deepEqual(
      missing,
      [],
      `${c.key} React component (${reactName}) is missing: ${missing.join(", ")}`,
    );
  });
}
