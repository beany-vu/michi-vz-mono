// Narration — "explain this chart" in prose. The baseline is RULE-BASED and
// deterministic (no model, works offline); it can be upgraded by an opt-in local
// SLM (Transformers.js / WebLLM, lazy-imported) or a bring-your-own remote caller.
// Every path falls back to the rule-based text, so narration never hard-fails.
import type { ChartContext, LineChartContext, MichiVzPlugin } from "@michi-vz/core";
import { optionalImport } from "../internal/lazyImport";

export type NarrateBackend = "rules" | "transformers" | "webllm" | "remote";

/**
 * Localizable phrase builders for the rule-based narration (i18n). Override any
 * subset to translate or reword; `dir` is the localized direction word and `pct` is
 * the already-formatted percent suffix (e.g. " (+5%)") or "".
 */
export interface NarrateStrings {
  topMover?: (label: string, dir: "rose" | "fell" | "flat", pct: string) => string;
  trendSplit?: (up: number, down: number) => string;
  largestTotal?: (label: string, total: number) => string;
}

const DEFAULT_STRINGS: Required<NarrateStrings> = {
  topMover: (label, dir, pct) =>
    `${label} ${dir === "rose" ? "rose" : dir === "fell" ? "fell" : "was flat"} the most${pct}.`,
  trendSplit: (up, down) => `${up} series trended up and ${down} down.`,
  largestTotal: (label, total) => `${label} has the largest total (${total}).`,
};

export interface NarrateOptions {
  backend?: NarrateBackend;
  /** backend:"remote" — your model caller (prompt -> text). Privacy: data leaves the client. */
  caller?: (prompt: string) => Promise<string>;
  /** model id for transformers/webllm (default a small instruct model; see SLM presets). */
  model?: string;
  /** i18n: override the rule-based phrase builders (used by the rules path + fallback). */
  strings?: NarrateStrings;
  /** full custom narrator — replaces the rule-based text entirely (any language/wording). */
  render?: (ctx: ChartContext) => string;
  /** model-load progress (wired to Transformers.js / WebLLM) so you can show a loader. */
  onProgress?: (info: { status?: string; progress?: number; file?: string }) => void;
}

/** Options for the narrate() plugin (the synchronous, rule-based path). */
export interface NarratePluginOptions {
  strings?: NarrateStrings;
  render?: (ctx: ChartContext) => string;
}

const round = (n: number): number => Math.round(n * 100) / 100;

/**
 * Deterministic, model-free narration from the structured ChartContext. Pass
 * `strings` to localize/reword the built-in fragments (i18n).
 */
export function narrateRules(ctx: ChartContext, strings?: NarrateStrings): string {
  const s = { ...DEFAULT_STRINGS, ...strings };
  const sentences: string[] = [ctx.summary];

  if (ctx.chartType === "line-chart" || ctx.chartType === "fan-chart") {
    const series = (ctx as LineChartContext).series ?? [];
    const movers = series
      .filter((m) => typeof m.change === "number")
      .slice()
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    if (movers.length > 0) {
      const top = movers[0];
      const dir = top.change > 0 ? "rose" : top.change < 0 ? "fell" : "flat";
      const pct = top.changePct != null ? ` (${top.changePct > 0 ? "+" : ""}${round(top.changePct)}%)` : "";
      sentences.push(s.topMover(top.label, dir, pct));
      const up = series.filter((m) => m.trend === "up").length;
      const down = series.filter((m) => m.trend === "down").length;
      if (series.length > 1) sentences.push(s.trendSplit(up, down));
    }
  } else {
    const series = (ctx as { series?: Array<{ label?: string; key?: string; total?: number }> }).series;
    if (Array.isArray(series) && series.length > 0 && typeof series[0]?.total === "number") {
      const top = series.slice().sort((a, b) => (b.total ?? 0) - (a.total ?? 0))[0];
      sentences.push(s.largestTotal(top.label ?? top.key ?? "", round(top.total ?? 0)));
    }
  }

  return sentences.join(" ");
}

