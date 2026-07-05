---
title: LLM context - một biểu đồ mà AI có thể đọc và điều khiển
---

# LLM context: một biểu đồ mà AI có thể đọc và điều khiển

Đưa một biểu đồ cho chatbot, cách làm thông thường là chụp màn hình rồi hy vọng model đọc
được pixel. Biểu đồ michi-vz bỏ qua bước đó: nó đưa thẳng một **`ChartContext`** có cấu
trúc mà model đọc trực tiếp được, và cung cấp các điều khiển của mình dưới dạng **tool**
mà model có thể gọi. Nhờ vậy một trợ lý có thể *hiểu* biểu đồ và *thay đổi* nó bằng function
call, chứ không phải đoán mò.

<InsightsDemo feature="forecast" />

> Câu văn bên dưới biểu đồ chính là `getContext().summary` của nó. Nó viết từ dữ liệu thật,
> không cào (scrape) từ DOM. Model nhận được câu đó, cộng với toàn bộ context có cấu trúc
> bên dưới.

## Context là gì

Mỗi biểu đồ tạo ra một **`ChartContext`** không phụ thuộc renderer, tính từ data model của
nó (không bao giờ từ DOM), nên nó **giống hệt nhau dù ở chế độ SVG hay canvas**, kể cả ở
canvas là nơi không có node riêng cho từng mark để cào.

```ts
const ctx = chart.getContext(); // or el.getContext() on the web component / wrappers
```

Nó cung cấp ba thứ, cùng từ một nguồn:

1. **JSON có cấu trúc**: loại biểu đồ, trục/domain, thống kê theo từng chuỗi (min/max/đầu/
   cuối, mức thay đổi, xu hướng, tương quan, khoảng trống, tổng…). Dùng ngay được cho LLM
   tool-use, RAG, hoặc agent.
2. **Một `summary` bằng ngôn ngữ tự nhiên, có tính xác định**: dựa trên rule, không cần
   model; cũng đóng vai trò alt text.
3. **Một `a11yTable` không phụ thuộc loại biểu đồ** (`headers` + `rows`) điều khiển một
   bảng DOM ẩn về mặt thị giác cạnh biểu đồ, để screen reader và các tool cào DOM vẫn nhận
   được nội dung thật ngay cả ở chế độ canvas.

```jsonc
{
  "chartType": "line-chart",
  "renderer": "svg",
  "series": [{ "label": "North", "change": 20, "trend": "up", "gaps": 0 }],
  "stats": { "seriesCount": 2, "largestMover": { "label": "North", "change": 20 } },
  "summary": "Line chart with 2 series over 8 points. North rose the most (20).",
  "a11yTable": { "headers": ["Series", "Points", "First", "Last", "Change", "Trend"], "rows": [/* … */] }
}
```

Hình dạng của nó là một discriminated union theo khóa `chartType`, nên type tự thu hẹp gọn
gàng theo từng biểu đồ.

## Trò chuyện với biểu đồ của bạn: chatbot điều khiển thẳng

Vì ý nghĩa đã có cấu trúc **và** các điều khiển đều là tool, chatbot không cào pixel, nó
gọi hàm. Mỗi nút bên dưới là một tool call thật sự lên biểu đồ (đúng những lệnh gọi mà một
MCP client như Claude Code sẽ thực hiện):

<InsightsDemo feature="agent" />

Gõ một lệnh, kể cả lệnh cẩu thả như *"hilight east"*, biểu đồ vẫn phản hồi. Engine
**⚡ Instant** khớp từ bạn gõ với tool của biểu đồ bằng một bộ so khớp **chịu được lỗi
chính tả** (và gợi ý sửa khi không chắc: *"did you mean highlight East?"*). Chuyển sang
**Real model** để chọn một LLM nhỏ chạy ngay trong trình duyệt (**Qwen / Llama / Gemma**),
đọc context của biểu đồ và diễn giải các yêu cầu tự do; nó tự quay về bộ so khớp tức thời
nếu không tải được hoặc trục trặc.

Dù chọn cách nào, phần *đọc* dữ liệu vẫn chính xác: câu trả lời cho *"chuỗi nào tăng nhiều
nhất?"* lấy thẳng từ `getContext()` có tính xác định (top mover, % thay đổi, tổng), cùng
context mà các tính năng insight đang dùng, nên chỉ cách diễn đạt là mơ hồ, số liệu thì
không bao giờ sai. Nối caller của riêng bạn vào, agent sẽ nhận context đó cùng các tool:

```ts
import { createAgent, chartHandle } from "@michi-vz/insights/agent";

const agent = createAgent({ charts: [chartHandle("sales", chart, props)], llm: myCaller });
await agent.ask("Highlight North, hide South, and forecast next quarter");
// the agent reads getContext(), calls highlight / set_disabled / sales.forecast, and replies.
```

Ô chat ở trên chỉ là bản nhỏ, làm riêng cho trang tài liệu này. Nếu cần một giao diện chat
hoàn chỉnh trong app của bạn, **[deep-chat](https://deepchat.dev)** là một web component
chat không phụ thuộc framework rất đáng dùng: thả vào, trỏ tới LLM của bạn, rồi đưa cho nó
cùng `getContext()` và các tool đó. (Cảm ơn team deep-chat.)

> Model có thể sai một cách rất tự tin, và mỗi model trả lời một kiểu, nên đừng tin AI một
> cách mù quáng. Context và tool có cấu trúc thì có tính xác định; phần model chạy phía
> trên mới là chỗ cần kiểm chứng.

Cùng bộ tool đó cũng lộ ra qua **MCP** (Model Context Protocol), nên Claude Code, Cursor,
và Claude Desktop kết nối được luôn mà không cần tích hợp riêng. Danh sách tool đầy đủ,
các resource `michivz://chart/<name>`, và demo registry nằm ở
**[Insights → Agents & MCP](/vi/guide/insights)**.
