// Model provenance + source configuration for every AI backend in @michi-vz/insights.
// Two jobs:
//  1. TRANSPARENCY - describeModelSource() states exactly what a backend downloads
//     and from where, so a consumer can show it to their users BEFORE any bytes move.
//  2. CONTROL - applyModelSource() redirects Transformers.js to a mirror, a
//     self-hosted directory, or forbids remote downloads entirely (offline/intranet).
// Defaults are the upstream libraries' defaults, stated explicitly instead of implied:
// Transformers.js fetches from https://huggingface.co; WebLLM fetches the weights
// listed in its prebuilt appConfig (Hugging Face-hosted); backend:"remote" downloads
// nothing (prompts go to YOUR endpoint); rules/hash run offline with no model at all.

/** Where Transformers.js downloads model files from by default. */
export const DEFAULT_MODEL_HOST = "https://huggingface.co";

export interface ModelSource {
  /** Download host for Transformers.js model files. Default: https://huggingface.co. Point at a mirror or your own server. */
  remoteHost?: string;
  /** Path template under the host; Transformers.js default: "{model}/resolve/{revision}/". */
  remotePathTemplate?: string;
  /** Serve model files from your own origin (e.g. "/models/"); implies allowLocalModels. */
  localModelPath?: string;
  /** Set false to forbid ANY remote download - only localModelPath is used (offline/intranet). */
  allowRemoteModels?: boolean;
}

export interface ModelSourceInfo {
  /** The backend the description is for. */
  backend: string;
  /** Model id, when the backend loads one. */
  model?: string;
  /** Human-readable host ("https://huggingface.co", "(self-hosted)", "(none)"). */
  host: string;
  /** The concrete URL/path model files come from, when downloads happen. */
  url?: string;
  /** Whether using this backend downloads model files at all. */
  downloads: boolean;
  /** Plain-language note to surface to users (source, caching, how to change it). */
  note: string;
}

/**
 * Describe what `backend` will download and from where - BEFORE loading anything.
 * Surface this to your users (a tooltip, a consent dialog, docs) so model downloads
 * are never a surprise.
 */
export function describeModelSource(
  backend: string,
  model: string | undefined,
  source: ModelSource = {},
): ModelSourceInfo {
  if (backend === "transformers") {
    if (source.allowRemoteModels === false) {
      return {
        backend,
        model,
        host: "(self-hosted)",
        url: source.localModelPath
          ? `${source.localModelPath.replace(/\/$/, "")}/${model ?? ""}`
          : undefined,
        downloads: true,
        note: "Model files are served from your own origin (localModelPath); no remote download happens. Files are cached by the browser after first load.",
      };
    }
    const host = source.remoteHost ?? DEFAULT_MODEL_HOST;
    const template = source.remotePathTemplate ?? "{model}/resolve/{revision}/";
    const path = template.replace("{model}", model ?? "").replace("{revision}", "main");
    return {
      backend,
      model,
      host,
      url: `${host.replace(/\/$/, "")}/${path}`,
      downloads: true,
      note: `Transformers.js downloads the model files from ${host} on first use and caches them in the browser (Cache API), so later loads are local. Pass modelSource.remoteHost for a mirror, or localModelPath + allowRemoteModels:false to self-host offline.`,
    };
  }
  if (backend === "webllm") {
    return {
      backend,
      model,
      host: "WebLLM prebuilt registry (Hugging Face-hosted)",
      downloads: true,
      note: "WebLLM downloads the weights listed in its prebuilt model registry (Hugging Face-hosted) on first use and caches them in the browser. To self-host, pass a custom appConfig (model_url + model_lib_url) via narrate's webllmAppConfig option.",
    };
  }
  if (backend === "remote") {
    return {
      backend,
      host: "(none)",
      downloads: false,
      note: "Nothing is downloaded: prompts are sent to YOUR endpoint (the caller option), e.g. a local Ollama/llama.cpp server or your API. Privacy note: chart data leaves the page to that endpoint.",
    };
  }
  // rules / hash / anything model-free
  return {
    backend,
    host: "(none)",
    downloads: false,
    note: "No model is used - this backend is deterministic and fully offline.",
  };
}

interface TransformersEnvModule {
  env?: {
    remoteHost?: string;
    remotePathTemplate?: string;
    allowRemoteModels?: boolean;
    allowLocalModels?: boolean;
    localModelPath?: string;
  };
}

/**
 * Apply a ModelSource to a loaded Transformers.js module (its global `env`).
 * Safe no-op when the module has no env or the source is empty.
 */
export function applyModelSource(mod: unknown, source: ModelSource | undefined): void {
  const env = (mod as TransformersEnvModule | null)?.env;
  if (!env || !source) return;
  if (source.remoteHost !== undefined) env.remoteHost = source.remoteHost;
  if (source.remotePathTemplate !== undefined) env.remotePathTemplate = source.remotePathTemplate;
  if (source.localModelPath !== undefined) {
    env.localModelPath = source.localModelPath;
    env.allowLocalModels = true;
  }
  if (source.allowRemoteModels !== undefined) env.allowRemoteModels = source.allowRemoteModels;
}
