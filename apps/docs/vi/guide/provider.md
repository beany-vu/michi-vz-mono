# Provider & trạng thái dùng chung

`@michi-vz/react` có một lớp React context, `MichiVzProvider` + `useChartContext`, cho phép
cả cây biểu đồ chia sẻ màu sắc, highlight, và trạng thái hiển thị mà không phải truyền prop
qua nhiều tầng (prop-drilling).

## MichiVzProvider

Bọc một subtree để chia sẻ trạng thái trên mọi biểu đồ bên trong nó:

```tsx
import { MichiVzProvider, LineChart } from "@michi-vz/react";

export default function Dashboard() {
  return (
    <MichiVzProvider
      colorsMapping={{ North: "#b23a2e", South: "#4a90d9" }}
      highlightItems={["North"]}
    >
      <LineChart dataSet={dataSet} xAxisDataType="date_annual" />
    </MichiVzProvider>
  );
}
```

Mọi prop đều tùy chọn (optional). Provider hợp nhất chúng vào từng biểu đồ trong cây qua `resolveEffectiveProps`.

### Props

| Prop | Type | Mục đích |
|---|---|---|
| `colorsMapping` | `Record<string, string>` | Ánh xạ nhãn → màu hex. Áp dụng cho các mark, và probe canvas đọc luôn giá trị này. |
| `highlightItems` | `string[]` | Vẽ các nhãn này ở độ mờ đục đầy đủ; nhãn khác bị làm mờ đi. |
| `disabledItems` | `string[]` | Ẩn hoàn toàn các nhãn này khỏi biểu đồ. |
| `hiddenItems` | `string[]` | Loại các nhãn này khỏi render (phần bù của `visibleItems`). |
| `visibleItems` | `string[]` | Danh sách cho phép tường minh; nhãn nào không có trong danh sách sẽ bị ẩn. |
| `fontFamily` | `string` | Set `--michi-vz-font-family` để text SVG và text canvas khớp nhau. Font phải được trang load sẵn từ trước. |
| `singlePointLine` | `boolean \| SinglePointLineConfig` | Cách render một chuỗi chỉ có một điểm dữ liệu (chấm, đoạn ngắn, v.v.). |
| `categoryMetadata` | `Record<string, { color?: string; label?: string }>` | Ghi đè màu/nhãn theo từng category. |
| `colorsBasedMapping` | `Record<string, string>` | Hợp đồng màu phụ (ví dụ cho phần tô của area so với đường viền). |
| `locale` | `string` | Locale chuẩn BCP-47, chuyển tiếp tới bộ định dạng trục (ví dụ `"fr"`, `"ar"`). |
| `dir` | `"ltr" \| "rtl"` | Hướng văn bản. `"rtl"` lật ngược các trục nằm ngang. |

Bên dưới, `MichiVzProvider` tạo một `MichiVzStore` (qua `createMichiVzStore` từ `@michi-vz/core`) ở lần render đầu tiên, rồi đồng bộ lại mỗi khi prop thay đổi. Store này không phụ thuộc framework; sau này một coordinator web component có thể dùng chung đúng instance store đó.

## useChartContext

Đọc trạng thái dùng chung hiện tại từ bất kỳ đâu bên trong cây provider:

```tsx
import { useChartContext } from "@michi-vz/react";

function MyLegend() {
  const { colorsMapping, disabledItems } = useChartContext();
  return (
    <ul>
      {Object.entries(colorsMapping).map(([label, color]) => (
        <li key={label} style={{ opacity: disabledItems.includes(label) ? 0.3 : 1 }}>
          <span style={{ background: color, width: 12, height: 12, display: "inline-block" }} />
          {label}
        </li>
      ))}
    </ul>
  );
}
```

`useChartContext` subscribe qua `useSyncExternalStore` nên các update không bị xé hình
(tear-free) khi render ở chế độ concurrent. Không có `MichiVzProvider` nào trong cây thì
nó trả về giá trị mặc định rỗng an toàn (`colorsMapping: {}`, `highlightItems: []`, v.v.)
nên bạn không bao giờ phải đọc `undefined`.

## Hợp đồng màu legendData

Với **biểu đồ canvas**, engine không đọc trực tiếp biến CSS lúc vẽ được, nên nó dùng một
probe `getComputedStyle` thay thế. Khi biểu đồ render với `skipColorMappingDispatch`
(consumer tự kiểm soát màu, không phải engine), luồng phân quyền màu chạy như sau:

