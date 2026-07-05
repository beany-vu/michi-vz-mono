---
title: DevTools - kiểm tra, điều khiển, và chỉnh sửa bất kỳ biểu đồ nào
---

# Nhìn vào bên trong biểu đồ của bạn

Một biểu đồ vẽ ra các điểm ảnh, nhưng các lỗi lại nằm trong **trạng thái đằng sau chúng**:
dữ liệu thực sự đã đến được engine, miền giá trị của trục, hộp host mà biểu đồ đã được đo
theo, và những điểm nào là *đã quan sát được* so với *dự báo*. `@michi-vz/devtools` là một
bảng điều khiển tùy chọn (opt-in), ngay trong trang, phơi bày tất cả những điều đó cho
**mọi** biểu đồ michi-vz trên trang. Không cần cài tiện ích mở rộng trình duyệt: chỉ là
một import, được đánh số phiên bản cùng ứng dụng của bạn.

<DevtoolsDemo />

> Nhấp **Mount devtools**: lá chắn Michi nổi xuất hiện ở góc dưới bên phải - đó là bộ mặt
> thu gọn của devtools. Nhấp vào nó (hoặc nhấn `Ctrl/Cmd+Shift+M`) để mở bảng điều khiển,
> chọn biểu đồ trong danh sách, và duyệt qua các tab: **Overview** (context, chuỗi dữ
> liệu, chỉnh sửa trực tiếp), **Sizing**, **Scales**, **Diff**, **Hit-test**, **Profiler**,
> **A11y**, và **Insights** - nơi ✦ **Narrate** và ✦ **Detect anomalies** chạy các plugin
> `@michi-vz/insights` thực sự trên biểu đồ đang sống (đợt tăng vọt Cost năm 2022 sẽ bị
> gắn cờ; tô nổi bật nó từ kết quả). Đây là gói thực sự, chạy ngay trong trình duyệt của
> bạn.

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

Đang dùng React? Có một dòng lệnh duy nhất mount devtools trong khi nó nằm trong cây và
không render gì cả (mặc định chỉ dành cho môi trường phát triển - các bản build production
loại bỏ hoàn toàn chunk devtools):

```tsx
import { MichiVzDevtools } from "@michi-vz/react";

<MichiVzDevtools />
```

Với Vue, Svelte, Angular, hoặc web component thuần, công thức vẫn là ba dòng như nhau: gọi
`mountDevtools()` trong hook mount của component gốc, `destroy()` khi unmount. Và với các
bản build mà devtools phải luôn bất động mà không cần thay đổi vị trí import, điểm vào
`@michi-vz/devtools/production` xuất ra một `mountDevtools` không làm gì cả (no-op).

## Nút nổi

Việc mount devtools không bao giờ che phủ ứng dụng của bạn: nó bắt đầu như một **lá chắn
Michi** nhỏ (huy hiệu của thư viện) ở một góc.
Nhấp vào đó để mở bảng điều khiển, đóng bảng để lấy lại nút, và trạng thái mở/đóng được
**ghi nhớ theo từng trình duyệt** - tải lại trang và devtools sẽ trở về đúng như bạn đã để
lại. Đang chia sẻ một góc với một widget chat hay một nút devtools khác? **Kéo lá chắn tới
bất kỳ đâu** - vị trí đó cũng được ghi nhớ. `buttonPosition` chọn góc bắt đầu.

`mountDevtools(options?)` trả về một handle:
`{ open, close, toggle, isOpen, refresh, getRoot, destroy }`.

| Option           | Mặc định            | Ghi chú                                                                    |
| ---------------- | ------------------ | ------------------------------------------------------------------------ |
| `container`      | `document.body`    | Nơi shadow host của bảng điều khiển được gắn vào.                               |
| `open`           | được ghi nhớ         | Bắt buộc `true`/`false`; mặc định khôi phục trạng thái cuối, đóng ở lần chạy đầu tiên. |
| `hotkey`         | `Ctrl/Cmd+Shift+M` | Đặt `null` để tắt phím tắt bàn phím.                                       |
| `theme`          | `"auto"`           | `"auto"` theo `prefers-color-scheme`; hoặc bắt buộc `"dark"` / `"light"`.  |
| `buttonPosition` | `"bottom-right"`   | Góc bắt đầu cho nút; một vị trí đã kéo sẽ được ưu tiên ở các lần mount sau.     |

Bảng điều khiển render bên trong **Shadow DOM** của riêng nó, nên style của nó không thể rò
rỉ vào ứng dụng của bạn (và CSS của ứng dụng không thể phá vỡ bảng điều khiển). Bản thân
các biểu đồ vẫn ở light DOM - bảng điều khiển không bao giờ động vào hợp đồng màu sắc.

