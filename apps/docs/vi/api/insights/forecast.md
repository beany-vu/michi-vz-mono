---
title: Forecast API
---

# Forecast API

Một plugin biến bất kỳ biểu đồ thời gian nào thành một dự báo, chiếu các bước tương lai kèm dải tin cậy; xem toàn bộ câu chuyện tại **[Hướng dẫn Insights](/vi/guide/insights)**.

Thử ngay - bật/tắt phần dự báo, dải của nó, và lời tường thuật:

<InsightsDemo feature="forecast" />

## Import

```ts
import { forecast } from "@michi-vz/insights/forecast";
```

`forecast(options?)` trả về một plugin mà bạn truyền vào trong tùy chọn mount của biểu đồ. Nó hoạt động trên các biểu đồ Line, Fan, Range, Area, Vertical-Stack-Bar, Ribbon, và Bar-Bell.

```ts
mountLineChart(el, props, { plugins: [forecast({ horizon: 4 })] });
```

## Chữ ký & tùy chọn

| Tên | Kiểu | Mặc định | Chức năng |
| --- | --- | --- | --- |
| `method` | `"holt-winters"` hoặc `"linear"` (lazy `"arima"`) | `"holt-winters"` | Mô hình dự báo dùng để chiếu các bước tương lai. |
| `horizon` | `number` | `4` | Số bước tương lai cần dự báo. |
| `level` | `number` | `0.95` | Mức tin cậy cho dải dự đoán. |
| `levels` | `number[]` | tùy chọn | Các mức dải lồng nhau bổ sung cho biểu đồ hình quạt. |
| `target` | `string` hoặc `string[]` | tất cả | Giới hạn dự báo cho các nhãn chuỗi này. |
| `scenarios` | `Array<{ name: string; growth: number }>` | tùy chọn | Các đường kịch bản "nếu như" được vẽ từ tỷ lệ tăng trưởng tùy chỉnh. |
| `trendline` | `boolean` | `false` | Phủ thêm một đường hồi quy. |
| `threshold` | `{ value: number; label?: string }` | tùy chọn | Đường tham chiếu cộng với một "điểm rơi" được chiếu trước. |
| `onThresholdBreach` | `(b) => void` | tùy chọn | Kích hoạt khi dự báo được chiếu là sẽ vượt qua ngưỡng. |
| `zone` | `boolean` | `true` | Tô màu vùng dự báo để làm nổi bật phần dự đoán so với phần thực tế. |

Cũng được export từ subpath này: `forecastFan(history, options?, label?)`, `computeForecast`, `decompose`, `detectPeriod`, `detectChangepoints`, `monteCarloForecast`, `requiredGrowth`, `requiredRunRate`, `pacingToGoal`, và `FORECASTABLE_CHARTS`.

## Ví dụ

```ts
import { mountLineChart } from "@michi-vz/core";
import { forecast } from "@michi-vz/insights/forecast";

mountLineChart(el, props, {
  plugins: [
    forecast({
      method: "holt-winters",
      horizon: 4,
      threshold: { value: 200, label: "Target" },
      zone: true,
    }),
  ],
});
```

**[Hướng dẫn Insights](/vi/guide/insights)**
