---
title: DevTools - kiểm tra, điều khiển, và chỉnh sửa bất kỳ biểu đồ nào
---

# Nhìn vào bên trong biểu đồ của bạn

Biểu đồ vẽ ra pixel, nhưng lỗi thường nằm ở **trạng thái đứng sau những pixel đó**: dữ liệu
thật sự đến engine là gì, domain của trục ra sao, host đo biểu đồ theo kích thước nào, và
điểm nào là *đã quan sát* so với *dự báo*. `@michi-vz/devtools` là một bảng điều khiển
opt-in, chạy ngay trong trang, cho bạn thấy hết những thứ đó với **mọi** biểu đồ michi-vz
trên trang. Không cần cài extension trình duyệt nào cả: chỉ một dòng import, versioned
cùng app của bạn.

<DevtoolsDemo />

> Nhấp **Mount devtools**: lá chắn Michi nổi hiện ra ở góc dưới bên phải, đó là bộ mặt thu
> gọn của devtools. Nhấp vào nó (hoặc nhấn `Ctrl/Cmd+Shift+M`) để mở bảng điều khiển, chọn
> biểu đồ trong danh sách, rồi lướt qua các tab: **Overview** (context, chuỗi dữ liệu, sửa
> trực tiếp), **Sizing**, **Scales**, **Diff**, **Hit-test**, **Profiler**, **A11y**, và
> **Insights**, nơi ✦ **Narrate** và ✦ **Detect anomalies** chạy đúng plugin
> `@michi-vz/insights` trên biểu đồ đang sống (đợt tăng vọt Cost năm 2022 sẽ bị gắn cờ, cứ
> highlight nó từ kết quả). Đây là gói thật, chạy ngay trong trình duyệt của bạn.

## Bắt đầu nhanh

```bash
npm i -D @michi-vz/devtools
```

```ts
import { mountDevtools } from "@michi-vz/devtools";

// Call this BEFORE mounting charts so they register themselves.
// The floating Michi shield button appears; click it (or Ctrl/Cmd+Shift+M) to open the panel.
const devtools = mountDevtools();

import { mountLineChart } from "@michi-vz/core";
mountLineChart(host, { dataSet, xAxisDataType: "number" });

// later
devtools.destroy();
```

Dùng React? Chỉ cần một dòng để mount devtools ngay trong cây component mà không render gì
ra DOM (mặc định chỉ chạy ở môi trường dev; build production sẽ loại hẳn chunk devtools):

```tsx
import { MichiVzDevtools } from "@michi-vz/react";

<MichiVzDevtools />
```

Với Vue, Svelte, Angular, hay web component thuần, công thức vẫn y hệt, ba dòng: gọi
`mountDevtools()` trong hook mount của component gốc, gọi `destroy()` lúc unmount. Còn nếu
build nào cũng cần devtools tắt hẳn mà không phải đổi chỗ import, dùng entry point
`@michi-vz/devtools/production`, nó export ra một `mountDevtools` no-op, không làm gì cả.

## Nút nổi

Mount devtools không bao giờ che app của bạn: nó chỉ là một **lá chắn Michi** nhỏ (huy
hiệu của thư viện) nằm ở một góc màn hình. Nhấp vào đó để mở bảng điều khiển, đóng bảng để
thu lại thành nút, và trạng thái mở/đóng **tự nhớ theo từng trình duyệt**: tải lại trang,
devtools sẽ về đúng trạng thái bạn để lại. Góc màn hình đang bị một chat widget hay nút
devtools khác chiếm chỗ? Cứ **kéo lá chắn đi bất kỳ đâu**, vị trí đó cũng được nhớ luôn.
`buttonPosition` chọn góc khởi đầu.

`mountDevtools(options?)` trả về một handle:
`{ open, close, toggle, isOpen, refresh, getRoot, destroy }`.

| Option           | Mặc định            | Ghi chú                                                                    |
| ---------------- | ------------------ | ------------------------------------------------------------------------ |
| `container`      | `document.body`    | Nơi gắn shadow host của bảng điều khiển.                               |
| `open`           | tự nhớ         | Ép cứng `true`/`false`; mặc định khôi phục trạng thái lần trước, đóng ở lần chạy đầu. |
| `hotkey`         | `Ctrl/Cmd+Shift+M` | Đặt `null` để tắt phím tắt.                                       |
| `theme`          | `"auto"`           | `"auto"` theo `prefers-color-scheme`; hoặc ép cứng `"dark"` / `"light"`.  |
| `buttonPosition` | `"bottom-right"`   | Góc khởi đầu cho nút; nếu bạn đã kéo nút đi thì vị trí đó được ưu tiên ở các lần mount sau.     |