Đang làm việc với một context lớn hay một bảng chuỗi dữ liệu dài? **Kéo góc trên-trái của
bảng điều khiển** để thay đổi kích thước (kích thước được ghi nhớ theo từng trình duyệt),
hoặc nhấn nút **⛶** trong tiêu đề để phóng to nó thành toàn màn hình và thu lại.

Các dashboard có nhiều biểu đồ vẫn dễ quản lý: danh sách biểu đồ có một **ô lọc**, mỗi mục
trong danh sách có một nút **◎ định vị** cuộn biểu đồ vào tầm nhìn và nhấp nháy một đường
viền quanh nó, và quá 8 biểu đồ thì bảng điều khiển gộp các đợt cập nhật dồn dập thành một
lần re-render duy nhất để một trang bận rộn không bao giờ bị chậm chỉ vì devtools đang mở.
Bảng điều khiển hoàn toàn không polling - nó chỉ phản ứng với các sự kiện của hook, và các
snapshot lịch sử bỏ qua những biểu đồ mà context chưa thay đổi.

## Các tab

### Sizing - "vì sao biểu đồ của tôi bị vô hình / tràn ra ngoài?"

Lỗi biểu đồ phổ biến nhất trong bất kỳ thư viện nào chính là lỗi kích thước: một host được
đo ở `0×0` bên trong một tab bị ẩn, hoặc một biểu đồ được đặt kích thước từ `clientWidth`
mà không trừ đi padding (đúng vậy, `clientWidth` **bao gồm** cả padding) nên nó tràn ra
khỏi thẻ chứa của mình. Tab Sizing hiển thị hình chữ nhật đã render của host, client box,
và padding cạnh bên width/height mà biểu đồ đã được yêu cầu, gắn cờ sự không khớp bằng
ngôn ngữ thuần túy, và bao gồm một công thức `ResizeObserver` để copy-paste - bởi vì biểu
đồ michi-vz có kích thước cố định theo thiết kế và tính responsive thuộc về host.

### Scales - "vì sao giá trị trục của tôi bị sai?"

Render trực tiếp miền giá trị `xAxis` / `yAxis` từ `ChartContext`, với các kiểm tra hợp lý
cho ba chế độ lỗi kinh điển: một miền giá trị `NaN` (một ngày hoặc giá trị parse thất
bại), một miền giá trị rộng bằng không (mọi giá trị giống hệt nhau, các mark sụp lại), và
một miền giá trị bị đảo ngược (một prop miền giá trị thủ công được truyền ngược). Các biểu
đồ không có trục (pie, sankey, treemap) sẽ nói rõ điều đó thay vì không hiển thị gì.

### Diff - "điều gì đã thay đổi giữa hai lần render này?"

Bảng điều khiển chụp snapshot `ChartContext` của mỗi biểu đồ ở **mỗi lần cập nhật** và giữ
một lịch sử ngắn. Tab Diff so sánh sâu (deep-diff) hai snapshot gần nhất thành một danh
sách thêm/xóa/thay đổi với các đường dẫn chính xác (`series[0].max: 140 → 555`), nên "biểu
đồ của tôi trông khác và tôi không biết vì sao" trở thành một câu trả lời hai dòng. Lùi lại
qua thanh History và diff sẽ theo dõi snapshot bạn đang xem.

### Insights - biểu đồ tự giải thích chính mình

Mỗi biểu đồ michi-vz đã mang sẵn một `summary` bằng ngôn ngữ thuần túy trong context của
nó - cùng văn bản mà một tác nhân AI hay pipeline trình đọc màn hình tiêu thụ. Tab Insights
hiển thị nó trong một bong bóng theo phong cách AI, và khi
[`@michi-vz/insights`](/vi/guide/insights) được gắn vào biểu đồ, nó sẽ bật sáng các hành
động chỉ-một-cú-nhấp được khám phá thông qua `getTools()`:

- ✦ **Narrate** - `chart.use(narrate())` - tường thuật văn xuôi có tính xác định về trạng
  thái hiện tại.
- ✦ **Detect anomalies** - `chart.use(anomaly())` - gắn cờ các điểm ngoại lệ theo từng chuỗi
  dữ liệu; kết quả cung cấp một nút **tô nổi bật** chỉ-một-cú-nhấp cho chuỗi bị gắn cờ trên
  biểu đồ đang sống.
- ✦ **Forecast** - `chart.use(forecast())` - các điểm dự phóng, độ chính xác, và bất kỳ lần
  vượt ngưỡng nào.

