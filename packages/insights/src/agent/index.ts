// Browser-safe agent surface: the tool registry + the in-page tool-calling agent.
// (The Node MCP server lives in "@michi-vz/insights/mcp" so this entry pulls no
// Node-only code.)
export {
  createAgentRegistry,
  chartHandle,
  type AgentRegistry,
  type ChartHandle,
} from "./registry";
export {
  createAgent,
  type MichiVzAgent,
  type CreateAgentConfig,
  type LlmCaller,
  type LlmInput,
  type LlmResult,
  type LlmToolCall,
  type AgentRun,
} from "./agent";