Bảng điều khiển render bên trong **Shadow DOM** riêng, nên style của nó không rò vào app
của bạn (và CSS của app cũng không phá được bảng điều khiển). Bản thân các biểu đồ vẫn ở
light DOM; bảng điều khiển không bao giờ đụng vào hợp đồng màu sắc.

Đang xem một context lớn hay một bảng chuỗi dài? **Kéo góc trên-trái của bảng điều khiển**
để đổi kích thước (kích thước cũng tự nhớ theo trình duyệt), hoặc bấm nút **⛶** ở tiêu đề
để phóng to toàn màn hình rồi thu lại.

Dashboard có nhiều biểu đồ vẫn dễ quản lý: danh sách biểu đồ có một **ô lọc**, mỗi mục có
nút **◎ định vị** để cuộn biểu đồ vào tầm nhìn và nhấp nháy viền quanh nó; quá 8 biểu đồ
thì bảng điều khiển gộp các đợt cập nhật dồn dập lại thành một lần re-render, nên trang
bận rộn không bị chậm chỉ vì đang mở devtools. Bảng điều khiển không hề polling, nó chỉ
phản ứng theo sự kiện của hook, và snapshot lịch sử bỏ qua những biểu đồ mà context chưa
đổi.

## Các tab

### Sizing - "vì sao biểu đồ của tôi bị vô hình / tràn ra ngoài?"

Lỗi phổ biến nhất ở bất kỳ thư viện biểu đồ nào là lỗi kích thước: host bị đo ra `0×0` vì
nằm trong một tab đang ẩn, hoặc biểu đồ lấy kích thước từ `clientWidth` mà quên trừ padding
(đúng vậy, `clientWidth` **bao gồm** cả padding) nên nó tràn khỏi thẻ chứa. Tab Sizing hiện
hình chữ nhật đã render của host, client box, padding, cùng width/height mà biểu đồ đã yêu
cầu; nó gắn cờ chỗ lệch bằng ngôn ngữ thuần, và có sẵn công thức `ResizeObserver` để bạn
copy-paste, vì biểu đồ michi-vz có kích thước cố định theo thiết kế, còn responsive là việc
của host.

### Scales - "vì sao giá trị trục của tôi bị sai?"

Render thẳng domain `xAxis` / `yAxis` từ `ChartContext`, kèm kiểm tra hợp lý cho ba kiểu
lỗi kinh điển: domain ra `NaN` (một ngày hay giá trị parse hỏng), domain rộng bằng không
(mọi giá trị giống hệt nhau, mark bị sụp lại), và domain bị đảo ngược (truyền nhầm chiều
một prop domain thủ công). Biểu đồ không có trục (pie, sankey, treemap) sẽ nói rõ điều đó
thay vì hiện trống trơn.

### Diff - "điều gì đã thay đổi giữa hai lần render này?"

Bảng điều khiển chụp snapshot `ChartContext` của mỗi biểu đồ ở **mỗi lần cập nhật** và giữ
lại một lịch sử ngắn. Tab Diff so sánh sâu (deep-diff) hai snapshot gần nhất, ra một danh
sách thêm/xóa/đổi với đường dẫn chính xác (`series[0].max: 140 → 555`), nên câu "biểu đồ
của tôi trông khác mà tôi chẳng biết vì sao" chỉ còn là câu trả lời hai dòng. Lùi lại qua
thanh History thì diff cũng bám theo snapshot bạn đang xem.

### Insights - biểu đồ tự giải thích chính mình

Mỗi biểu đồ michi-vz đã có sẵn `summary` bằng ngôn ngữ thuần trong context của nó, đúng
đoạn văn mà một AI agent hay pipeline screen reader sẽ đọc. Tab Insights hiển thị nó trong
một bong bóng kiểu chat AI, và khi bạn gắn [`@michi-vz/insights`](/vi/guide/insights) vào
biểu đồ, nó sẽ bật sáng các hành động chỉ-một-cú-nhấp mà `getTools()` phát hiện được:

- ✦ **Narrate**: `chart.use(narrate())`, tường thuật văn xuôi có tính xác định về trạng
  thái hiện tại.
- ✦ **Detect anomalies**: `chart.use(anomaly())`, gắn cờ các điểm ngoại lệ theo từng chuỗi;
  kết quả kèm nút **highlight** chỉ-một-cú-nhấp cho chuỗi bị gắn cờ, ngay trên biểu đồ đang
  sống.