Bất kỳ thứ gì khác mà một plugin phơi bày sẽ hiển thị dưới mục **Advanced** như một bộ chạy
công cụ thô (nhập tham số JSON, xuất kết quả JSON).

### Hit-test - "vì sao tooltip của tôi không kích hoạt?"

Các mark canvas không có DOM, nên khi một thao tác hover ngừng hoạt động thì không có gì để
kiểm tra trong bảng Elements - bạn không thể phân biệt một lỗi hit-test với một listener đã
chết hay một vấn đề CSS `pointer-events`. Tab Hit-test phát trực tiếp các kết quả hit-test
canvas của chính biểu đồ theo thời gian thực: mỗi lần di chuyển con trỏ ghi lại tọa độ của
nó và mark mà nó tìm được (hoặc bỏ lỡ), và một chỉ dấu xanh/đỏ theo dõi sự kiện cuối cùng
ngay trên biểu đồ. Dấu hiệu chẩn đoán quyết định nhất là sự im lặng: nếu bạn đang hover mà
log không nhúc nhích, listener canvas của biểu đồ đã chết.

### Profiler - "vì sao cái này lại chậm đi?"

Mỗi `update()` được đo thời gian ở ranh giới engine. Tab Profiler hiển thị thời lượng
render gần nhất/trung bình/tối đa với một dải thanh theo từng lần cập nhật, và cảnh báo
khi thời gian render đang có xu hướng tăng lên - những nghi phạm thường gặp là dữ liệu
tăng dần, các prop không được memoize buộc phải re-render toàn phần, hoặc các listener bị
rò rỉ.

### A11y - kiểm toán mà không devtool biểu đồ nào khác làm

Các quy tắc heuristic lấy cảm hứng từ Chartability chạy trên context đang sống: một
`summary` bằng ngôn ngữ thuần túy bị thiếu (trình đọc màn hình và tác nhân AI không nhận
được gì), một bảng a11y có ít hàng hơn số chuỗi dữ liệu, hai chuỗi dùng chung một màu
(không thể phân biệt nếu không nhìn thấy), và các màu chuỗi dữ liệu dưới tỷ lệ tương phản
đồ họa 3:1 trên nền sáng hoặc tối. Bên dưới phần kiểm toán, tab này render bảng dữ liệu
a11y thực tế - chính xác những gì một trình đọc màn hình nhận được.

### Overview - kiểm tra, điều khiển, chỉnh sửa

Bộ kiểm tra kinh điển: bản tóm tắt, thống kê theo từng chuỗi dữ liệu (bao gồm cả phần
chia tách thực tế-so-với-dự-đoán bên dưới), các nút chuyển tô nổi bật/tắt vá trực tiếp
vào props đang sống, và một trình chỉnh sửa JSON cho `dataSet` - chỉnh sửa, nhấn **Apply**,
và xem biểu đồ re-render. Nghịch quá tay? **Reset chart** khôi phục dataSet, trạng thái tô
nổi bật, và trạng thái tắt về chính xác những gì chúng đã có khi devtools lần đầu nhìn
thấy biểu đồ - mọi chỉnh sửa từ bảng điều khiển được hoàn tác trong một cú nhấp.

Nhân tiện: các hành động ✦ trên tab Insights **không phải là một mô hình ngôn ngữ** theo
mặc định - chúng chạy các plugin insights của biểu đồ cục bộ (quy tắc và thống kê có tính
xác định; tooltip của mỗi hành động nói rõ chính xác nó tính toán gì). Không có gì được
tải xuống, không có gì rời khỏi trang.

## Xuyên thời gian qua trạng thái

Khi một biểu đồ đã thay đổi nhiều hơn một lần, một thanh **History** xuất hiện: bước `◀` /
`▶` qua các snapshot `ChartContext` trong quá khứ để xem chính xác trạng thái đã tiến triển
như thế nào, hoặc nhấp **● live** để quay về trạng thái mới nhất. Trong khi xem một snapshot
quá khứ, các điều khiển chỉ đọc (bạn đang kiểm tra lịch sử, không điều khiển biểu đồ). Kết
hợp với tab Diff, điều này trả lời câu hỏi "biểu đồ này trông như thế nào một lần cập nhật
trước, và điều gì đã thay đổi?" chỉ trong vài giây.

## Thực tế so với dự đoán

Bảng điều khiển làm rõ **nguồn gốc** của một biểu đồ. Đánh dấu các điểm dự báo bằng
`predicted: true` trên điểm dữ liệu (nó tương thích ngược: khi bị bỏ qua, nó suy ra từ
`certainty === false`, cùng cờ vẽ một đoạn nét đứt):

