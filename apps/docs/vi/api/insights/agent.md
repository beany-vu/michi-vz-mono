---
title: Agent & MCP API
---

# Agent & MCP API

Bọc một biểu đồ đã mount để một AI agent có thể vừa đọc vừa điều khiển nó - ngay trong trang qua một
agent gọi công cụ (tool-calling), hoặc ngoài tiến trình qua MCP; xem toàn bộ câu chuyện tại
**[Hướng dẫn Insights](/vi/guide/insights)**.

Thử ngay - gõ một lệnh (kể cả một lệnh không chuẩn như "hilight north") và biểu đồ sẽ phản hồi:

<InsightsDemo feature="agent" />

## Import

::: code-group

```ts [Agent]
import { createAgent, createAgentRegistry, chartHandle } from "@michi-vz/insights/agent";
```

```ts [MCP]
import { createMcpServer, stdioTransport, messagePortTransport } from "@michi-vz/insights/mcp";
```

:::

## Chữ ký & tùy chọn

### `chartHandle(name, instance, props)`

| Tham số | Kiểu | Mặc định | Chức năng |
| --- | --- | --- | --- |
| `name` | `string` | bắt buộc | ID ổn định mà agent và các công cụ dùng để định danh biểu đồ này. |
| `instance` | biểu đồ đã mount | bắt buộc | Biểu đồ được trả về bởi `mount*` (hoặc một wrapper framework). |
| `props` | props biểu đồ | bắt buộc | Các props mà biểu đồ được render cùng, để handle có thể đọc hoặc cập nhật chúng. |

Trả về một `ChartHandle` để cho phép biểu đồ được đọc và điều khiển.

### `createAgentRegistry()`

Trả về một registry chứa các handle.

| Thành viên | Kiểu | Chức năng |
| --- | --- | --- |
| `register(handle)` | `(handle: ChartHandle) => void` | Thêm một chart handle vào registry. |
| `unregister(name)` | `(name: string) => void` | Xóa handle được đăng ký dưới `name`. |
| `list()` | `() => string[]` | Liệt kê tên của tất cả các biểu đồ đã đăng ký. |
| `tools()` | `() => Tool[]` | Trả về các định nghĩa công cụ mà agent hoặc MCP server có thể gọi. |
| `call(tool, args)` | `(tool: string, args: object) => Promise<unknown>` | Gọi một công cụ theo tên trên biểu đồ tương ứng. |

### `createAgent(options)`

| Tùy chọn | Kiểu | Mặc định | Chức năng |
| --- | --- | --- | --- |
| `charts` | `ChartHandle[]` | `[]` | Các handle được tự động đăng ký; một cách rút gọn thay vì tự gọi `register`. |
| `registry` | `AgentRegistry` | một registry mới | Tái sử dụng một registry sẵn có thay vì tạo mới. |
| `llm` | `LlmCaller` | bắt buộc | LLM caller của riêng bạn (tự mang theo); agent sẽ đưa các công cụ và prompt vào đó. |
| `maxSteps` | `number` | không giới hạn | Giới hạn số vòng lặp gọi công cụ cho mỗi `ask`. |

Trả về `{ registry, ask(prompt) }`, một agent gọi công cụ trong trang.

### `createMcpServer(registry, transport, options?)`

| Tham số | Kiểu | Mặc định | Chức năng |
| --- | --- | --- | --- |
| `registry` | `AgentRegistry` | bắt buộc | Registry chứa các biểu đồ và công cụ mà server sẽ công khai. |
| `transport` | `Transport` | bắt buộc | `stdioTransport()` cho Claude Code, Codex, hoặc Cursor, hoặc `messagePortTransport(port)` để bắc cầu với một ứng dụng web. |
| `options` | `object` | `{}` | Cấu hình server tùy chọn (tên, phiên bản, và các metadata tương tự). |

Trả về một server MCP (JSON-RPC).

### Các công cụ

Mỗi biểu đồ đã đăng ký công khai `get_chart_context`, `summarize_chart`, `list_series`, `set_filter`, `highlight`, `set_disabled`, và `set_data`, cộng thêm bất kỳ công cụ nào từ plugin. Mỗi chart context cũng có thể được đọc dưới dạng một resource `michivz://chart/<name>`.

## Ví dụ

```ts
import { mountLineChart } from "@michi-vz/core";
import { createAgent, createAgentRegistry, chartHandle } from "@michi-vz/insights/agent";
import { createMcpServer, stdioTransport } from "@michi-vz/insights/mcp";

const chart = mountLineChart(el, props);

// In-page: a tool-calling agent that can read and drive the chart.
const agent = createAgent({
  charts: [chartHandle("revenue", chart, props)],
  llm, // bring your own LLM caller
});

const answer = await agent.ask("Which series grew the most, then highlight it.");

// Out-of-process: expose the same charts over MCP to Claude Code, Codex, or Cursor.
const registry = createAgentRegistry();
registry.register(chartHandle("revenue", chart, props));
const server = createMcpServer(registry, stdioTransport());
```

**[Hướng dẫn Insights](/vi/guide/insights)**