function prompt(ctx: ChartContext): string {
  return (
    `Explain this ${ctx.chartType} for a business reader in 2-3 sentences. ` +
    `Data: ${JSON.stringify({ summary: ctx.summary, a11yTable: ctx.a11yTable })}`
  );
}

/** The rule-based fallback, honouring a custom render / i18n strings. */
function ruleText(ctx: ChartContext, options: NarrateOptions): string {
  return options.render ? options.render(ctx) : narrateRules(ctx, options.strings);
}

/** Recommended in-browser SLMs (small, MIT/permissive). We PREFER a small local model. */
export const SLM_PRESETS = {
  transformers: { phi3: "Xenova/Phi-3-mini-4k-instruct", gemma: "onnx-community/gemma-2-2b-it" },
  webllm: { phi3: "Phi-3-mini-4k-instruct-q4f16_1-MLC", gemma: "gemma-2-2b-it-q4f16_1-MLC" },
} as const;

/**
 * Narrate a chart. Async because model backends are lazy-loaded. Any backend
 * failure (model can't load, remote rejects) falls back to the rule-based text
 * (which honours `render` / `strings`). Prefer a small local model (SLM).
 */
export async function explainChart(ctx: ChartContext, options: NarrateOptions = {}): Promise<string> {
  const backend = options.backend ?? "rules";
  if (backend === "rules") return ruleText(ctx, options);

  try {
    if (backend === "remote") {
      if (!options.caller) return ruleText(ctx, options);
      const out = await options.caller(prompt(ctx));
      return out?.trim() || ruleText(ctx, options);
    }
    if (backend === "transformers") {
      // lazy, optional dep — never bundled unless this path runs
      const mod = await optionalImport<{ pipeline?: (task: string, model?: string, opts?: { progress_callback?: unknown }) => Promise<(text: string) => Promise<unknown>> }>(
        "@huggingface/transformers"
      );
      const pipeline = mod?.pipeline;
      if (!pipeline) return ruleText(ctx, options);
      const gen = await pipeline("text-generation", options.model ?? SLM_PRESETS.transformers.phi3, {
        progress_callback: options.onProgress,
      });
      const res = (await gen(prompt(ctx))) as Array<{ generated_text?: string }> | { generated_text?: string };
      const text = Array.isArray(res) ? res[0]?.generated_text : res?.generated_text;
      return text?.trim() || ruleText(ctx, options);
    }
    if (backend === "webllm") {
      const mod = await optionalImport<{ CreateMLCEngine?: (model: string, opts?: { initProgressCallback?: unknown }) => Promise<{ chat: { completions: { create: (o: unknown) => Promise<{ choices: Array<{ message: { content?: string } }> }> } } }> }>(
        "@mlc-ai/web-llm"
      );
      const create = mod?.CreateMLCEngine;
      if (!create) return ruleText(ctx, options);
      const engine = await create(options.model ?? SLM_PRESETS.webllm.phi3, { initProgressCallback: options.onProgress });
      const res = await engine.chat.completions.create({ messages: [{ role: "user", content: prompt(ctx) }] });
      return res.choices[0]?.message?.content?.trim() || ruleText(ctx, options);
    }
  } catch {
    return ruleText(ctx, options);
  }
  return ruleText(ctx, options);
}

/**
 * The `narrate()` plugin — synchronously upgrades the chart's `summary` to richer
 * prose (which flows to the a11y mirror + dataprocessed event). Default is the
 * rule-based narration; pass `strings` to localize it (i18n) or `render` for a fully
 * custom narrator. For model-backed prose, call `explainChart(getContext())` on demand.
 */
export function narrate(options: NarratePluginOptions = {}): MichiVzPlugin<unknown> {
  return {
    name: "narrate",
    enrichContext(ctx) {
      const text = options.render ? options.render(ctx) : narrateRules(ctx, options.strings);
      return { ...ctx, summary: text };
    },
  };
}
