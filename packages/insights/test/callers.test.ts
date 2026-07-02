import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ollamaCaller, openaiCompatCaller } from "../src/narrate/callers";

const realFetch = globalThis.fetch;

function mockFetch(response: unknown, capture: { url?: string; init?: RequestInit }) {
  globalThis.fetch = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    capture.url = String(url);
    capture.init = init;
    return {
      ok: true,
      json: async () => response,
    } as Response;
  }) as typeof fetch;
}

beforeEach(() => {
  vi.restoreAllMocks();
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("ollamaCaller", () => {
  it("POSTs to the local Ollama generate endpoint and returns the response text", async () => {
    const cap: { url?: string; init?: RequestInit } = {};
    mockFetch({ response: "The chart trends up." }, cap);
    const caller = ollamaCaller({ model: "llama3.2" });
    const out = await caller("explain this chart");
    expect(out).toBe("The chart trends up.");
    expect(cap.url).toBe("http://localhost:11434/api/generate");
    const body = JSON.parse(String(cap.init?.body));
    expect(body.model).toBe("llama3.2");
    expect(body.prompt).toBe("explain this chart");
    expect(body.stream).toBe(false);
  });

  it("honours a custom url", async () => {
    const cap: { url?: string; init?: RequestInit } = {};
    mockFetch({ response: "ok" }, cap);
    await ollamaCaller({ model: "m", url: "http://192.168.1.10:11434" })("p");
    expect(cap.url).toBe("http://192.168.1.10:11434/api/generate");
  });

  it("throws on a non-ok response (so explainChart falls back to rules)", async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: false, status: 500 }) as Response) as typeof fetch;
    await expect(ollamaCaller({ model: "m" })("p")).rejects.toThrow();
  });
});

describe("openaiCompatCaller", () => {
  it("POSTs an OpenAI-style chat completion and returns the message content", async () => {
    const cap: { url?: string; init?: RequestInit } = {};
    mockFetch({ choices: [{ message: { content: "Revenue rose." } }] }, cap);
    const caller = openaiCompatCaller({ url: "http://localhost:1234", model: "qwen2.5" });
    const out = await caller("explain");
    expect(out).toBe("Revenue rose.");
    expect(cap.url).toBe("http://localhost:1234/v1/chat/completions");
    const body = JSON.parse(String(cap.init?.body));
    expect(body.model).toBe("qwen2.5");
    expect(body.messages).toEqual([{ role: "user", content: "explain" }]);
    // no Authorization header unless an apiKey is given
    expect((cap.init?.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("sends the Authorization header when an apiKey is given and strips a trailing slash", async () => {
    const cap: { url?: string; init?: RequestInit } = {};
    mockFetch({ choices: [{ message: { content: "x" } }] }, cap);
    await openaiCompatCaller({ url: "http://localhost:8080/", model: "m", apiKey: "sk-test" })("p");
    expect(cap.url).toBe("http://localhost:8080/v1/chat/completions");
    expect((cap.init?.headers as Record<string, string>).Authorization).toBe("Bearer sk-test");
  });
});
