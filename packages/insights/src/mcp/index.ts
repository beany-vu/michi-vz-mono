// Minimal MCP (Model Context Protocol) server — JSON-RPC 2.0 over a pluggable
// transport, exposing a chart registry's tools (read + drive) and each chart's
// ChartContext as a resource. Dependency-free so it stays tiny and fully testable
// with an in-memory transport; runs headless over stdio for Claude Code / Codex /
// Cursor / Claude Desktop (point them at `michi-vz-mcp` and they read + drive charts).
import type { AgentRegistry } from "../agent/registry";

export interface JsonRpcMessage {
  jsonrpc?: "2.0";
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: { code: number; message: string };
}

export interface McpTransport {
  send(message: JsonRpcMessage): void;
  onMessage(handler: (message: JsonRpcMessage) => void): void;
}

export interface McpServerOptions {
  name?: string;
  version?: string;
}

const RESOURCE_PREFIX = "michivz://chart/";

export interface McpServer {
  /** Handle one JSON-RPC request and return its response (or null for notifications). */
  handle(message: JsonRpcMessage): JsonRpcMessage | null;
  toolDefs(): Array<{ name: string; description: string; inputSchema: unknown }>;
  resourceDefs(): Array<{ uri: string; name: string; description: string; mimeType: string }>;
}

export function createMcpServer(
  registry: AgentRegistry,
  transport: McpTransport,
  opts: McpServerOptions = {}
): McpServer {
  const name = opts.name ?? "michi-vz";
  const version = opts.version ?? "0.1.0";

  const toolDefs = () =>
    registry.tools().map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema ?? { type: "object" },
    }));

  const resourceDefs = () =>
    registry.list().map((n) => ({
      uri: `${RESOURCE_PREFIX}${n}`,
      name: n,
      description: `ChartContext for "${n}"`,
      mimeType: "application/json",
    }));

  function handle(msg: JsonRpcMessage): JsonRpcMessage | null {
    const { id, method, params } = msg;
    const reply = (result: unknown): JsonRpcMessage => ({ jsonrpc: "2.0", id, result });
    const fail = (code: number, message: string): JsonRpcMessage => ({
      jsonrpc: "2.0",
      id,
      error: { code, message },
    });
    // notifications (no id) never get a response
    const isNotification = id === undefined || id === null;

    try {
      switch (method) {
        case "initialize":
          return reply({
            protocolVersion: "2024-11-05",
            capabilities: { tools: {}, resources: {} },
            serverInfo: { name, version },
          });
        case "notifications/initialized":
        case "initialized":
          return null;
        case "ping":
          return isNotification ? null : reply({});
        case "tools/list":
          return reply({ tools: toolDefs() });
        case "tools/call": {
          const result = registry.call(String(params?.name), (params?.arguments as Record<string, unknown>) ?? {});
          return reply({ content: [{ type: "text", text: JSON.stringify(result) }] });
        }
        case "resources/list":
          return reply({ resources: resourceDefs() });
        case "resources/read": {
          const uri = String(params?.uri ?? "");
          if (!uri.startsWith(RESOURCE_PREFIX)) return fail(-32602, `Unknown resource: ${uri}`);
          const chart = uri.slice(RESOURCE_PREFIX.length);
          const ctx = registry.call("get_chart_context", { chart });
          return reply({ contents: [{ uri, mimeType: "application/json", text: JSON.stringify(ctx) }] });
        }
        default:
          return isNotification ? null : fail(-32601, `Method not found: ${String(method)}`);
      }
    } catch (e) {
      return fail(-32603, e instanceof Error ? e.message : String(e));
    }
  }

  transport.onMessage((msg) => {
    const res = handle(msg);
    if (res) transport.send(res);
  });

  return { handle, toolDefs, resourceDefs };
}

/** Newline-delimited JSON-RPC over Node stdio — the transport Claude Code / Codex use. */
export function stdioTransport(): McpTransport {
  let handler: (m: JsonRpcMessage) => void = () => {};
  let buf = "";
  const proc = (globalThis as { process?: NodeProcess }).process;
  const stdin = proc?.stdin;
  const stdout = proc?.stdout;
  stdin?.setEncoding?.("utf8");
  stdin?.on?.("data", (chunk: string) => {
    buf += chunk;
    let idx: number;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line) continue;
      try {
        handler(JSON.parse(line) as JsonRpcMessage);
      } catch {
        /* ignore malformed line */
      }
    }
  });
  return {
    send: (msg) => stdout?.write?.(JSON.stringify(msg) + "\n"),
    onMessage: (h) => {
      handler = h;
    },
  };
}

interface NodeProcess {
  stdin?: { setEncoding?: (e: string) => void; on?: (ev: string, cb: (chunk: string) => void) => void };
  stdout?: { write?: (s: string) => void };
}

/** A MessagePort/Worker/iframe-like endpoint (the live-browser bridge surface). */
export interface MessageLike {
  postMessage(data: unknown): void;
  addEventListener?(type: "message", cb: (ev: { data: unknown }) => void): void;
  onmessage?: ((ev: { data: unknown }) => void) | null;
}

/**
 * Bridge the MCP server to a running web app over a MessagePort / Worker / iframe
 * (the live-browser transport): run the server in a worker and drive on-screen charts
 * from the page, or vice-versa. Works with anything exposing postMessage + message events.
 */
export function messagePortTransport(port: MessageLike): McpTransport {
  let handler: (m: JsonRpcMessage) => void = () => {};
  const onMsg = (ev: { data: unknown }): void => handler(ev.data as JsonRpcMessage);
  if (port.addEventListener) port.addEventListener("message", onMsg);
  else port.onmessage = onMsg;
  return {
    send: (msg) => port.postMessage(msg),
    onMessage: (h) => {
      handler = h;
    },
  };
}
