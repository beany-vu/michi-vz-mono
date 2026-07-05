---
title: Sonify API
---

# Sonify API

Nghe một chuỗi dữ liệu dưới dạng cao độ theo thời gian - một hỗ trợ tiếp cận ("nghe xu hướng"): giá trị
thấp ánh xạ với nốt nhạc thấp, giá trị cao ánh xạ với nốt nhạc cao, để một chuỗi tăng dần *nghe* như thể
nó đang tăng. Xem demo kèm nút phát tại
**[Hướng dẫn Insights](/vi/guide/insights#more-from-the-toolbox)**.

Thử ngay - nhấn phát để nghe xu hướng (các cột chính là đầu ra thuần túy của `valuesToTones()`):

<PluginLab feature="sonify" />

## Import

```ts
import { sonify, valuesToTones } from "@michi-vz/insights/sonify";
// also re-exported from the package root: import { sonify } from "@michi-vz/insights";
```

## `sonify` - phát một chuỗi dữ liệu

```ts
await sonify(values, { duration: 3, minFreq: 220, maxFreq: 880 });
```

Lên lịch phát một nốt nhạc cho mỗi giá trị thông qua Web Audio API. Đây là một **no-op an toàn** ở nơi
không có `AudioContext` (SSR / jsdom / trình duyệt không hỗ trợ), nên có thể gọi ở bất cứ đâu một cách
an toàn.

## `valuesToTones` - phép ánh xạ thuần túy

```ts
const tones = valuesToTones(values, { duration: 3 });
// → [{ time, duration, freq, value }, ...]
```

Tất định và có thể kiểm thử - cùng một đầu vào luôn cho ra cùng các nốt nhạc (demo vẽ chúng dưới dạng
các cột). Các giá trị không hữu hạn (non-finite) bị bỏ qua khi tính khoảng min/max.

| Tùy chọn | Kiểu | Mặc định | Chức năng |
| --- | --- | --- | --- |
| `duration` | `number` | `3` | Tổng thời lượng phát, tính bằng giây. |
| `minFreq` | `number` | `220` | Cao độ (Hz) ánh xạ với giá trị nhỏ nhất. |
| `maxFreq` | `number` | `880` | Cao độ (Hz) ánh xạ với giá trị lớn nhất. |

Mỗi `Tone` là `{ time, duration, freq, value }` (giây / giây / Hz / giá trị nguồn).

**[Hướng dẫn Insights](/vi/guide/insights#more-from-the-toolbox)**
