# Provider & trạng thái dùng chung

`@michi-vz/react` cung cấp một lớp React context - `MichiVzProvider` + `useChartContext` -
cho phép một cây biểu đồ chia sẻ màu sắc, tô nổi bật, và trạng thái hiển thị mà không cần
truyền props qua nhiều tầng (prop-drilling).

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

Mọi prop đều là tùy chọn. Provider hợp nhất chúng vào mỗi biểu đồ trong cây thông qua `resolveEffectiveProps`.

### Props

| Prop | Type | Mục đích |
|---|---|---|
| `colorsMapping` | `Record<string, string>` | Ánh xạ nhãn → màu hex. Được áp dụng cho các mark và được probe canvas đọc. |
| `highlightItems` | `string[]` | Các nhãn được vẽ ở độ mờ đục đầy đủ; các nhãn khác bị làm mờ đi. |
| `disabledItems` | `string[]` | Các nhãn bị ẩn hoàn toàn khỏi biểu đồ. |
| `hiddenItems` | `string[]` | Các nhãn bị loại khỏi việc render (phần bù của `visibleItems`). |
| `visibleItems` | `string[]` | Danh sách cho phép tường minh; các nhãn ngoài danh sách này bị ẩn. |
| `fontFamily` | `string` | Thiết lập `--michi-vz-font-family` để văn bản SVG và văn bản canvas khớp nhau. Font phải đã được trang tải sẵn. |
| `singlePointLine` | `boolean \| SinglePointLineConfig` | Cách render một chuỗi dữ liệu chỉ có một điểm (chấm, đoạn ngắn, v.v.). |
| `categoryMetadata` | `Record<string, { color?: string; label?: string }>` | Ghi đè màu/nhãn theo từng danh mục. |
| `colorsBasedMapping` | `Record<string, string>` | Hợp đồng màu thứ cấp (ví dụ cho phần tô của area so với đường viền). |
| `locale` | `string` | Locale theo chuẩn BCP-47 được chuyển tiếp tới các bộ định dạng trục (ví dụ `"fr"`, `"ar"`). |
| `dir` | `"ltr" \| "rtl"` | Hướng văn bản. `"rtl"` lật ngược các trục nằm ngang. |

Bên dưới, `MichiVzProvider` tạo một `MichiVzStore` (thông qua `createMichiVzStore` từ `@michi-vz/core`) ở lần render đầu tiên, đồng bộ lại khi props thay đổi. Store không phụ thuộc framework; một coordinator web component trong tương lai có thể dùng chung cùng một instance store này.

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

`useChartContext` đăng ký (subscribe) thông qua `useSyncExternalStore` - các cập nhật không bị xé hình (tear-free) dưới chế độ render đồng thời (concurrent). Khi không có `MichiVzProvider` nào trong cây, nó trả về các giá trị mặc định rỗng an toàn (`colorsMapping: {}`, `highlightItems: []`, v.v.) nên bạn không bao giờ đọc phải `undefined`.

## Hợp đồng màu legendData

Đối với **biểu đồ canvas**, engine không thể đọc trực tiếp các biến CSS tại thời điểm vẽ -
thay vào đó nó dùng một probe `getComputedStyle`. Khi một biểu đồ được render với
`skipColorMappingDispatch` (consumer kiểm soát màu sắc, không phải engine), quy trình phân
quyền màu sắc là:

1. Engine điền dữ liệu vào `ChartContext.legendData` sau khi xử lý dữ liệu. Mỗi mục là một `LegendItem`:

   ```ts
   type LegendItem = {
     label: string;        // human label (e.g. "Sub-Saharan Africa")
     color: string;        // resolved colour at render time
     order: number;        // appearance order in the series
     disabled?: boolean;
     dataLabelSafe: string; // sanitizeForClassName(label) → "sub-saharan-africa"
   };
   ```

2. Một cơ quan màu sắc phía consumer đọc `legendData` từ `onChartDataProcessed(ctx)` và phát ra CSS nhắm vào thuộc tính `data-label-safe`:

   ```css
   /* emitted by your colour authority into a <style> block */
   .line[data-label-safe="sub-saharan-africa"] { stroke: #4a90d9; }
   .line[data-label-safe="north-africa"]       { stroke: #e8a838; }
   ```

3. Ở lần vẽ tiếp theo, probe canvas gọi `getComputedStyle` trên phần tử SVG tương ứng và đọc màu sắc - không còn vấn đề thanh bị trong suốt/mờ đục.

Trường `dataLabelSafe` được tạo ra bởi `sanitizeForClassName` từ `@michi-vz/core` và ổn định qua các lần render với cùng một chuỗi nhãn.

::: tip Danh sách kiểm tra màu sắc cho canvas
Với biểu đồ canvas (`renderer="canvas"` + `skipColorMappingDispatch`) bạn cần **cả hai**:

- Một khối `<style>{cssFromLegendData}</style>` trong JSX của bạn - thiếu nó thì mọi thanh sẽ render trong suốt.
- Mount không điều kiện + remount theo key (`key={chartKey}`) thay vì `{ready && <Chart />}` - mount có điều kiện ngăn `isNodataComponent` kích hoạt khi dữ liệu rỗng.
:::

## Chuyển đổi từ gói `michi-vz` độc lập

Các gói trong mono-repo (`@michi-vz/core` + `@michi-vz/react`) là một siêu tập thay thế
trực tiếp (drop-in superset) cho gói npm `michi-vz` cũ. Hầu hết thay đổi đều mang tính bổ
sung; bảng dưới đây bao quát những phần khác biệt.

### Đường dẫn import

| `michi-vz` cũ | Mono `@michi-vz/react` |
|---|---|
| `import { MichiVzProvider } from "michi-vz"` | `import { MichiVzProvider } from "@michi-vz/react"` |
| `import { useChartContext } from "michi-vz"` | `import { useChartContext } from "@michi-vz/react"` |
| `import { ScatterPlotChart } from "michi-vz"` | `import { ScatterPlotChart } from "@michi-vz/react"` (vẫn giữ alias) |

### Alias ScatterPlotChart

Biểu đồ được đổi tên thành `ScatterChart` trong mono. `ScatterPlotChart`,
`ScatterPlotChartProps`, và `ScatterPlotChartHandle` đều được re-export dưới dạng alias
nên các import hiện có vẫn biên dịch được mà không cần thay đổi.

### legendData

Trong gói cũ, `legendData` nằm trên `ChartMetadata` và chỉ có sẵn ở một số biểu đồ nhất
định. Trong mono, nó là một trường hạng nhất trên `ChartContext` (được trả về bởi
`chart.getContext()` và truyền vào `onChartDataProcessed`) và hiện được `LineChart` điền
dữ liệu, các loại biểu đồ khác sẽ theo sau.

### Không cần import CSS

Gói cũ yêu cầu một `import "michi-vz/dist/style.css"` riêng biệt. Mono tự động chèn CSS
layout/overlay thông qua `ensureStyles()` tại thời điểm mount - hãy xóa import đó nếu bạn
có. CSS màu sắc (fill/stroke) vẫn là hợp đồng của bạn, như trước đây.

### Sự tương đồng Provider / useChartContext

`MichiVzProvider` chấp nhận chính xác các props lõi giống như trước (`colorsMapping`,
`highlightItems`, `disabledItems`, `fontFamily`, `singlePointLine`), cộng thêm các bổ sung
mới (`hiddenItems`, `visibleItems`, `categoryMetadata`, `colorsBasedMapping`, `locale`,
`dir`). `useChartContext` trả về một siêu tập của `MichiVzState` cũ - các destructure hiện
có vẫn an toàn.
