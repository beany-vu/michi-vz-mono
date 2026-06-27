import { describe, it, expect } from "vitest";
import { createMcpServer, messagePortTransport, type JsonRpcMessage, type MessageLike } from "../src/mcp";
import { createAgentRegistry } from "../src/agent";

// A synchronous in-memory MessagePort pair (mimics worker/iframe postMessage).
function portPair(): { a: MessageLike; b: MessageLike } {
  const aL: Array<(ev: { data: unknown }) => void> = [];
  const bL: Array<(ev: { data: unknown }) => void> = [];
  return {
    a: { postMessage: (d) => bL.forEach((f) => f({ data: d })), addEventListener: (_t, cb) => aL.push(cb) },
    b: { postMessage: (d) => aL.forEach((f) => f({ data: d })), addEventListener: (_t, cb) => bL.push(cb) },
  };
}

describe("MCP live-browser bridge (messagePortTransport)", () => {
  it("serves requests over a MessagePort", () => {
    const registry = createAgentRegistry();
    const { a, b } = portPair();
    createMcpServer(registry, messagePortTransport(a)); // server on side A

    const responses: JsonRpcMessage[] = [];
    b.addEventListener?.("message", (ev) => responses.push(ev.data as JsonRpcMessage));
    b.postMessage({ jsonrpc: "2.0", id: 1, method: "tools/list" }); // client on side B

    expect(responses).toHaveLength(1);
    const tools = (responses[0].result as { tools: Array<{ name: string }> }).tools;
    expect(tools.map((t) => t.name)).toContain("get_chart_context");
  });
});
