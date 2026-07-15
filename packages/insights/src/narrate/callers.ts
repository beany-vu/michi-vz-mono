// Ready-made callers for backend:"remote" - hook narration to YOUR local AI in one
// line instead of hand-writing fetch plumbing. Nothing is downloaded by these:
// prompts are sent to the endpoint you name, and only there. Both throw on failure
// so explainChart falls back to the deterministic rule-based text.
//
//   explainChart(ctx, { backend: "remote", caller: ollamaCaller({ model: "llama3.2" }) });
//   explainChart(ctx, { backend: "remote", caller: openaiCompatCaller({ url: "http://localhost:1234", model: "qwen2.5" }) });
//
// openaiCompatCaller speaks the OpenAI chat-completions shape, which is what
// LM Studio, llama.cpp server, vLLM, LocalAI and most hosted providers expose.

export interface OllamaCallerOptions {
  /** Ollama model name, e.g. "llama3.2", "qwen2.5", "mistral". */
  model: string;
  /** Ollama server (default the local daemon: http://localhost:11434). */
  url?: string;
}

/** Caller for a local Ollama daemon (native /api/generate endpoint). */
export function ollamaCaller(options: OllamaCallerOptions): (prompt: string) => Promise<string> {
  const base = (options.url ?? "http://localhost:11434").replace(/\/$/, "");
  return async (prompt: string): Promise<string> => {
    const res = await fetch(`${base}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: options.model, prompt, stream: false }),
    });
    if (!res.ok) throw new Error(`Ollama responded ${res.status}`);
    const json = (await res.json()) as { response?: string };
    return json.response ?? "";
  };
}

export interface OpenAICompatCallerOptions {
  /** Server base URL, e.g. http://localhost:1234 (LM Studio) or http://localhost:8080 (llama.cpp). */
  url: string;
  /** Model id as the server knows it. */
  model: string;
  /** Optional bearer token (hosted providers; local servers usually need none). */
  apiKey?: string;
  /** Extra headers, if your gateway needs them. */
  headers?: Record<string, string>;
}

/** Caller for any OpenAI-compatible /v1/chat/completions server (LM Studio, llama.cpp, vLLM, LocalAI, hosted APIs). */
export function openaiCompatCaller(
  options: OpenAICompatCallerOptions,
): (prompt: string) => Promise<string> {
  const base = options.url.replace(/\/$/, "");
  return async (prompt: string): Promise<string> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    if (options.apiKey) headers.Authorization = `Bearer ${options.apiKey}`;
    const res = await fetch(`${base}/v1/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({ model: options.model, messages: [{ role: "user", content: prompt }] }),
    });
    if (!res.ok) throw new Error(`Chat completions endpoint responded ${res.status}`);
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return json.choices?.[0]?.message?.content ?? "";
  };
}
