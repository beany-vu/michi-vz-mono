---
title: Forecast extras API - seasonality, changepoints, Monte Carlo, goal-seek
---

# Forecast extras: seasonality, changepoints, Monte Carlo & goal-seek

Bên cạnh [plugin `forecast()`](/vi/api/insights/forecast), subpath `@michi-vz/insights/forecast`
còn cung cấp một tập các hàm hỗ trợ thuần túy, tất định, hoạt động trên một `number[]` đơn giản - không
cần biểu đồ. Mỗi hàm là một phương pháp có tên riêng, theo đúng sách giáo khoa; xem câu chuyện và demo tại
**[Hướng dẫn Insights](/vi/guide/insights#more-from-the-toolbox)**.

## Import

```ts
import {
  decompose, detectPeriod,          // seasonality
  detectChangepoints,               // regime shifts
  monteCarloForecast,               // simulation
  requiredGrowth, requiredRunRate, pacingToGoal, // goal-seek
} from "@michi-vz/insights/forecast";
```

## Tính mùa vụ: `decompose` / `detectPeriod`

Phép phân rã cộng tính cổ điển tách một chuỗi thành xu hướng trơn (trend), thành phần mùa vụ lặp lại
(seasonal), và phần dư còn lại (residual) (`values = trend + seasonal + residual`). `detectPeriod` tự
tìm độ dài chu kỳ bằng tự tương quan (autocorrelation).

<PluginLab feature="seasonal" />

```ts
const period = detectPeriod(values);            // e.g. 4 (quarterly), or 1 if not clearly periodic
const { trend, seasonal, residual } = decompose(values, period);
```

| Hàm | Chữ ký | Trả về |
| --- | --- | --- |
| `detectPeriod` | `(values: number[], maxPeriod?: number) => number` | Chu kỳ chiếm ưu thế (độ trễ có tự tương quan cao nhất); `1` khi không có chu kỳ rõ ràng. `maxPeriod` mặc định là `min(floor(n/2), 24)`. |
| `decompose` | `(values: number[], period?: number) => Decomposition` | `{ trend, seasonal, residual, period }` - mỗi thành phần là một mảng có độ dài bằng `values`. `period` mặc định là `detectPeriod(values)`. |

Độ lệch chuẩn phần dư nhỏ nghĩa là xu hướng + mùa vụ đã giải thích gần như toàn bộ biến động - tức là
cách bạn tách biệt tăng trưởng thực sự khỏi "lại đến tháng Mười Hai rồi."

## Điểm gãy xu hướng: `detectChangepoints`

Tìm các chỉ số nơi độ dốc của xu hướng thay đổi cấu trúc (một đường OLS được khớp ở hai phía của mỗi
điểm chia ứng viên; các cực đại cục bộ của `|slopeAfter - slopeBefore|` vượt ngưỡng sẽ được giữ lại).

<PluginLab feature="changepoints" />

```ts
const points = detectChangepoints(values, { minSegment: 3 });
// → [{ index, slopeBefore, slopeAfter, delta }, ...]
```

| Tùy chọn | Kiểu | Mặc định | Chức năng |
| --- | --- | --- | --- |
| `minSegment` | `number` | `3` | Số điểm tối thiểu ở mỗi phía của một điểm chia (cũng là khoảng cách tối thiểu giữa hai điểm gãy). |
| `threshold` | `number` | độ lệch chuẩn của đường cong slope-delta | Cường độ uốn tối thiểu để một điểm chia được tính; giá trị mặc định co giãn theo chuỗi dữ liệu. |

Mỗi `Changepoint` là `{ index, slopeBefore, slopeAfter, delta }`, trong đó `index` là điểm bắt đầu của
đoạn "sau".

## Mô phỏng: `monteCarloForecast`

Chạy nhiều tương lai mô phỏng xung quanh dự báo điểm (mỗi bước bị nhiễu bởi nhiễu dư Gauss tăng dần theo
`sqrt(step)`), sau đó báo cáo đường trung bình, một dải thực nghiệm, và các xác suất vượt ngưỡng. Tất
định nhờ một PRNG có seed - cùng một `seed` luôn cho lại kết quả giống nhau.

<PluginLab feature="montecarlo" />

```ts
const mc = monteCarloForecast(values, { horizon: 4, runs: 500, seed: 1, level: 0.95 });
mc.predictions; // mean path (length = horizon)
mc.lower; mc.upper; // band edges per step
mc.probabilityAbove(target); // fraction of runs finishing strictly above `target`
mc.probabilityBelow(target);
```

| Tùy chọn | Kiểu | Mặc định | Chức năng |
| --- | --- | --- | --- |
| `horizon` | `number` | (bắt buộc) | Số bước cần mô phỏng về phía trước. |
| `runs` | `number` | `500` | Số lượt tương lai được mô phỏng. |
| `seed` | `number` | `1` | Seed của PRNG để đảm bảo tái lập được. |
| `level` | `number` | `0.95` | Khối lượng xác suất trung tâm được giữ trong dải. |
| `method` | `ForecastMethod` | `"holt-winters"` | Mô hình dùng cho đường trung tâm. |

## Goal-seek: `requiredGrowth` / `requiredRunRate` / `pacingToGoal`

Ngược lại với dự báo: với một mục tiêu đã biết, cần gì để đạt được nó?

<PluginLab feature="goalseek" />

```ts
requiredGrowth(current, target, periods);   // constant % per period (compounding) to reach target
requiredRunRate(current, target, periods);  // constant additive amount per period to reach target
const pace = pacingToGoal(cumulative, target, periodsElapsed, periodsTotal);
// pace → { projected, attainmentPct, onTrack, requiredRunRate }
```

| Hàm | Chữ ký | Trả về |
| --- | --- | --- |
| `requiredGrowth` | `(current, target, periods) => number` | Tỷ lệ tăng trưởng nhân theo từng kỳ `g` sao cho `current*(1+g)**periods === target`. `0` khi `current <= 0` hoặc `periods <= 0`. |
| `requiredRunRate` | `(current, target, periods) => number` | Mức tăng cộng dồn theo từng kỳ `(target - current) / periods`. |
| `pacingToGoal` | `(cumulative, target, periodsElapsed, periodsTotal) => Pacing` | Chiếu tốc độ hiện tại trên toàn bộ khoảng thời gian: `{ projected, attainmentPct, onTrack, requiredRunRate }`. |

Tất cả các hàm trên đều là phép tính số học thuần túy - không DOM, không phụ thuộc, không ngẫu nhiên
(ngoại trừ Monte Carlo có seed).

**[Hướng dẫn Insights](/vi/guide/insights#more-from-the-toolbox)**
