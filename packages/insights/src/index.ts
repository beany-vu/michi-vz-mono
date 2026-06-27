// @michi-vz/insights — opt-in, client-side AI/predictive layer over @michi-vz/core.
// Each capability is also its own tree-shakeable sub-path ("@michi-vz/insights/forecast",
// "/anomaly", "/validate", "/agent", "/mcp"); this root re-exports the lightweight,
// model-free pieces for convenience. The Node MCP server stays at "/mcp" only.
export const version = "0.1.0";

// ---- Forecasting + simulation ----
export {
  forecast,
  forecastFan,
  forecastFanBands,
  computeForecast,
  linearFit,
  linearForecast,
  holtForecast,
  decompose,
  detectPeriod,
  detectChangepoints,
  monteCarloForecast,
  requiredGrowth,
  requiredRunRate,
  pacingToGoal,
  type ForecastPluginOptions,
  type ScenarioSpec,
  type ThresholdSpec,
  type ThresholdBreach,
  type ForecastMethod,
  type ForecastOptions,
  type ForecastResult,
  type ForecastBand,
  type Accuracy,
  type Decomposition,
  type Changepoint,
  type ChangepointOptions,
  type MonteCarloResult,
  type MonteCarloOptions,
  type Pacing,
} from "./forecast";

// ---- Anomaly detection ----
export {
  anomaly,
  detectAnomalies,
  type AnomalyMethod,
  type AnomalyPoint,
  type AnomalyResult,
  type AnomalyOptions,
  type AnomalyPluginOptions,
} from "./anomaly";

// ---- Validation ----
export {
  validate,
  validateSeries,
  invalidPoints,
  type InvalidPoint,
  type ValidatePluginOptions,
} from "./validate";

// ---- Narration (rules baseline + i18n/custom; opt-in SLM/remote) ----
export {
  narrate,
  narrateRules,
  explainChart,
  SLM_PRESETS,
  type NarrateBackend,
  type NarrateOptions,
  type NarrateStrings,
  type NarratePluginOptions,
} from "./narrate";

// ---- Embeddings (hash fallback; opt-in BERT/MiniLM) ----
export {
  createEmbedder,
  findSimilar,
  cosineSimilarity,
  hashEmbed,
  type Embedder,
  type EmbedBackend,
  type EmbedOptions,
  type SimilarItem,
} from "./embeddings";

// ---- SQL / data wrangling (pure aggregate; opt-in DuckDB-Wasm) ----
export { aggregate, createSqlEngine, type Row, type MeasureFn, type AggregateSpec, type SqlEngine } from "./sql";

// ---- Sonification (accessibility: hear the trend) ----
export { sonify, valuesToTones, type Tone, type SonifyOptions } from "./sonify";

// ---- Agent (tool registry + in-page agent) ----
export {
  createAgent,
  createAgentRegistry,
  chartHandle,
  type AgentRegistry,
  type ChartHandle,
  type MichiVzAgent,
  type CreateAgentConfig,
  type LlmCaller,
  type LlmInput,
  type LlmResult,
  type LlmToolCall,
  type AgentRun,
} from "./agent";
