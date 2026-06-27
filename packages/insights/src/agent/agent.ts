// In-page agent — a tiny tool-calling loop over the registry, with a BYO LLM caller
// (privacy: no required backend; the consumer supplies the model, e.g. a Claude call).
// The loop is deterministic given a deterministic caller, so it is testable with a mock.
import type { AgentTool } from "@michi-vz/core";
import { createAgentRegistry, type AgentRegistry, type ChartHandle } from "./registry";

export interface LlmToolCall {
  tool: string;
  args?: Record<string, unknown>;
}

export interface LlmResult {
  /** assistant text (the final answer), if any. */
  text?: string;
  /** tool calls to execute this turn; when empty/absent the loop stops. */
  toolCalls?: LlmToolCall[];
}

export interface LlmInput {
  prompt: string;
  tools: AgentTool[];
  history: Array<{ role: "tool" | "assistant"; content: string }>;
}

export type LlmCaller = (input: LlmInput) => Promise<LlmResult> | LlmResult;

export interface AgentRun {
  text: string;
  calls: Array<{ tool: string; args: Record<string, unknown>; result: unknown }>;
}

export interface MichiVzAgent {
  registry: AgentRegistry;
  ask(prompt: string): Promise<AgentRun>;
}

export interface CreateAgentConfig {
  charts?: ChartHandle[];
  registry?: AgentRegistry;
  llm: LlmCaller;
  /** safety cap on tool-calling rounds (default 6). */
  maxSteps?: number;
}

export function createAgent(config: CreateAgentConfig): MichiVzAgent {
  const registry = config.registry ?? createAgentRegistry();
  for (const h of config.charts ?? []) registry.register(h);
  const maxSteps = config.maxSteps ?? 6;

  return {
    registry,
    async ask(prompt: string): Promise<AgentRun> {
      const history: Array<{ role: "tool" | "assistant"; content: string }> = [];
      const calls: AgentRun["calls"] = [];
      let text = "";

      for (let step = 0; step < maxSteps; step++) {
        const res = await config.llm({ prompt, tools: registry.tools(), history });
        if (res.text) {
          text = res.text;
          history.push({ role: "assistant", content: res.text });
        }
        if (!res.toolCalls || res.toolCalls.length === 0) break;
        for (const c of res.toolCalls) {
          let result: unknown;
          try {
            result = registry.call(c.tool, c.args ?? {});
          } catch (e) {
            result = { error: e instanceof Error ? e.message : String(e) };
          }
          calls.push({ tool: c.tool, args: c.args ?? {}, result });
          history.push({ role: "tool", content: `${c.tool} -> ${JSON.stringify(result)}` });
        }
      }
      return { text, calls };
    },
  };
}