- ✦ **Forecast**: `chart.use(forecast())`, các điểm dự phóng, độ chính xác, và mọi lần vượt
  ngưỡng.

Bất kỳ thứ gì khác mà một plugin cung cấp sẽ hiện dưới mục **Advanced** như một bộ chạy
tool thô (nhập tham số JSON, xuất kết quả JSON).

### Hit-test - "vì sao tooltip của tôi không kích hoạt?"

Mark canvas không có DOM, nên khi hover ngừng ăn thì chẳng có gì để soi trong tab Elements;
bạn không phân biệt được lỗi hit-test với một listener đã chết hay một vấn đề CSS
`pointer-events`. Tab Hit-test stream trực tiếp kết quả hit-test canvas của chính biểu đồ
theo thời gian thực: mỗi lần di chuột ghi lại tọa độ và mark tìm được (hay bỏ lỡ), cùng
một chỉ dấu xanh/đỏ bám theo sự kiện gần nhất ngay trên biểu đồ. Dấu hiệu chẩn đoán rõ nhất
là sự im lặng: hover mà log đứng yên nghĩa là listener canvas của biểu đồ đã chết.

### Profiler - "vì sao cái này lại chậm đi?"

Mỗi `update()` đều được đo thời gian ở ranh giới engine. Tab Profiler hiện thời lượng
render gần nhất/trung bình/tối đa cùng dải thanh theo từng lần cập nhật, và cảnh báo khi
thời gian render đang tăng dần lên; nghi phạm thường gặp là dữ liệu ngày càng lớn, prop
không memoize khiến re-render toàn phần, hoặc listener bị rò rỉ.

### A11y - kiểm toán mà không devtool biểu đồ nào khác làm

Các rule heuristic lấy cảm hứng từ Chartability chạy trên context đang sống: thiếu
`summary` bằng ngôn ngữ thuần (screen reader và AI agent chẳng nhận được gì), bảng a11y có
ít hàng hơn số chuỗi, hai chuỗi trùng màu (không phân biệt được nếu không nhìn thấy), và
màu chuỗi dưới tỷ lệ tương phản đồ họa 3:1 trên nền sáng hoặc tối. Dưới phần audit, tab
này còn render luôn bảng dữ liệu a11y thật, đúng những gì một screen reader nhận được.

### Overview - kiểm tra, điều khiển, chỉnh sửa

Bộ kiểm tra kinh điển: summary, thống kê theo từng chuỗi (kèm phần tách thực tế-so-với-dự-
đoán bên dưới), các nút chuyển highlight/tắt vá thẳng vào prop đang sống, và một trình sửa
JSON cho `dataSet`: sửa xong, nhấn **Apply**, xem biểu đồ re-render. Lỡ nghịch quá tay?
**Reset chart** đưa dataSet, trạng thái highlight, và trạng thái tắt về đúng lúc devtools
lần đầu thấy biểu đồ, mọi chỉnh sửa từ bảng điều khiển đều hoàn tác được trong một cú nhấp.

Tiện thể nói luôn: các hành động ✦ trên tab Insights **mặc định không dùng model ngôn ngữ
nào cả**, chúng chạy plugin insights của biểu đồ ngay tại chỗ (rule và thống kê có tính
xác định; tooltip mỗi hành động nói rõ nó tính cái gì). Không có gì tải xuống, không có gì
rời khỏi trang.

## Xuyên thời gian qua trạng thái

Khi một biểu đồ đã đổi nhiều hơn một lần, thanh **History** hiện ra: bấm `◀` / `▶` để lướt
qua các snapshot `ChartContext` trong quá khứ, xem chính xác trạng thái đã tiến triển ra
sao, hoặc bấm **● live** để về trạng thái mới nhất. Khi đang xem snapshot quá khứ, các điều
khiển chỉ đọc (bạn đang soi lịch sử, không điều khiển biểu đồ). Kết hợp với tab Diff, câu
hỏi "biểu đồ này trông thế nào ở lần cập nhật trước, và cái gì đã đổi?" chỉ mất vài giây để
trả lời.

## Thực tế so với dự đoán

Bảng điều khiển làm rõ **nguồn gốc** của một biểu đồ. Đánh dấu điểm dự báo bằng
`predicted: true` trên data point (vẫn tương thích ngược: nếu bỏ qua, nó tự suy từ
`certainty === false`, cờ này cũng dùng để vẽ đoạn nét đứt):

