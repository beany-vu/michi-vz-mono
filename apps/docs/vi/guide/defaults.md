# Giá trị mặc định cho toàn ứng dụng

`setMichiVzDefaults` đặt giao diện khởi đầu cho mọi biểu đồ, một lần cho cả ứng dụng: bảng màu, phông chữ, góc bo của thanh và ô, và tooltip. Đây là tương đương của `Highcharts.setOptions` trong michi-vz, và hoạt động giống nhau trong React, Vue, Svelte, Angular và web component.

```ts
import { setMichiVzDefaults } from "@michi-vz/core"; // mọi gói framework cũng export hàm này

setMichiVzDefaults({
  colors: ["#1A657D", "#3E75B0", "#21B6A8"],
  fontFamily: "Roboto",
  barRadius: 0,
  tileRadius: 0,
  tooltip: { borderRadius: 0, shadow: false },
});
```

Gọi hàm trước khi biểu đồ đầu tiên được gắn, ví dụ cạnh điểm khởi chạy của ứng dụng. Mỗi lần gọi được gộp vào lần trước, và `resetMichiVzDefaults()` đưa về giao diện có sẵn.

## Giá trị nào được ưu tiên

Prop trên biểu đồ luôn được ưu tiên. Tiếp theo là giá trị mặc định của ứng dụng, rồi đến giao diện có sẵn. Vì vậy `<TreemapChart tileRadius={6} />` vẫn giữ góc 6 px dù giá trị mặc định là 0.

## Tuỳ chọn

| Tuỳ chọn | Áp dụng cho | Có sẵn |
|---|---|---|
| `colors` | mọi biểu đồ không có prop `colors`, và chú giải của nó | 20 màu của `DEFAULT_COLORS` |
| `fontFamily` | mọi chữ trong biểu đồ, với svg, canvas và webgpu | kế thừa từ trang |
| `barRadius` | biểu đồ thanh so sánh (ngang và dọc) | 5 |
| `tileRadius` | các ô của Treemap | 1 |
| `tooltip.borderRadius` | mọi tooltip, tính bằng px | 4 |
| `tooltip.shadow` | `false` (không có), `true` (có sẵn) hoặc một giá trị css `box-shadow` | bóng nhẹ |
| `tooltip.background`, `tooltip.borderColor`, `tooltip.color` | mọi tooltip | trắng, `#ccc`, kế thừa |
| `tooltip.fontSize` | mọi tooltip, tính bằng px | `--michi-vz-font-size` (12) |

## Giống nhau ở mọi trình kết xuất

Mỗi giá trị mặc định được xác định trước khi vẽ: bảng màu và bán kính góc nằm trong mô hình dữ liệu của biểu đồ, phông chữ và tooltip là biến css trên biểu đồ. Vì vậy `renderer="svg"`, `"canvas"` và `"webgpu"` vẽ cùng màu và cùng góc, và tooltip là cùng một phần tử ở mọi nơi.

Các giá trị tooltip trở thành biến css (`--michi-vz-tooltip-radius`, `--michi-vz-tooltip-shadow`, `--michi-vz-tooltip-bg`, `--michi-vz-tooltip-border`, `--michi-vz-tooltip-color`, `--michi-vz-tooltip-font-size`), nên stylesheet vẫn có thể ghi đè chúng cho một trang.
