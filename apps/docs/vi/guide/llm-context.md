---
title: LLM context - một biểu đồ mà AI có thể đọc và điều khiển
---

# LLM context: một biểu đồ mà AI có thể đọc và điều khiển

Đưa một biểu đồ cho chatbot và cách làm thông thường là chụp màn hình nó rồi hy vọng mô
hình đọc được các điểm ảnh. Một biểu đồ michi-vz bỏ qua bước đó: nó trao ra một
**`ChartContext`** có cấu trúc mà mô hình có thể đọc trực tiếp, và phơi bày các điều khiển
của nó dưới dạng **công cụ (tools)** mà mô hình có thể gọi. Nhờ vậy một trợ lý có thể
*hiểu* biểu đồ và *thay đổi* nó - bằng các lệnh gọi hàm, chứ không phải đoán mò.

<InsightsDemo feature="forecast" />

> Câu văn bên dưới biểu đồ chính là `getContext().summary` của nó - được viết từ dữ liệu,
> không phải cào (scrape) từ DOM. Một mô hình nhận được điều đó, cộng với context có cấu
> trúc đầy đủ bên dưới.

## Context là gì

Mỗi biểu đồ đều tạo ra một **`ChartContext`** không phụ thuộc renderer từ mô hình dữ liệu
của nó (chứ không bao giờ từ DOM), nên nó **giống hệt nhau ở chế độ SVG và canvas** - ngay
cả trong canvas, nơi không có node theo từng mark để cào dữ liệu.

```ts
const ctx = chart.getContext(); // or el.getContext() on the web component / wrappers
```

Nó phơi bày ba thứ từ một nguồn duy nhất:

1. **JSON có cấu trúc** - loại biểu đồ, trục/miền giá trị, thống kê theo từng chuỗi
   (min/max/đầu/cuối, thay đổi, xu hướng, tương quan, khoảng trống, tổng…). Sẵn sàng cho
   việc dùng công cụ LLM, RAG, hoặc agent.
2. **Một `summary` bằng ngôn ngữ tự nhiên có tính xác định** - dựa trên quy tắc, không cần
   mô hình; cũng đóng vai trò văn bản thay thế (alt text).
3. **Một `a11yTable` không phụ thuộc loại biểu đồ** (`headers` + `rows`) điều khiển một
   bảng DOM ẩn về mặt thị giác bên cạnh biểu đồ, để trình đọc màn hình và các công cụ cào
   DOM nhận được nội dung thực ngay cả ở chế độ canvas.

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

Hình dạng của nó là một discriminated union theo khóa `chartType`, nên nó thu hẹp kiểu một
cách gọn gàng theo từng biểu đồ.

## Trò chuyện với biểu đồ của bạn: một chatbot điều khiển nó

Vì ý nghĩa đã có cấu trúc **và** các điều khiển là các công cụ, một chatbot không cào điểm
ảnh - nó gọi hàm. Mỗi nút bên dưới là một lệnh gọi công cụ thực sự đối với biểu đồ (chính
xác các lệnh gọi mà một client MCP như Claude Code sẽ thực hiện):

<InsightsDemo feature="agent" />

Gõ một lệnh - kể cả một lệnh cẩu thả như *"hilight east"* - và biểu đồ sẽ phản hồi. Engine
**⚡ Instant** định tuyến các từ của bạn tới công cụ của biểu đồ bằng một bộ khớp **chịu
được lỗi chính tả** (và gợi ý sửa khi nó không chắc chắn: *"did you mean highlight East?"*).
Chuyển sang **Real model** và chọn một LLM nhỏ chạy ngay trong trình duyệt (**Qwen / Llama
/ Gemma**) để đọc context của biểu đồ và diễn giải các yêu cầu tự do; nó sẽ quay về bộ khớp
tức thời nếu không tải được hoặc gặp trục trặc.

Dù theo cách nào, việc *đọc* dữ liệu vẫn chính xác: câu trả lời cho *"chuỗi nào tăng nhiều
nhất?"* đến thẳng từ `getContext()` có tính xác định (top mover, % thay đổi, tổng) - cùng
một context mà các tính năng insight sử dụng - nên chỉ có cách diễn đạt là mơ hồ, không
bao giờ là các con số. Kết nối caller của riêng bạn và agent sẽ nhận được context đó cùng
với các công cụ:

```ts
import { createAgent, chartHandle } from "@michi-vz/insights/agent";

const agent = createAgent({ charts: [chartHandle("sales", chart, props)], llm: myCaller });
await agent.ask("Highlight North, hide South, and forecast next quarter");
// the agent reads getContext(), calls highlight / set_disabled / forecast_series, and replies.
```

Ô chat ở trên là một ô nhỏ được xây dựng riêng cho tài liệu này. Để có một giao diện chat
hoàn thiện trong ứng dụng của riêng bạn, **[deep-chat](https://deepchat.dev)** là một web
component chat không phụ thuộc framework rất đáng dùng - chỉ cần thả nó vào, trỏ nó tới
LLM của bạn, và trao cho nó cùng `getContext()` và các công cụ. (Xin gửi lời cảm ơn tới đội
ngũ deep-chat.)

> Một mô hình có thể sai một cách đầy tự tin và các mô hình khác nhau trả lời khác nhau -
> vì vậy đừng tin tưởng AI một cách mù quáng. Context và công cụ có cấu trúc là có tính xác
> định; mô hình phủ bên trên mới là phần cần kiểm chứng.

Các công cụ tương tự được phơi bày qua **MCP** (Model Context Protocol), nên Claude Code,
Cursor, và Claude Desktop kết nối mà không cần tích hợp tùy chỉnh nào. Danh sách công cụ
đầy đủ, các resource `michivz://chart/<name>`, và demo registry nằm trong
**[Insights → Agents & MCP](/vi/guide/insights)**.