```ts
const dataSet = [{
  label: "Revenue",
  series: [
    { date: 2022, value: 104, certainty: true },                    // observed
    { date: 2023, value: 121, certainty: false, predicted: true },  // forecast
  ],
}];
```

Điều đó chảy vào `ChartContext` của mỗi biểu đồ dưới dạng `actualCount`, `predictedCount`,
và `forecastStart` (theo từng chuỗi dữ liệu trên Line, Fan, và Range), nên bảng điều khiển
- và bất kỳ tác nhân AI nào đọc context - có thể phân biệt quá khứ với dự phóng mà không
cần đoán mò qua các nét đứt.

Biểu đồ **Area** dạng chồng dùng chung một x cho mỗi ngày, nên ở đó `predicted` được đặt
trên toàn bộ **hàng** và hiện ra ở cấp độ biểu đồ dưới dạng `stats.actualRows`,
`stats.predictedRows`, và `stats.forecastStart`:

```ts
const series = [
  { date: 2022, cloud: 60, onprem: 44 },                  // observed
  { date: 2023, cloud: 78, onprem: 40, predicted: true }, // forecast row
];
```

> [!TIP] Ưu tiên dùng `predicted` thay vì `certainty` để đánh dấu một dự báo.
> `certainty` cũng trở thành `false` cho các **khoảng trống (gaps)** dữ liệu được tự động
> phát hiện (`detectGaps`), nên nó không thể phân biệt một dự báo với một lỗ hổng trong dữ
> liệu. `predicted` thì rõ ràng, không mơ hồ.

**Phạm vi bao phủ.** Nguồn gốc dữ liệu là một ý tưởng thuộc về chuỗi thời gian, nên nó
được mang bởi các biểu đồ nơi một dự báo là tự nhiên: **Line**, **Fan**, và **Range**
(theo từng chuỗi dữ liệu), và **Area** (theo từng hàng). Các biểu đồ theo danh mục,
phần-so-với-tổng, và quan hệ (stacked bar, bar-bell, comparable, dual, gap, pie/donut,
bubble, sankey, treemap, radar, scatter) không có trục dự báo, nên chúng không mang cờ
`predicted`.

## Vì sao không phải là một tiện ích mở rộng trình duyệt?

Bạn không cần một cái. Mọi biểu đồ michi-vz đều là **Light DOM** và đã phơi bày sẵn trạng
thái của nó (`getContext()`, `getTools()`), nên một bảng điều khiển ngay trong trang đọc
được mọi thứ trực tiếp. Điều đó khiến devtools trở nên:

- **Không cần cài đặt** - nó chỉ là một `import`, được đánh số phiên bản cùng ứng dụng của
  bạn.
- **Có thể kiểm thử trước khi bạn phát hành** - nó chạy trong jsdom/Playwright như bất kỳ
  module nào khác.
- **Không phụ thuộc framework** - nó phát hiện cả các instance `mountXChart()` mệnh lệnh
  *lẫn* các web component `<michi-vz-*>`.
- **An toàn cho production** - đặt nó sau `process.env.NODE_ENV !== "production"` (component
  React đã làm điều này cho bạn) hoặc import `@michi-vz/devtools/production`; dù theo cách
  nào thì người dùng của bạn cũng không bao giờ tải nó xuống.

Một tiện ích mở rộng trình duyệt thực sự chỉ đáng làm sau này, để kiểm tra michi-vz trên
các trang **không** đóng gói module devtools. Nó sẽ tái sử dụng cùng một hook, nên không
có gì ở đây bị bỏ phí.

## Cách nó hoạt động

`@michi-vz/core` cung cấp một hook nhỏ tùy chọn (opt-in). `mountDevtools()` gọi
`enableDevtools()`, cài đặt
`globalThis.__MICHI_VZ_DEVTOOLS_HOOK__` - một registry mà mỗi `mountXChart()` ghi vào khi
mount và xóa đi khi `destroy()`. Bảng điều khiển đăng ký (subscribe) vào đó để nhận cập
nhật và cũng quét DOM để tìm các phần tử `<michi-vz-*>` đã mount trước đó. Khi devtools
không bao giờ được bật, hook không bao giờ được tạo ra và các biểu đồ chỉ trả giá cho một
lần kiểm tra cờ duy nhất mỗi khi mount.

Bạn có thể xây dựng UI của riêng mình (hoặc một tiện ích mở rộng trong tương lai) dựa trên
cùng bề mặt này:

```ts
import { getDevtoolsHook, enableDevtools } from "@michi-vz/core";

enableDevtools();
const hook = getDevtoolsHook();           // { charts: Map, subscribe, ... }
hook?.subscribe((charts) => {
  for (const c of charts) console.log(c.chartType, c.getContext());
});
```