```ts
const dataSet = [{
  label: "Revenue",
  series: [
    { date: 2022, value: 104, certainty: true },                    // observed
    { date: 2023, value: 121, certainty: false, predicted: true },  // forecast
  ],
}];
```

Cờ đó chảy vào `ChartContext` của mỗi biểu đồ dưới dạng `actualCount`, `predictedCount`, và
`forecastStart` (theo từng chuỗi, trên Line, Fan, và Range), nên bảng điều khiển, và bất kỳ
AI agent nào đọc context, đều phân biệt được quá khứ với dự phóng mà không cần đoán qua nét
đứt.

Biểu đồ **Area** dạng chồng dùng chung một x cho mỗi ngày, nên ở đây `predicted` đặt trên
cả **hàng**, và hiện ra ở cấp biểu đồ dưới dạng `stats.actualRows`, `stats.predictedRows`,
và `stats.forecastStart`:

```ts
const series = [
  { date: 2022, cloud: 60, onprem: 44 },                  // observed
  { date: 2023, cloud: 78, onprem: 40, predicted: true }, // forecast row
];
```

> [!TIP] Ưu tiên `predicted` hơn `certainty` khi đánh dấu một dự báo.
> `certainty` cũng thành `false` với các **khoảng trống (gaps)** dữ liệu tự phát hiện
> (`detectGaps`), nên nó không phân biệt được một dự báo với một lỗ hổng dữ liệu.
> `predicted` thì rõ ràng, không mơ hồ.

**Phạm vi hỗ trợ.** Nguồn gốc dữ liệu là khái niệm thuộc về chuỗi thời gian, nên chỉ những
biểu đồ mà dự báo là chuyện tự nhiên mới có nó: **Line**, **Fan**, và **Range** (theo từng
chuỗi), và **Area** (theo từng hàng). Các biểu đồ theo danh mục, phần-so-với-tổng, và quan
hệ (stacked bar, bar-bell, comparable, dual, gap, pie/donut, bubble, sankey, treemap,
radar, scatter) không có trục dự báo, nên không mang cờ `predicted`.

## Vì sao không phải là một tiện ích mở rộng trình duyệt?

Bạn không cần cái đó. Mọi biểu đồ michi-vz đều ở **Light DOM** và đã tự cung cấp sẵn trạng
thái (`getContext()`, `getTools()`), nên một bảng điều khiển ngay trong trang đọc được mọi
thứ trực tiếp, không cần trung gian. Nhờ vậy devtools:

- **Không cần cài gì thêm**: chỉ một `import`, versioned cùng app của bạn.
- **Test được trước khi ship**: chạy trong jsdom/Playwright như bất kỳ module nào khác.
- **Không phụ thuộc framework**: phát hiện được cả instance `mountXChart()` kiểu mệnh lệnh
  *lẫn* web component `<michi-vz-*>`.
- **An toàn cho production**: đặt sau `process.env.NODE_ENV !== "production"` (component
  React đã lo sẵn việc này) hoặc import `@michi-vz/devtools/production`; dù cách nào thì
  user của bạn cũng không bao giờ tải nó về.

Một extension trình duyệt thật sự chỉ đáng làm sau này, để kiểm tra michi-vz trên các
trang **không** đóng gói module devtools. Nó sẽ tái dùng đúng cái hook này, nên không có gì
phí phạm ở đây cả.

## Cách nó hoạt động

`@michi-vz/core` có sẵn một hook nhỏ, opt-in. `mountDevtools()` gọi `enableDevtools()`, tạo
`globalThis.__MICHI_VZ_DEVTOOLS_HOOK__`, một registry mà mỗi `mountXChart()` ghi vào lúc
mount và xóa đi lúc `destroy()`. Bảng điều khiển subscribe vào đó để nhận cập nhật, đồng
thời quét DOM tìm các phần tử `<michi-vz-*>` đã mount từ trước. Nếu bạn không bao giờ bật
devtools, hook cũng không bao giờ được tạo, và biểu đồ chỉ tốn đúng một lần kiểm tra cờ mỗi
khi mount.

Bạn có thể tự dựng UI riêng (hay một extension trong tương lai) trên cùng bề mặt này:

```ts
import { getDevtoolsHook, enableDevtools } from "@michi-vz/core";

enableDevtools();
const hook = getDevtoolsHook();           // { charts: Map, subscribe, ... }
hook?.subscribe((charts) => {
  for (const c of charts) console.log(c.chartType, c.getContext());
});
```