1. Engine điền `ChartContext.legendData` sau khi xử lý xong dữ liệu. Mỗi mục là một `LegendItem`:

   ```ts
   type LegendItem = {
     label: string;        // human label (e.g. "Sub-Saharan Africa")
     color: string;        // resolved colour at render time
     order: number;        // appearance order in the series
     disabled?: boolean;
     dataLabelSafe: string; // sanitizeForClassName(label) → "sub-saharan-africa"
   };
   ```

2. Logic quyết định màu (colour authority) phía consumer đọc `legendData` từ `onChartDataProcessed(ctx)` rồi phát ra CSS nhắm vào thuộc tính `data-label-safe`:

   ```css
   /* emitted by your colour authority into a <style> block */
   .line[data-label-safe="sub-saharan-africa"] { stroke: #4a90d9; }
   .line[data-label-safe="north-africa"]       { stroke: #e8a838; }
   ```

3. Ở lần vẽ tiếp theo, probe canvas gọi `getComputedStyle` trên phần tử SVG tương ứng và đọc màu sắc - không còn vấn đề thanh bị trong suốt/mờ đục.

`sanitizeForClassName` từ `@michi-vz/core` tạo ra trường `dataLabelSafe`, và giá trị này ổn định qua các lần render nếu cùng một chuỗi nhãn.

::: tip Danh sách kiểm tra màu sắc cho canvas
Với biểu đồ canvas (`renderer="canvas"` + `skipColorMappingDispatch`) bạn cần **cả hai**:

- Một khối `<style>{cssFromLegendData}</style>` trong JSX của bạn - thiếu nó thì mọi thanh sẽ render trong suốt.
- Mount không điều kiện + remount theo key (`key={chartKey}`) thay vì `{ready && <Chart />}` - mount có điều kiện ngăn `isNodataComponent` kích hoạt khi dữ liệu rỗng.
:::

## Chuyển đổi từ gói `michi-vz` độc lập

Các package trong mono-repo (`@michi-vz/core` + `@michi-vz/react`) là bản superset thay
trực tiếp (drop-in) cho package npm `michi-vz` cũ. Hầu hết thay đổi chỉ là bổ sung; bảng
dưới đây liệt kê những phần khác đi.

### Đường dẫn import

| `michi-vz` cũ | Mono `@michi-vz/react` |
|---|---|
| `import { MichiVzProvider } from "michi-vz"` | `import { MichiVzProvider } from "@michi-vz/react"` |
| `import { useChartContext } from "michi-vz"` | `import { useChartContext } from "@michi-vz/react"` |
| `import { ScatterPlotChart } from "michi-vz"` | `import { ScatterPlotChart } from "@michi-vz/react"` (vẫn giữ alias) |

### Alias ScatterPlotChart

Trong mono, biểu đồ này đổi tên thành `ScatterChart`. `ScatterPlotChart`,
`ScatterPlotChartProps`, và `ScatterPlotChartHandle` vẫn được re-export như alias, nên các
import cũ vẫn biên dịch được mà không cần sửa gì.

### legendData

Ở package cũ, `legendData` nằm trên `ChartMetadata` và chỉ vài biểu đồ có. Trong mono, nó
là một field chính thức trên `ChartContext` (`chart.getContext()` trả về, và cũng truyền
vào `onChartDataProcessed`); hiện tại `LineChart` đã điền dữ liệu vào đây, các biểu đồ
khác sẽ theo sau.

### Không cần import CSS

Package cũ cần một `import "michi-vz/dist/style.css"` riêng. Mono tự chèn CSS layout/
overlay qua `ensureStyles()` ngay lúc mount, nên bạn xóa import đó đi nếu còn. CSS màu sắc
(fill/stroke) vẫn là hợp đồng của bạn, như trước.

### Provider / useChartContext tương đồng

`MichiVzProvider` nhận đúng các prop lõi như trước (`colorsMapping`, `highlightItems`,
`disabledItems`, `fontFamily`, `singlePointLine`), cộng thêm các prop mới (`hiddenItems`,
`visibleItems`, `categoryMetadata`, `colorsBasedMapping`, `locale`, `dir`). `useChartContext`
trả về một superset của `MichiVzState` cũ, nên code destructure hiện có vẫn chạy an toàn.
