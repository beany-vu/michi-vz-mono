---
title: Narrate API
---

# Narrate API

Biến bất kỳ biểu đồ nào thành một câu văn kể về chính nó, mặc định dựa trên quy tắc và có thể tùy chọn nâng cấp lên một mô hình cục bộ nhỏ; xem toàn bộ câu chuyện tại **[Hướng dẫn Insights](/vi/guide/insights)**.

Thử ngay - bấm **Explain ▸** và biểu đồ sẽ tự viết câu văn của riêng nó:

<InsightsDemo feature="narrate" />

## Import

```ts
import { narrate, narrateRules, explainChart, SLM_PRESETS } from "@michi-vz/insights/narrate";
```

## Chữ ký & tùy chọn

### `narrate(options?)`

Trả về một plugin viết lại phần tóm tắt của biểu đồ. Mặc định dựa trên quy tắc.

| Tùy chọn | Kiểu | Mặc định | Chức năng |
| --- | --- | --- | --- |
| `strings` | `NarrateStrings` | tiếng Anh dựng sẵn | Bản địa hóa các bộ dựng câu dựng sẵn cho i18n: `topMover(label, dir, pct)`, `trendSplit(up, down)`, `largestTotal(label, total)`. |
| `render` | `(ctx) => string` | `undefined` | Một bộ tường thuật tùy chỉnh hoàn toàn bằng bất kỳ ngôn ngữ nào; thay thế hoàn toàn các bộ dựng dựng sẵn. |

### `narrateRules(ctx, strings?) => string`

Phần tường thuật tất định, không dùng mô hình. Cùng nội dung văn bản mà plugin tạo ra, có thể gọi trực tiếp.

### `explainChart(ctx, options?) => Promise<string>`

Tùy chọn nâng cấp phần tường thuật lên một mô hình. Luôn quay về dùng quy tắc nếu mô hình không khả dụng.

| Tùy chọn | Kiểu | Mặc định | Chức năng |
| --- | --- | --- | --- |
| `backend` | `"rules"` hoặc `"transformers"` hoặc `"webllm"` hoặc `"remote"` | `"rules"` | Bộ tường thuật nào sẽ chạy. `"rules"` không dùng mô hình; các lựa chọn khác dùng một SLM sinh văn bản. |
| `model` | `string` | `undefined` | ID của mô hình. Xem `SLM_PRESETS.transformers.phi3`, `SLM_PRESETS.transformers.gemma`, và `SLM_PRESETS.webllm.*`. |
| `caller` | `(prompt) => Promise<string>` | `undefined` | Dùng cho `backend: "remote"`. Gọi mô hình của riêng bạn; lưu ý rằng dữ liệu sẽ rời khỏi client. |
| `strings` | `NarrateStrings` | tiếng Anh dựng sẵn | Cũng dùng để bản địa hóa hoặc thay thế văn bản dự phòng. |
| `render` | `(ctx) => string` | `undefined` | Bộ tường thuật dự phòng tùy chỉnh, cùng hình dạng như trong `narrate`. |
| `onProgress` | `(info) => void` | `undefined` | Tiến trình tải mô hình; dùng để điều khiển một UI hiển thị trạng thái tải. |

> Chúng tôi ưu tiên các mô hình cục bộ nhỏ (SLM). Lưu ý rằng BERT dùng cho embeddings và độ tương tự, không phải để tường thuật; tường thuật chỉ dùng quy tắc hoặc một SLM sinh văn bản.

## Ví dụ

```ts
import { narrate, explainChart, SLM_PRESETS } from "@michi-vz/insights/narrate";
import { frenchStrings } from "./i18n";

// Rule-based, localized to French.
const plugin = narrate({ strings: frenchStrings });

// Upgrade to a small local model, with a loading UI fed by onProgress.
const text = await explainChart(ctx, {
  backend: "transformers",
  model: SLM_PRESETS.transformers.gemma,
  onProgress: (p) => setLoading(p),
});
```

**[Hướng dẫn Insights](/vi/guide/insights)**
