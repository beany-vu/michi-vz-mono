---
title: API Đài phun (Jet d'Eau)
---

# API Đài phun (Jet d'Eau)

Mỗi cột một con số (chấm lớn), khoảng thật xung quanh nó (đài phun, từ `low` đến `high`) và chính các lần đo (các chấm nhỏ), tất cả trên cùng một trục y. Trục x theo danh mục = ảnh chụp nhanh (snapshot); trục x theo thời gian hoặc số = xu hướng (trend). Xem **[demo Đài phun](/vi/charts/fountain)** và [cách đọc](/vi/charts/fountain#how-to-read-it).

## Nhập

::: code-group

```ts [Web Component]
import "@michi-vz/wc/fountain-chart";
// <michi-vz-fountain-chart> đã được định nghĩa
```

```ts [Vanilla JS]
import { mountFountainChart } from "@michi-vz/core";

const chart = mountFountainChart(el, props);
```

```ts [React]
import { FountainChart } from "@michi-vz/react/fountain-chart";
```

```ts [Vue]
import { FountainChart } from "@michi-vz/vue/fountain-chart";
```

```ts [Svelte]
import { fountainChart } from "@michi-vz/svelte/fountain-chart";
```

```ts [Angular]
import { bindChart, applyFountainChartProps } from "@michi-vz/angular/fountain-chart";
// cần CUSTOM_ELEMENTS_SCHEMA trên component chứa <michi-vz-fountain-chart>
```

:::

## Props

<PropsTable chart="fountain-chart" />

::: tip Hai chế độ, một cấu trúc dữ liệu
Đặt `xAxisDataType: "band"` (hoặc bỏ qua) cho **chế độ ảnh chụp nhanh**: mỗi `label` một cột. Đặt `xAxisDataType` theo thời gian hoặc số cùng một `date` trên mỗi mục cho **chế độ xu hướng**: các tia nằm dọc trục x và, khi chỉ có một chuỗi, một đường đứt nét nối các chấm lớn. Một mục `forecast: true` có thân và viền đứt nét, phần tô nhạt hơn và chấm lớn rỗng, không có chấm nhỏ.
:::

### Mới trong core 1.29 {#new-props}

| Prop | Kiểu | Mặc định | Tác dụng |
| --- | --- | --- | --- |
| `showRange` | `boolean` | `true` | Vẽ đài phun, tức khoảng `[low, high]`. `false` chỉ vẽ thân và chấm lớn; các chấm nhỏ cũng ẩn theo. |
| `showSamples` | `boolean` | `true` | Vẽ mỗi lần đo một chấm nhỏ, khi các mục có `samples`. |
| `showValueLabels` | `boolean` | `true` | Ghi dưới mỗi nhãn x: "usual 30" in đậm, "&lt;từ đầu thấp&gt; 22", "&lt;từ đầu cao&gt; 55", "only N &lt;sampleWord&gt;" khi dưới 10 lần đo, và với mỗi đường tham chiếu có `goodSide` là "17 of 20" in đậm kèm `countLabel`. |
| `drift` | `boolean` | `false` | Kiểu Geneva: phần trên của mỗi đài phun nghiêng về cùng một phía. Nó không mang dữ liệu nào. |
| `yAxisTitle` | `string` | không có | Tiêu đề xoay dọc bên cạnh trục y, ví dụ "phút (cao hơn = chậm hơn)". |
| `endLabels` | `[string, string]` | `["lowest", "highest"]` | Từ cho đầu thấp và đầu cao trong nhãn giá trị và tooltip. |
| `referenceLines` | `FountainReferenceLine[]` | không có | Các đường đứt nét màu cảnh báo của theme, nhãn ở đầu bên phải. Xem [bên dưới](#reference-line). |
| `labels` | `FountainLabels` | tiếng Anh | Các từ khác của biểu đồ, để dịch. Xem [bên dưới](#labels). |
| `readingGuide` | `boolean \| string` | `false` | Hướng dẫn đọc dưới biểu đồ, xuống dòng giữa các quy tắc (tại mỗi dấu « · ») khi không vừa một dòng. `true` dùng hướng dẫn mặc định, chỉ nêu những gì biểu đồ vẽ (không có quy tắc về chấm nhỏ khi không có chấm nhỏ, không có `Tall fountain` khi không có đài phun); một chuỗi sẽ thay thế nó. |
| `sampleWord` | `string` | `"measurements"` | Danh từ số nhiều cho các lần đo ("days", "orders"). Cố ý dùng số nhiều: không có logic tự chia số nhiều. |

`showTrendLine` giờ có mặc định theo chế độ: `true` ở chế độ xu hướng với một chuỗi; `false` khi có nhiều chuỗi, vì một đường duy nhất sẽ chạy zíc zắc qua lại giữa các chuỗi, và ở chế độ ảnh chụp nhanh (đặt `true` để nối một dãy danh mục có thứ tự).

### Mục dữ liệu: `FountainDataItem` {#data-item}

| Trường | Kiểu | Ý nghĩa |
| --- | --- | --- |
| `label` | `string` | Cột (ảnh chụp nhanh) hoặc tên chuỗi (xu hướng). Quyết định màu và hook `data-label`. |
| `code` | `string` | Mã cố định tùy chọn, được đưa vào context; không hiển thị. |
| `value` | `number` | Chấm lớn. Không bắt buộc khi có `samples`: khi đó là trung vị của chúng. Không có giá trị hữu hạn và không có lần đo thì tia bị bỏ qua. |
| `low` | `number` | Đáy của đài phun. |
| `high` | `number` | Đỉnh của đài phun. |
| `spread` | `number` | Cách viết tắt cho một khoảng đều: `low = value - spread`, `high = value + spread`. |
| `samples` | `number[]` | Các lần đo thật, mỗi lần một chấm nhỏ, nằm đúng độ cao bên trong đài phun. |
| `forecast` | `boolean` | Một kỳ dự báo: thân và viền đứt nét, phần tô nhạt hơn, chấm lớn rỗng, không có chấm nhỏ và không có số đếm. |
| `color` | `string` | Màu riêng cho mục. Thứ tự cho mỗi tia: `colorsMapping[label]`, rồi `color`, rồi màu bảng màu của nhãn. |
| `date` | `number \| string` | Vị trí trên trục x ở chế độ xu hướng; mục không có ngày dùng được sẽ bị bỏ qua ở đó. |
| `predicted` | `boolean` | Đã lỗi thời: dùng `forecast`. Vẫn được xử lý. |
| `certainty` | `boolean` | Đã lỗi thời: `certainty: false` tương đương `forecast: true`. Vẫn được xử lý. |
| `density` | `number` | Đã lỗi thời và bị bỏ qua (cảnh báo `ignored-option`). |
| `lean` | `number` | Đã lỗi thời và bị bỏ qua (cảnh báo `ignored-option`). |

Khoảng được lấy theo thứ tự: `low`/`high`, rồi `spread`, rồi lần đo thấp nhất và cao nhất; không có cái nào thì tia không có đài phun. Một đầu bị thiếu cũng theo thứ tự đó. Lần đo nằm ngoài khoảng đã cho, và giá trị nằm ngoài khoảng, sẽ nới rộng khoảng và gửi một cảnh báo. Giá trị âm vẫn được: miền y bao gồm 0 và mọi `low`, và thân chạy xuống từ đường gốc.

### Đường tham chiếu: `FountainReferenceLine` {#reference-line}

| Trường | Kiểu | Ý nghĩa |
| --- | --- | --- |
| `value` | `number` | Vị trí của đường, theo đơn vị trục y. Luôn nằm trong miền y tự động. |
| `label` | `string` | Ghi ở đầu bên phải của đường (tự xuống dòng; biểu đồ chừa lề phải). |
| `goodSide` | `"below" \| "above"` | Phía nào là tốt. Khi có, mỗi tia có lần đo sẽ đếm chúng: "below" đếm các lần đo bằng hoặc dưới đường, "above" đếm các lần bằng hoặc trên đường. |
| `countLabel` | `string` | Chữ sau số đếm, ví dụ "đúng giờ", "đạt". Mặc định là "below the line" hoặc "above the line". |

### Từ ngữ: `FountainLabels` {#labels}

| Trường | Mặc định | Hiện ở đâu |
| --- | --- | --- |
| `usual` | `"usual"` | Trước giá trị của chấm lớn: "usual 30". |
| `of` | `"of"` | Giữa số đếm và tổng: "17 of 20". |
| `only` | `"only"` | Trước một số lần đo ít: "only 5 days". |
| `forecast` | `"forecast"` | Sau nhãn x của một tia dự báo và trong tooltip của nó: "Fri (forecast)". |

## Biến giao diện {#theme}

Biểu đồ đọc các biến CSS này từ phần tử chứa nó (hoặc một phần tử cha), với mọi trình vẽ:

| Biến | Mặc định | Tô màu cho |
| --- | --- | --- |
| `--michi-vz-surface` | `#fff` | Nền mà biểu đồ nằm trên: viền mảnh quanh mỗi chấm nhỏ và viền quanh chấm lớn, giúp tách chúng khỏi những gì nằm bên dưới. Với giao diện tối, hãy đặt nó bằng màu nền của trang. |
| `--michi-vz-attention` | `#c0392b` | Các đường tham chiếu, nhãn của chúng và các số đếm dưới cột. |
| `--michi-vz-lake` | `#9cc3dd` | Dải ở mức 0 (mặt hồ). |
| `--michi-vz-ink` | `currentColor` | Đường xu hướng, dòng in đậm « usual 30 » và tiêu đề. |
| `--michi-vz-muted` | `#666` | Các nhãn giá trị khác, tiêu đề trục y, hướng dẫn đọc và nhãn trục. |
| `--michi-vz-grid` | `lightgray` | Vạch mảnh phía trên hướng dẫn đọc. |
| `--michi-vz-font-family`, `--michi-vz-font-size` | kế thừa, `12px` | Mọi chữ mà biểu đồ in ra. |

Chấm lớn rỗng của một dự báo là một vòng tròn không tô gì bên trong (những gì nằm bên dưới bị cắt bỏ), nên nó vẫn rỗng trên mọi nền mà không cần biến nào.

```css
/* Các biểu đồ trên một trang nền tối */
.dark .charts {
  --michi-vz-surface: #1b1b1f;
  --michi-vz-ink: #e3e3e3;
  --michi-vz-muted: #a0a0a0;
}
```

## Sự kiện

Web component phát ra các `CustomEvent` nổi bọt (bubbling) sau đây (engine cũng cung cấp các sự kiện tương tự qua các callback `on*` trong bảng ở trên):

| Sự kiện | Chi tiết | Kích hoạt khi |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | tia đang rê chuột thay đổi (nhãn của nó) |
| `michi-vz:colormapping` | `Record<string, string>` | một ánh xạ màu được tạo ra |
| `michi-vz:dataprocessed` | `ChartContext` | dữ liệu được xử lý (lại) |
| `michi-vz:datawarning` | `DataWarning[]` | phát hiện cảnh báo về dữ liệu đầu vào (xem [Cảnh báo](#warnings)) |

## getContext()

`mountFountainChart(el, props).getContext()` trả về **`FountainChartContext`** không phụ thuộc renderer:

- **`mode`**: `"snapshot"` khi trục x theo danh mục (band), `"trend"` khi trục x theo thời gian hoặc số.
- **`xAxis`**: `{ type, domain }`, là nhãn các cột ở chế độ ảnh chụp nhanh hoặc `[min, max]` ở chế độ xu hướng. **`yAxis`**: `{ domain }`.
- **`jets`**: mỗi tia đã vẽ một mục (theo thứ tự x ở chế độ xu hướng):

| Trường | Ý nghĩa |
| --- | --- |
| `label`, `code`, `color` | Nhãn của tia, mã tùy chọn và màu cuối cùng. |
| `value` | Chấm lớn. |
| `low`, `high` | Đáy và đỉnh của đài phun; `null` nếu không có khoảng. |
| `range` | `high - low`; `null` nếu không có khoảng. |
| `rangeRatio` | `range / \|value\|`: khoảng lớn cỡ nào so với con số. `null` khi giá trị bằng 0 hoặc không có khoảng. |
| `sampleCount` | Số chấm nhỏ. |
| `referenceCounts` | Mỗi đường tham chiếu có `goodSide` một `{ value, goodSide, count, total, countLabel }`; `[]` với tia dự báo hoặc tia không có lần đo. |
| `predicted` | `true` với tia dự báo. |
| `xPosition` | `date` gốc ở chế độ xu hướng, `null` ở chế độ ảnh chụp nhanh. |
| `spread` | Đã lỗi thời: `(high - low) / 2`, 0 nếu không có khoảng. Dùng `range`. |
| `spreadRatio` | Đã lỗi thời: `spread / \|value\|`, 0 nếu không tính được. Dùng `rangeRatio`. |
| `upperBound` | Đã lỗi thời: `high` (hoặc giá trị nếu không có khoảng). Dùng `high`. |
| `lean` | Đã lỗi thời: luôn là `null`. |

- **`stats`**:
  - `jetCount`: số tia đã vẽ.
  - `tallest`: `{ label, value }` của giá trị lớn nhất, hoặc `null`.
  - `widestRange`: `{ label, range }` của khoảng rộng nhất, hoặc `null` nếu không tia nào có khoảng.
  - `frothiest`: đã lỗi thời. `{ label, spreadRatio }` của tia có `rangeRatio` lớn nhất. Dùng `widestRange` hoặc `jets[].rangeRatio`.
  - `trendSlope`: độ dốc (bình phương tối thiểu) của các giá trị theo kỳ (chế độ xu hướng, một chuỗi); ngược lại là `null`.
  - `valueRange`: `[min, max]` của các giá trị, hoặc `null`.
  - `predictedCount`: số tia dự báo.
- **`legendData`**: mọi nhãn của toàn bộ `dataSet` kèm màu, theo thứ tự xuất hiện; nhãn bị tắt vẫn giữ chỗ, đánh dấu `disabled: true`. Ở chế độ xu hướng chỉ có khi nhiều hơn một chuỗi.
- **`summary`**: một câu bằng lời đơn giản (tiếng Anh), ví dụ `Fountain chart "How long is my commute, really?" with 4 jets. Highest usual value: Bus at 40. Widest range: Car, from 22 to 55.`
- **`a11yTable`**: các cột `Label`, `Usual`, hai từ `endLabels`, `Samples`, và mỗi đường tham chiếu có `goodSide` một cột (tiêu đề là `countLabel`, ô dạng `"17 of 20"`); chế độ xu hướng thêm `Period` ở đầu. Nhãn của tia dự báo có thêm "(forecast)" phía sau: hàng của nó ở chế độ xu hướng là `["Year 4", "Battery (forecast)", …]`.

Xem [ngữ cảnh LLM](/vi/guide/llm-context) để biết cách dùng context trong prompt và báo cáo.

## Cảnh báo {#warnings}

`onDataWarning` (và sự kiện `michi-vz:datawarning`) nhận `DataWarning[]`, mỗi cảnh báo là `{ type, message, label? }`. Biểu đồ không bao giờ lặng lẽ vẽ khác dữ liệu: mọi chỉnh sửa đều được báo.

| `type` | Khi nào | Biểu đồ làm gì |
| --- | --- | --- |
| `non-finite-value` | Một mục không có `value` hữu hạn và không có lần đo, hoặc có lần đo không hữu hạn. | Bỏ qua tia (cũng không tính vào stats), hoặc bỏ các lần đo đó. Thiếu giá trị nhưng có lần đo thì dùng trung vị. |
| `range-excludes-value` | `low`/`high` (hoặc `spread`) để giá trị nằm ngoài. | Nới rộng khoảng để chứa giá trị. |
| `sample-outside-range` | Một lần đo nằm ngoài khoảng đã cho. | Nới rộng khoảng để chứa lần đo đó. |
| `inverted-range` | `low` cao hơn `high`, hoặc `spread` âm. | Đổi chỗ hai đầu (dùng độ lớn của spread). |
| `missing-date` | Chế độ xu hướng nhưng mục không có `date` dùng được. | Bỏ qua mục (biểu đồ vẫn ở chế độ xu hướng). |
| `duplicate-date` | Hai tia cùng một ngày ở chế độ xu hướng. | Vẽ chồng lên nhau. |
| `duplicate-label` | Một nhãn lặp lại ở chế độ ảnh chụp nhanh. | Các tia dùng chung một cột. |
| `out-of-domain` | Một giá trị, một đầu khoảng hay một lần đo nằm ngoài `yAxisDomain` do bạn đặt, hoặc một đường tham chiếu nằm ngoài. | Giới hạn hình vẽ trong vùng biểu đồ; chấm nhỏ và đường nằm ngoài không được vẽ. |
| `ignored-option` | Một prop đã bỏ được đặt, hoặc một mục có `density` hay `lean`. | Bỏ qua nó. |
| `empty-dataset` | `dataSet` rỗng. | Hiện lớp phủ không có dữ liệu ("No data available", `noDataLabel` của bạn, hoặc lớp phủ riêng của bạn với `suppressDefaultOverlay`) thay cho trục và các mark. `isNodata: false` vẽ trục rỗng. |
| `layout-overflow` | Mỗi tia có chưa tới 24 px, hoặc nhãn giá trị không vừa (cột hẹp, nhãn x phải xoay nghiêng, nhiều tia chung một cột, hoặc biểu đồ quá thấp). | Vẫn vẽ các tia và bỏ những nhãn giá trị không vừa, bỏ từ cho hai đầu trước. Hãy làm biểu đồ rộng hơn, bớt tia hoặc gộp lại. |

## Lỗi thời {#deprecations}

Tất cả những thứ sau vẫn chạy trong core 1.29 và sẽ bị xóa ở một phiên bản sau. Xem [Chuyển từ core 1.28](/vi/charts/fountain#migrating).

- **Props, bị bỏ qua kèm cảnh báo `ignored-option`:** `style`, `frothLayers`, `bloomExponent`, `stemFraction`, `showDroplets`, `showMist`. Trên web component: `fountainStyle` (`fountain-style`).
- **Trường của mục:** `predicted` và `certainty` vẫn được xử lý; hãy dùng `forecast`. `density` và `lean` bị bỏ qua kèm cảnh báo.
- **Trường của context:** `jets[].spread`, `jets[].spreadRatio`, `jets[].upperBound` và `jets[].lean` (luôn là `null`); `stats.frothiest`. Hãy dùng `range`, `rangeRatio`, `high` và `stats.widestRange`.

## Nguồn

Các props được định kiểu là [`FountainChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) trong `@michi-vz/core`.
