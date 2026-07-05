---
title: Validate API
---

# Validate API

Phát hiện dữ liệu xấu và tô đỏ các điểm vi phạm trên biểu đồ; xem toàn bộ câu chuyện tại **[Hướng dẫn Insights](/vi/guide/insights)**.

Thử ngay - các điểm xấu được tô đỏ và hiện lên dưới dạng cảnh báo:

<InsightsDemo feature="validate" />

## Import

```ts
import { validate, validateSeries, invalidPoints } from "@michi-vz/insights/validate";
```

## Chữ ký & tùy chọn

`validate(options?)` trả về một plugin báo cáo vấn đề qua `onDataWarning` và, khi tính năng làm nổi bật được bật, vẽ một dấu đỏ trên mỗi điểm không hợp lệ.

| Tên | Kiểu | Mặc định | Chức năng |
| --- | --- | --- | --- |
| `options.highlight` | `boolean` | `true` | Làm nổi bật các điểm không hợp lệ trên biểu đồ bằng một dấu đỏ. Đặt `false` để chỉ hiện cảnh báo. |

Hai hàm hỗ trợ chạy cùng các kiểm tra mà không cần biểu đồ:

| Hàm | Trả về | Chức năng |
| --- | --- | --- |
| `validateSeries(series)` | `DataWarning[]` | Báo cáo các vấn đề ở cấp tập dữ liệu: `non-finite-value`, `duplicate-date`, `non-monotonic-date`, và `empty-dataset`. |
| `invalidPoints(series)` | `Array<{ index, date, value, kind }>` | Liệt kê từng điểm xấu, trong đó `kind` là `"non-finite"`, `"duplicate-date"`, hoặc `"non-monotonic"`. |

Tính năng này khác với `highlightItems`, vốn làm nổi bật cả một chuỗi; `validate` thay vào đó làm nổi bật các điểm xấu.

## Ví dụ

```ts
import { validate } from "@michi-vz/insights/validate";

// Warn via onDataWarning and mark bad points red.
chart.use(validate());

// Warnings only, no red markers.
chart.use(validate({ highlight: false }));
```

**[Hướng dẫn Insights](/vi/guide/insights)**
