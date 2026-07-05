---
title: Anomaly API
---

# Anomaly API

Đánh dấu các điểm không thuộc về, ghi chú chúng trên biểu đồ và trong phần tóm tắt; xem toàn bộ câu chuyện tại **[Hướng dẫn Insights](/vi/guide/insights)**.

Thử ngay - điểm ngoại lai được đánh dấu trên biểu đồ và được nêu ra trong phần tóm tắt:

<InsightsDemo feature="anomaly" />

## Import

```ts
import { anomaly, detectAnomalies } from "@michi-vz/insights/anomaly";
```

## Chữ ký & tùy chọn

`anomaly(options?)` trả về một plugin; `use()` của nó đánh dấu các điểm ngoại lai trên biểu đồ và ghi chú chúng trong phần tóm tắt. `detectAnomalies(values: number[], options?)` trả về `{ method, anomalies, threshold }`, trong đó `anomalies` là một mảng gồm `{ index, value, score, kind }`.

Cả hai đều nhận cùng các tùy chọn:

| Tùy chọn | Kiểu | Mặc định | Chức năng |
| --- | --- | --- | --- |
| `method` | `"zscore"` hoặc `"iqr"` hoặc `"forecast"` | `"zscore"` | Chiến lược phát hiện. `"zscore"` đánh dấu các điểm cách xa giá trị trung bình, `"iqr"` đánh dấu các điểm nằm ngoài hàng rào tứ phân vị, và `"forecast"` đánh dấu các điểm nằm ngoài dải dự đoán. |
| `threshold` | `number` | `~3` cho `zscore`, `~1.5` cho `iqr` | Ngưỡng cắt z cho `"zscore"` hoặc hệ số nhân `k` của IQR cho `"iqr"`. Tùy chọn. |
| `target` | `string` hoặc `string[]` | tất cả chuỗi | Giới hạn phát hiện cho các chuỗi này. Tùy chọn. |

## Ví dụ

```ts
import { anomaly, detectAnomalies } from "@michi-vz/insights/anomaly";

// Standalone detection: flags the 50.
const result = detectAnomalies([10, 11, 9, 10, 50, 11]);
// result.anomalies -> [{ index: 4, value: 50, score, kind }]

// As a chart plugin, using the IQR method.
chart.use(anomaly({ method: "iqr" }));
```

**[Hướng dẫn Insights](/vi/guide/insights)**
