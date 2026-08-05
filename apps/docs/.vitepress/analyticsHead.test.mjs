// Guards the GA4 / Search Console head injection (analyticsHead.mjs):
// unset env emits nothing, set env emits the exact tags, the build-time
// status log is loud on missing values and never leaks a full secret.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildGaHead,
  buildGscHead,
  buildAnalyticsHead,
  logAnalyticsStatus,
} from "./analyticsHead.mjs";

test("buildGaHead: empty when GA_MEASUREMENT_ID is unset or blank", () => {
  assert.deepEqual(buildGaHead({}), []);
  assert.deepEqual(buildGaHead({ GA_MEASUREMENT_ID: "" }), []);
});

test("buildGaHead: emits the gtag loader and config script with the id interpolated", () => {
  const head = buildGaHead({ GA_MEASUREMENT_ID: "G-TEST123" });
  assert.equal(head.length, 2);
  const [loader, inline] = head;
  assert.equal(loader[0], "script");
  assert.equal(loader[1].async, "");
  assert.equal(loader[1].src, "https://www.googletagmanager.com/gtag/js?id=G-TEST123");
  assert.equal(inline[0], "script");
  assert.deepEqual(inline[1], {});
  assert.ok(inline[2].includes("window.dataLayer = window.dataLayer || [];"));
  assert.ok(inline[2].includes("gtag('config', 'G-TEST123');"));
});

test("buildGscHead: empty when unset; meta tag carries the token when set", () => {
  assert.deepEqual(buildGscHead({}), []);
  assert.deepEqual(buildGscHead({ GOOGLE_SITE_VERIFICATION: "" }), []);
  assert.deepEqual(buildGscHead({ GOOGLE_SITE_VERIFICATION: "tok123" }), [
    ["meta", { name: "google-site-verification", content: "tok123" }],
  ]);
});

test("buildAnalyticsHead: GSC meta precedes GA scripts; empty when both unset", () => {
  assert.deepEqual(buildAnalyticsHead({}), []);
  const head = buildAnalyticsHead({
    GA_MEASUREMENT_ID: "G-TEST123",
    GOOGLE_SITE_VERIFICATION: "tok123",
  });
  assert.deepEqual(
    head.map((entry) => entry[0]),
    ["meta", "script", "script"],
  );
});

test("logAnalyticsStatus: warns for each missing var, logs nothing else", () => {
  const warned = [];
  const logged = [];
  logAnalyticsStatus({}, { warn: (m) => warned.push(m), log: (m) => logged.push(m) });
  assert.equal(warned.length, 2);
  assert.ok(warned.some((m) => m.includes("GA_MEASUREMENT_ID not set")));
  assert.ok(warned.some((m) => m.includes("GOOGLE_SITE_VERIFICATION not set")));
  assert.deepEqual(logged, []);
});

test("logAnalyticsStatus: logs redacted values when set, never the full secret", () => {
  const warned = [];
  const logged = [];
  logAnalyticsStatus(
    { GA_MEASUREMENT_ID: "G-ABCDEFGHIJ", GOOGLE_SITE_VERIFICATION: "verylongtoken123" },
    { warn: (m) => warned.push(m), log: (m) => logged.push(m) },
  );
  assert.deepEqual(warned, []);
  assert.equal(logged.length, 2);
  const all = logged.join("\n");
  assert.ok(all.includes("G-ABCD"), "shows a recognizable prefix");
  assert.ok(!all.includes("G-ABCDEFGHIJ"), "never logs the full GA id");
  assert.ok(!all.includes("verylongtoken123"), "never logs the full GSC token");
});

test("copy rules: no en/em dashes, no first-person plural in emitted output", () => {
  const head = buildAnalyticsHead({
    GA_MEASUREMENT_ID: "G-X",
    GOOGLE_SITE_VERIFICATION: "Y",
  });
  const logged = [];
  logAnalyticsStatus(
    { GA_MEASUREMENT_ID: "G-X" },
    { warn: (m) => logged.push(m), log: (m) => logged.push(m) },
  );
  const text = JSON.stringify(head) + logged.join("\n");
  assert.ok(!/[–—]/.test(text), "contains an en/em dash");
  assert.equal(text.match(/\b(we|our)\b/i), null, "contains first-person plural");
});
