// Pure head-config builders for Google Analytics (GA4) and Google Search
// Console verification, plus the build-time status log that makes a missing
// env var loud instead of a silent drop (the docs shipped without GA for a
// month because nothing flagged it). Plain .mjs, not .ts: the unit tests run
// under node's built-in test runner and CI is Node 20, which cannot execute
// TypeScript directly.

export function buildGscHead(env) {
  const token = env.GOOGLE_SITE_VERIFICATION;
  if (!token) return [];
  return [["meta", { name: "google-site-verification", content: token }]];
}

export function buildGaHead(env) {
  const id = env.GA_MEASUREMENT_ID;
  if (!id) return [];
  return [
    ["script", { async: "", src: `https://www.googletagmanager.com/gtag/js?id=${id}` }],
    [
      "script",
      {},
      `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');`,
    ],
  ];
}

// Order matches the original config.ts wiring: GSC meta before the GA scripts.
export function buildAnalyticsHead(env) {
  return [...buildGscHead(env), ...buildGaHead(env)];
}

function redact(value, keep = 6) {
  return value.length <= keep ? value : `${value.slice(0, keep)}...`;
}

export function logAnalyticsStatus(env, logger = console) {
  if (env.GA_MEASUREMENT_ID) {
    logger.log(
      `[docs] GA_MEASUREMENT_ID set (${redact(env.GA_MEASUREMENT_ID)}) - Google Analytics will be embedded`,
    );
  } else {
    logger.warn("[docs] GA_MEASUREMENT_ID not set - Google Analytics will NOT be embedded");
  }
  if (env.GOOGLE_SITE_VERIFICATION) {
    logger.log(
      `[docs] GOOGLE_SITE_VERIFICATION set (${redact(env.GOOGLE_SITE_VERIFICATION)}) - Search Console meta will be embedded`,
    );
  } else {
    logger.warn(
      "[docs] GOOGLE_SITE_VERIFICATION not set - Search Console meta will NOT be embedded",
    );
  }
}
