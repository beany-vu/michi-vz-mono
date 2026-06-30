// Guards framework-wrapper prop parity: every prop the core `<Name>Props` type
// exposes must be forwarded by BOTH the WC Lit element (its `chartProps` getter)
// and the Angular applicator (`apply<Name>ChartProps`). Vue/Svelte pass the whole
// props object through, so they're parity-complete by construction and need no
// check. This is the regression guard for "a wrapper silently dropped a new prop".
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
  const re = new RegExp(`function\\s+apply\\w+\\(\\s*el:[^,]+,\\s*props:\\s*${propsType}\\s*\\)[^{]*\\{([\\s\\S]*?)\\n\\}`);
  const m = ANGULAR.match(re);
  if (!m) return null;
  return new Set([...m[1].matchAll(/props\.([a-zA-Z0-9_]+)/g)].map((x) => x[1]));
}

for (const c of CHARTS) {
  test(`WC ${c.key} forwards every core ${c.propsType} prop`, () => {
    const fwd = wcForwarded(c.wc);
    assert.ok(fwd, `chartProps getter not found in ${c.wc}`);
    const missing = coreProps(c.key).filter((n) => !fwd.has(n));
    assert.deepEqual(missing, [], `${c.key} WC chartProps getter is missing: ${missing.join(", ")}`);
  });

  test(`Angular ${c.key} forwards every core ${c.propsType} prop`, () => {
    const fwd = angularForwarded(c.propsType);
    assert.ok(fwd, `apply*Props for ${c.propsType} not found`);
    const missing = coreProps(c.key).filter((n) => !fwd.has(n));
    assert.deepEqual(missing, [], `${c.key} Angular applicator is missing: ${missing.join(", ")}`);
  });
}
