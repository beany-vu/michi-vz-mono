# Có gì mới

Các bản phát hành `@michi-vz` mới nhất, xếp mới nhất lên đầu. Cả sáu package -
[core](https://www.npmjs.com/package/@michi-vz/core),
[wc](https://www.npmjs.com/package/@michi-vz/wc),
[react](https://www.npmjs.com/package/@michi-vz/react),
[vue](https://www.npmjs.com/package/@michi-vz/vue),
[svelte](https://www.npmjs.com/package/@michi-vz/svelte),
[angular](https://www.npmjs.com/package/@michi-vz/angular) - đều đánh version cùng nhau
(mỗi bản phát hành sẽ ghi rõ package nào lên version mới hơn). Chi tiết từng commit nằm
đầy đủ trong [GitHub releases](https://github.com/beany-vu/michi-vz-mono/releases).

## v1.11.6

Phiên bản các gói: core **1.17.0** · wc, angular **1.12.5** · react **1.11.6** · vue, svelte **1.7.6** ·
examples **1.1.6** · devtools, insights **0.2.21**.

- **`yAxisDomain` một phần trên [Biểu đồ đường](/charts/line)**: mỗi cận nay có thể là
  `null` để riêng cận đó tiếp tục được suy ra từ dữ liệu. `[0, null]` ghim đường cơ sở ở 0
  trong khi giá trị lớn nhất vẫn bám theo các chuỗi đang hiển thị - nó vẫn co giãn theo
  thao tác bật/tắt chú giải và các lát cắt Top/Bottom-N, đúng như miền suy ra hoàn toàn.
  Cận suy ra không bao giờ vượt qua cận đã ghim (dữ liệu toàn số âm với `[0, null]` cho
  `[0, 0]` thay vì một trục đảo ngược). Truyền `[min, max]` bằng số hoạt động như trước.

## v1.11.5

Phiên bản các gói: core **1.16.2** · wc, angular **1.12.4** · react **1.11.5** · vue, svelte **1.7.5** ·
examples **1.1.5** · devtools, insights **0.2.20**.

- **Các mục chú giải bị tắt giữ nguyên vị trí** trên [biểu đồ phân tán](/charts/scatter),
  [biểu đồ quả tạ](/charts/bar-bell) và [biểu đồ vùng](/charts/area). Chú giải của chúng
  trước đây được suy ra từ dữ liệu đã lọc: nhãn bị nhấp (bị tắt) biến mất khỏi
  `legendData` và cơ chế dự phòng phía consumer thêm lại nó ở cuối chú giải. Cả ba giờ
  giữ nhãn được đánh dấu `disabled: true` tại vị trí ban đầu, cùng hợp đồng với chú giải
  của biểu đồ cột chồng (core 1.5.6) và thanh so sánh (core 1.12.2). Ngữ cảnh biểu đồ phân
  tán cũng có thêm tóm tắt `series` theo nhãn (`label`/`code`/`last`) dựng từ các
  hàng trước khi lọc, nên nhãn bị ẩn vẫn giữ giá trị mới nhất cho việc xếp hạng chú giải
  phía consumer.
- **`contextSignature` vẫn có giới hạn với trường `series` mới**: nó được đưa qua cùng
  hàm băm như hàng và chú giải thay vì tuần tự hóa, nên signature của biểu đồ phân tán 50k
  điểm vẫn chỉ vài trăm byte.

## v1.11.4

Phiên bản các gói: core **1.16.1** · wc, angular **1.12.3** · react **1.11.4** · vue, svelte **1.7.4** ·
examples **1.1.4** · devtools, insights **0.2.19**.

- **Xếp hạng Top/Bottom bỏ qua series không có dữ liệu tại ngày neo.** Trên
  [biểu đồ đường](/charts/line), series không có giá trị hữu hạn tại ngày neo
  `filter.date` giờ xếp CUỐI trong **cả hai** chiều sắp xếp. Sentinel cũ chỉ xếp cuối
  dưới `desc` — dưới `asc` (Bottom-N) nó xếp *đầu*, khiến Bottom-N lấp đầy các vị trí
  bằng những series không có dữ liệu ở năm neo thay vì các giá trị thực thấp nhất.
  Hàng tồn tại tại ngày neo nhưng mang giá trị `null`/`NaN` cũng được coi là thiếu.
- **Vạch chia trục ngày không còn vượt quá các đường đã vẽ.** Các vạch chia ứng viên
  của biểu đồ đường (và tập "hiện diện" của `fillPeriodTicks`) giờ lấy từ đúng tập đã
  xếp hạng/cắt lát/lọc `disabledItems` mà miền x sử dụng. Trước đây, một series trong
  pool bị loại khỏi xếp hạng nhưng mang kỳ muộn hơn mọi series được vẽ sẽ vẽ một vạch
  chia vượt mép biểu đồ, để lại một đoạn trục trống sau đường cuối cùng.

## v1.11.3

Phiên bản các gói: core **1.16.0** · wc, angular **1.12.2** · react **1.11.3** · vue, svelte **1.7.3** ·
examples **1.1.3** · devtools, insights **0.2.18**.

- **Ẩn một series đã xếp hạng không còn bị lấp chỗ.** Trên
  [biểu đồ đường](/charts/line), [thanh ngang so sánh](/charts/comparable) và
  [thanh dọc so sánh](/charts/comparable-vertical-bar), `filter` Top/Bottom giờ xếp
  hạng và cắt lát trên TOÀN BỘ tập dữ liệu *trước khi* loại bỏ `disabledItems` — nên
  ẩn một trong N series đầu qua legend sẽ vẽ N−1 series thay vì để mục thứ (N+1) chen
  vào chỗ trống (thứ tự mà [biểu đồ gap](/charts/gap) và lát cắt nhóm của thanh chồng
  vẫn luôn dùng). Khi `filter` đang bật, `legendData` giữ series bị ẩn dưới dạng hàng
  làm mờ và `renderedRankedIds` vẫn liệt kê code của nó, nhờ vậy UI chọn lọc phía
  consumer phản chiếu tập được render vẫn ổn định qua các lần bật/tắt hiển thị. Không
  có `filter` thì hành vi không đổi.

## v1.11.2

Phiên bản gói: core **1.15.0** · wc, angular **1.12.1** · react **1.11.2** · vue, svelte **1.7.2** ·
examples **1.1.2** · devtools, insights **0.2.17**.

- **Context giờ cho biết chính xác những gì đang hiển thị.** Trường mới
  `renderedRankedIds` trên ChartContext dùng chung: mã (code) của các chuỗi thực sự
  được vẽ, theo thứ tự hiển thị (sau `disabledItems` và bước sắp xếp/cắt của `filter`
  Top/Bottom), được phát ra bởi các builder của
  [Biểu đồ đường](/vi/charts/line),
  [Biểu đồ cột chồng dọc](/vi/charts/vertical-stack-bar),
  [Biểu đồ cột so sánh](/vi/charts/comparable),
  [Biểu đồ cột dọc so sánh](/vi/charts/comparable-vertical-bar) và
  [Biểu đồ khoảng cách](/vi/charts/gap). `code` theo từng chuỗi cũng được đưa lên
  context của stack và comparable-bar, và mã dạng số không còn bị biểu đồ cột chồng
  bỏ qua. Cho phép giao diện chọn lọc bám theo một biểu đồ đã xếp hạng (mẫu "Top-N
  chips").

## v1.11.1

Phiên bản gói: core **1.14.0** · wc, angular **1.12.0** · react **1.11.1** · vue, svelte **1.7.1** ·
examples **1.1.1** · devtools, insights **0.2.16**.

- **[Biểu đồ cột chồng](/vi/charts/vertical-stack-bar) nay có dạng ngang.** Prop bổ sung
  `layout: "horizontal"`: các hàng trên trục y dạng dải (nhãn HTML dùng chung có
  ellipsis nên tên danh mục dài vẫn đọc được) với các đoạn chồng lớn dần sang phải từ
  x(0). Hợp đồng dữ liệu, khe màu, chú giải, tooltip và đánh dấu thiếu dữ liệu giống hệt
  bố cục dọc, và các prop `xAxis*` vẫn định dạng trục danh mục (`yAxis*`/`yTicks` trục
  giá trị) ở cả hai hướng. Nhãn viết tắt, `xAxisMode` và `timeline` vẫn chỉ dành cho
  bố cục dọc.

## v1.11.0

Phiên bản gói: react, wc, angular **1.11.0** · core **1.13.0** · vue, svelte **1.7.0** ·
examples **1.1.0** · devtools, insights **0.2.15**.

- **Biểu đồ mới: [Biểu đồ vòng cung](/vi/charts/gauge).** Biểu đồ vòng cung đồng tâm -
  mỗi mục một vòng, từ ngoài vào trong, mỗi vòng quét `value/max` của một vòng tròn đầy
  đủ trên rãnh nền. Di chuột kích hoạt một vòng và điều khiển phần hiển thị trung tâm
  tích hợp; giá trị `null` chỉ vẽ rãnh nền. Độ dày/khoảng cách vòng, màu và độ mờ theo
  từng vòng, góc bắt đầu, đầu bo tròn và nội dung trung tâm đều cấu hình được, với các
  trình kết xuất svg, canvas và webgpu dùng chung hợp đồng đầu dò màu chuẩn.
- **Kéo để phóng to trên [biểu đồ đường](/vi/charts/line).** Bật prop `zoom`: kéo một
  vùng ngang trong biểu đồ để phóng to miền x (khung chọn hiển thị trước), kèm nút
  "Reset zoom" tích hợp, `minRange`, callback `onZoomChange` và `resetZoom()` /
  `setZoomDomain()` để điều khiển bằng mã. Các nét vẽ được cắt theo vùng biểu đồ; trục,
  đường ngắm và tooltip theo miền đã phóng to.
- **Xuất PNG có thể kèm tiêu đề và dòng nguồn.** `chartToPngDataUrl` nhận các khối chữ
  `title` và `caption` (tự xuống dòng, căn chỉnh/cỡ/màu cấu hình được) ghép phía trên
  và dưới biểu đồ.

## v1.10.4

Phiên bản các package: react, wc, angular **1.10.4** · core **1.12.2** · vue, svelte **1.6.6** ·
devtools, insights **0.2.14**.

- **Chú giải của biểu đồ cột so sánh không còn bị xáo trộn khi tắt một mục.** Trên
  [Biểu đồ cột so sánh](/vi/charts/comparable) và
  [Biểu đồ cột dọc so sánh](/vi/charts/comparable-vertical-bar), một nhãn nằm trong
  `disabledItems` trước đây biến mất hoàn toàn khỏi `legendData` được phát ra, nên các
  chú giải dựng từ đó lại thêm mục ấy vào chỗ khác - gây xáo trộn thứ tự thấy rõ (và có
  thể đổi màu) mỗi lần bấm vào chú giải. Giờ đây nhãn bị tắt vẫn nằm trong `legendData`,
  được gắn cờ `disabled: true`, đúng vị trí ban đầu; bản thân các cột vẫn bị loại bỏ.
  Điều này khớp với hợp đồng mà biểu đồ cột chồng dọc đã có từ core 1.5.6.

## v1.10.3

Phiên bản các package: react, wc, angular **1.10.3** · core **1.12.1** · vue, svelte **1.6.5** ·
devtools, insights **0.2.13**.

- **Không còn tooltip "Chart" lạc lõng.** Trước đây mọi biểu đồ đều chèn một thẻ svg
  `<title>` với giá trị dự phòng "Chart" cho SEO, mà trình duyệt lại hiển thị `<title>`
  svg ở cấp gốc như một tooltip native khi rê chuột - nên rê vào bất kỳ đâu trên bất kỳ
  biểu đồ nào cũng bật lên nhãn "Chart" nhỏ. Giờ phần tử này chỉ được chèn khi bạn tự
  đặt prop `title`; crawler vẫn giữ metadata JSON-LD, và trình đọc màn hình không bị
  ảnh hưởng (svg vẫn `aria-hidden`, bảng a11y ẩn vẫn là đại diện của chúng).
- **Tooltip của [Biểu đồ đường](/vi/charts/line) nhận lại tên chuỗi.** Điểm dữ liệu
  truyền vào `tooltipFormatter` lại mang `label` của chuỗi (`{ ...point, label }`),
  đúng như thư viện trước monorepo. Các tooltip in tên chuỗi từ `point.label` đã hiển
  thị dòng đó trống rỗng kể từ đợt di trú.

## v1.10.2

Phiên bản các package: react, wc, angular **1.10.2** · core **1.12.0** · vue, svelte **1.6.4** ·
devtools, insights **0.2.12**.

- **Trục thời gian dày đặc giờ nghiêng nhãn thay vì bỏ bớt phần lớn.** Mọi biểu đồ dùng
  trục dải ([Biểu đồ cột chồng dọc](/vi/charts/vertical-stack-bar),
  [Biểu đồ cột dọc so sánh](/vi/charts/comparable-vertical-bar),
  [Đài phun](/vi/charts/fountain), [Biểu đồ dải](/vi/charts/ribbon),
  [Biểu đồ phân tán](/vi/charts/scatter)) trước đây bỏ hẳn việc xoay khi dải hẹp lại và
  đặt nằm ngang một tập nhãn đã lược bớt. Nhãn nghiêng chỉ cần khoảng trống theo đường
  chéo, khoảng một phần tư so với nhãn nằm ngang, nên giờ biểu đồ xoay một tập đã lược và
  giữ được nhiều hơn khoảng ba lần số nhãn. Chỉ xoay khi việc đó thực sự giúp hiện thêm
  nhãn. `xAxisMode: "horizontal"` vẫn buộc nhãn nằm ngang.
- **Đã sửa: các nhãn sau khi lược có thể bị vẽ đè lên nhau.** Cơ chế lược chỉ bảo đảm giữ
  BAO NHIÊU nhãn chứ không bảo đảm khoảng cách, nên có thể chọn hai dải liền kề. Giờ đây
  độ chồng lấn được đo chính xác - theo bề rộng riêng của từng cặp khi nằm ngang, theo
  khoảng cách vuông góc khi nghiêng - và nhãn bị va chạm sẽ được bỏ. Nhãn đầu và nhãn
  cuối luôn được giữ lại để trục vẫn thể hiện đủ khoảng dữ liệu.
- **Danh mục dạng `YYYYMM` bước theo lịch.** Trục theo tháng rơi vào các mốc thật (mỗi
  tháng 1, hoặc 1/7, hoặc 1/4/7/10) thay vì rơi vào đâu tùy phép làm tròn thập phân.
  Chính phép làm tròn đó gây ra lỗi chồng lấn ở trên: nó vô nghĩa với trường tháng theo hệ
  cơ số 12 và đặt hai vạch ở hai bên mỗi lần chuyển năm. Năm bốn chữ số giữ nguyên vì các
  mốc thập niên tròn vốn đã phù hợp.

## v1.10.1

Phiên bản các package: react, wc, angular **1.10.1** · core **1.11.1** · vue, svelte **1.6.3** ·
devtools, insights **0.2.11**.

- **Đã sửa:** ở [Biểu đồ cột chồng dọc](/vi/charts/vertical-stack-bar), nhãn ngày trên
  trục x không còn đè lên chữ viết tắt của các chuỗi dữ liệu. Khi một DataSet có
  `seriesKeyAbbreviation` - chữ cái ngắn vẽ dưới mỗi cột nhóm - nhãn trục giờ bắt đầu bên
  dưới hàng đó thay vì dùng chung. Lỗi lộ ra thành chữ chồng lên nhau mỗi khi trục quá dày
  khiến nhãn phải nghiêng -45°, rõ nhất với ngày theo tháng `MM-YYYY`. Biểu đồ cũng chừa
  thêm phần lề dưới tương ứng để nhãn nghiêng vẫn đủ chỗ. Các biểu đồ có DataSet không kèm
  chữ viết tắt giữ nguyên như trước.

## v1.10.0

Phiên bản các package: react, wc, angular **1.10.0** · core **1.11.0** · vue, svelte **1.6.2** ·
devtools, insights **0.2.10**.

- **Xem dữ liệu chạy theo năm, trên mọi biểu đồ.** Prop opt-in `timeline` mới thêm
  nút play + thanh tua năm có sẵn (kèm controller headless `chart.timeline()`)
  cho cả 21 biểu đồ. Nhóm trục thời gian như [Đường](/vi/charts/line) và
  [Vùng](/vi/charts/area) vẽ dần đến năm đang active rồi trượt mượt khi chạy;
  nhóm snapshot như [Tròn](/vi/charts/pie), [Gap](/vi/charts/gap) và
  [Phân tán](/vi/charts/scatter) hiển thị từng giai đoạn một với giá trị trượt
  giữa các năm; [Treemap](/vi/charts/treemap) và
  [Cây tỏa tròn](/vi/charts/radial-tree) tween cả cây từ các node gốc gắn `date`;
  [Sankey](/vi/charts/sankey) chạy theo các link gắn `date`; còn
  [Radar](/vi/charts/radar) và [Bar-Bell](/vi/charts/bar-bell) dùng field
  `period` mới trên từng dòng. Mặc định tắt ở mọi nơi, và mỗi trang biểu đồ đều
  có demo trực tiếp.
- **Hiệu ứng vẽ dần trên mọi biểu đồ.** Prop opt-in `progressiveDraw` quét các
  mark hiện dần từ trái sang phải khi mount - riêng [Đường](/vi/charts/line) có
  nhãn bám theo ngọn từng đường rồi dừng cạnh điểm cuối. Gọi `replay()` để chạy
  lại khi cần.
- Cả hai tính năng chạy trên renderer `svg` và `canvas`, tôn trọng
  `prefers-reduced-motion` (biểu đồ hiển thị đầy đủ ngay lập tức), và chủ ý
  không hoạt động trên renderer `webgpu` thử nghiệm.
- **Đã sửa:** re-render giữa lúc animation đang chạy giờ sẽ tiếp tục từ vị trí
  hiện tại thay vì nhảy thẳng về cuối - các wrapper framework gọi update ngay
  sau khi mount, trước đây khiến mọi autoplay lúc mount bị hủy.
- **Đã sửa:** URL CDN rút gọn của bundle web component
  (`cdn.jsdelivr.net/npm/@michi-vz/wc`) giờ trỏ đúng vào bundle trình duyệt
  độc lập, nên chỉ cần `<script type="module">` là chạy được, không phải ghi
  đủ đường dẫn `/dist/...`.

## v1.9.0

Phiên bản các package: react **1.9.0** · core **1.10.0** · wc, angular **1.9.1** · vue, svelte **1.6.1** ·
devtools, insights **0.2.9**.

- **Tải mọi biểu đồ về dưới dạng ảnh hoặc CSV.** Core có thêm bộ helper export
  mới: `chartContextToCsv(ctx)` chuyển `getContext().a11yTable` của bất kỳ biểu
  đồ nào (bảng dữ liệu đầy đủ, không bao giờ bị cắt bớt, mà biểu đồ nào cũng
  mang theo) thành CSV chuẩn RFC 4180 mà không cần viết code riêng cho từng
  biểu đồ; còn `chartToStyledSvgString` / `chartToStyledSvgDataUri` /
  `chartToPngDataUrl` dựng lại một file SVG hoặc PNG độc lập, giữ nguyên style.
  Trước đây ảnh export ra thường mất lưới, nhãn trục và đường zero, vì CSS của
  biểu đồ nằm trong `adoptedStyleSheets`, vô hình với serializer thông thường;
  helper PNG còn ghép các mark của renderer canvas lên phần trục SVG. Handle
  React có thêm `getElement()` để đưa đúng element cho các helper thay vì phải
  query DOM toàn cục dễ vỡ.
- **Một tooltip cho tất cả các chuỗi.** `sharedTooltip` của LineChart (kèm
  `sharedTooltipFormatter` tuỳ chọn) hiển thị một tooltip duy nhất liệt kê giá
  trị của mọi chuỗi tại năm gần con trỏ nhất, đi cùng crosshair, thay vì chỉ
  chuỗi gần nhất. Web component và wrapper Angular đều truyền prop này. Xem
  [Line](/vi/charts/line).
- **Bảng a11y giờ chứa chính dữ liệu.** `a11yTable` của LineChart trở thành
  bảng rộng theo từng mốc thời gian: mỗi giá trị x một cột (nhãn giống trục),
  mỗi chuỗi một hàng, chỗ trống ghi `-`. Nhờ vậy file CSV export từ
  `getContext()` có đủ mọi điểm đã vẽ. Thống kê theo chuỗi vẫn nằm ở
  `context.series`; đây là thay đổi hành vi duy nhất của bản này.
- **Trục của biểu đồ Gap ngang hàng với các biểu đồ khác.**
  [Gap](/vi/charts/gap) có thêm `showZeroLineForXAxis` (đường dọc liền nét tại
  x=0, giờ vẽ độc lập với `showGrid`) và `maxBarHeight` (biểu đồ chỉ 1-2 hàng
  không còn kéo giãn thanh ra toàn bộ chiều cao); trục giá trị số của Gap và
  [Comparable](/vi/charts/comparable) nghiêng nhãn -45° trước khi thưa bớt khi
  quá dày, như trục ngày tháng vẫn làm.
- **Sửa nhãn trên các biểu đồ dạng băng.** Nhãn hàng giới hạn ở hai dòng kèm
  dấu ba chấm thay vì đè lên hàng bên cạnh; nhãn nhóm dài sẽ xoay nghiêng thay
  vì bị thưa bớt oan; nhãn của [Bubble](/vi/charts/bubble) sát mép phải lật
  sang bên trái điểm thay vì bị cắt; và
  [Comparable Vertical Bar](/vi/charts/comparable-vertical-bar) vẽ thanh con
  ngắn hơn lên trên (hàng nào có giá trị "trước" nhỏ hơn thì trước đây thanh đó
  bị thanh cao che khuất hoàn toàn), mũi tên thay đổi cũng được căn giữa phía
  trên mỗi cặp.

## v1.8.1

Phiên bản các package: react **1.8.1** · core, wc, angular **1.9.0** · vue, svelte **1.6.0** ·
devtools, insights **0.2.8**.

- **Bốn biểu đồ mới: atlas tăng lên 21.** [Comparable Vertical Bar](/vi/charts/comparable-vertical-bar)
  (hai cột chồng nhau theo từng nhóm, cột "trước" kẻ sọc nằm sau cột "sau" đặc, kèm mũi tên
  thay đổi phía trên mỗi cặp), cùng họ biểu đồ địa lý đầu tiên của thư viện:
  [Choropleth Map](/vi/charts/choropleth-map) (dùng GeoJSON của riêng bạn, 13 phép chiếu,
  tô màu theo ngưỡng hoặc theo nhóm), [Symbol Map](/vi/charts/symbol-map) (bong bóng theo
  lng/lat với nền đất liền mờ tùy chọn) và [Radial Tree](/vi/charts/radial-tree) (dendrogram
  dạng tròn, vòng tròn có kích thước ở cả cấp nhóm lẫn cấp lá).
- **Trục log trên LineChart.** `yAxisScale: "log"` cho dữ liệu trải nhiều bậc độ lớn: giá trị
  không dương được coi là thiếu (kèm cảnh báo dữ liệu) và nhãn quá dày sẽ rút gọn về lũy thừa
  của mười. Xem [Line](/vi/charts/line).
- **Xếp chồng 100% thật sự trên AreaChart.** `stackOffset: "expand"` biến mọi biểu đồ vùng
  xếp chồng thành tỷ trọng trên tổng: xếp chồng d3 thật, không phải mẹo hiển thị.
  Xem [Area](/vi/charts/area).
- **Thanh so sánh có thêm hai công cụ.** `layout: "grouped"` tách mỗi dải thành hai nửa cạnh
  nhau thay vì chồng lên nhau, còn `deltaIndicator` vẽ mũi tên thay đổi đỏ/xanh cho từng hàng.
  Xem [Comparable](/vi/charts/comparable).
- **Vị trí symbol trung thực.** `positionMode: "precise"` của Symbol Map giữ mỗi bong bóng
  đúng tại lng/lat đã chiếu (chấp nhận chồng lấn) thay cho mô phỏng tách chồng lấn mặc định:
  lựa chọn đúng khi nền bản đồ hiện rõ khiến người xem đọc vị trí theo nghĩa đen. Nút chuyển
  trực tiếp trên [trang Symbol Map](/vi/charts/symbol-map) cho thấy khác biệt.
- **Nhãn ở những chỗ còn thiếu.** Scatter có `pointLabels` cùng lựa chọn `drawOrder` (mặc
  định nhỏ-nằm-trên, hoặc kiểu cũ lớn-nằm-trên); Treemap in được giá trị từng ô với
  `tileValueLabels`. Lớp phủ đang tải và không-có-dữ-liệu giờ phủ cả Radar, Sankey và
  Treemap, và các hình vẽ ẩn đúng cách khi lớp phủ đang hiển thị.

## v1.6.5

Version các package: react **1.6.5** · core, wc, angular **1.6.0** · vue, svelte **1.5.7** ·
devtools, insights **0.2.5**.

- **RibbonChart cuối cùng cũng biết đổi ngôi.** Cột chồng của mỗi kỳ giờ được xếp hạng lại theo
  giá trị: một nhóm vượt lên sẽ thấy rõ các dải bắt chéo nhau trên đường đi lên - đúng cái hồn
  của biểu đồ dải, khôi phục từ thư viện gốc. Xem ngay trên [trang Biểu đồ dải](/vi/charts/ribbon):
  doanh thu âm nhạc Mỹ, nơi streaming vượt tất cả và đĩa than leo ngược qua mặt CD.
- **Cột so sánh đọc được thật sự.** Cột con ngắn hơn lại được vẽ đè lên trên (cột đã tăng không
  còn che mất phần "trước"), và prop mới `colorsBasedMapping` cho cột "trước" một màu riêng:
  kết hợp tông màu sáng không trong suốt với `valueBasedOpacity: 1` để tương phản nhạt/đậm
  rõ nét trên cả hai theme. Xem [Biểu đồ cột so sánh](/vi/charts/comparable).
- **Đám mây bong bóng không còn đứng hình.** `layoutMode: "async"` chạy đúng mô phỏng lực
  deterministic đó nhưng cắt thành từng lát ~12 ms sau lớp overlay loading của biểu đồ: cụm
  3.000 bong bóng từng chặn trang ~20 giây giờ tốn nhiều nhất một frame 50 ms. `settleTicks`
  chỉnh độ lắng, dữ liệu không đổi thì bỏ qua luôn mô phỏng, và bố cục được memo giữa các lần
  render. Xem demo sự kiện va chạm trên [Biểu đồ bong bóng](/vi/charts/bubble).
- **Chỉnh nhỏ, dễ chịu lớn.** Trục giá trị của biểu đồ quả tạ chuyển được xuống dưới
  (`xAxisPosition: "bottom"`), GapChart nhận `xAxisDomain` tường minh (zoom câu chuyện tuổi thọ
  vào đúng dải 35-90), nhãn hàng của biểu đồ tornado chuyển được sang trái vùng vẽ
  (`yAxisPosition: "left"`), nhãn cực của radar không còn chạm tiêu đề, và phần tóm tắt
  context của tornado giờ nêu luôn mức chênh lệch lớn nhất.
- **Nhãn hàng cầm nắm được - và kéo lướt được.** Trên Gap, biểu đồ so sánh và tornado, tùy
  chọn `interactiveRowLabels` biến mỗi nhãn hàng thành một control thật: rê chuột hoặc focus
  vào nhãn là một đường nối chạy tới đúng hàng đó kèm tooltip và highlight; bấm để ghim.
  Dải nhãn giờ còn kéo được như một slider: rê dọc theo nó là tooltip bám theo con trỏ,
  nhảy từ hàng này sang hàng khác, tới cả những hàng đã bị thưa nhãn trên trục dày đặc.
  Thử ngay trên demo của các trang này.
- **Cái gì cũng có chú giải.** Mọi context biểu đồ giờ đều mang `legendData`, và các biểu đồ
  tách phần (treemap, bong bóng, cột so sánh) còn lộ màu nhạt đi kèm của từng nhãn qua
  `LegendItem.paleColor` - demo trong docs dùng nó cho chú giải màu và nút chuyển
  "Ý nghĩa | Cặp màu".
- **Trục band dày đặc tự thưa bớt.** Nhãn hàng của gap/so sánh/kép/quả tạ (và trục snapshot
  của đài phun) tự lấy mẫu thành một tập đọc được thay vì nhòe thành vệt khi 100+ hàng.
- **Docs: cứ bấm thử đi.** Mỗi trang biểu đồ giờ có nút chạy trực tiếp "✦ Giải thích biểu đồ
  này" (engine luật thật của insights, ngay trong trình duyệt) và "🛠 Thử DevTools với biểu đồ
  này", kèm các ví dụ kể chuyện mới: phổ dimuon của LHC trên
  [Biểu đồ phân tán](/vi/charts/scatter), lương gross vs net ở EU trên
  [Biểu đồ bong bóng](/vi/charts/bubble), và dải tuổi thọ ~195 quốc gia trên
  [Biểu đồ khoảng cách](/vi/charts/gap).
- **Đài phun nước giờ tự giải thích được mình.** [Trang Fountain](/vi/charts/fountain) mở đầu
  bằng mục giải phẫu (mỗi phần nhìn thấy của glyph có đúng một ý nghĩa được nêu rõ) và một
  field guide gồm mười một cách đọc chạy trực tiếp: độ chắc chắn, độ ổn định, rủi ro, độ tự
  tin của AI, khán giả phân cực, bão trên Philippines và hơn nữa, phần lớn dùng dáng plume
  đối xứng gọn gàng. Tính đối
  xứng giờ cũng mang nghĩa: `lean: 0` tường minh giữ cột nước thẳng đứng, `lean` có dấu cảnh
  báo rủi ro lệch một phía, còn cột nước không khai báo `lean` giữ độ nghiêng trang trí kiểu
  Geneva (báo về là `lean: null` trong `getContext()`).

## v1.6.1 - v1.6.4

Phiên bản gói: react **1.6.4** · devtools, insights **0.2.4** · core, wc, vue, svelte,
angular **1.5.6**. Bốn đợt vá nhỏ giữa hai bản phát hành lớn:

- **Trục giá trị của GapChart được gia cố ba lần.** `tickValues` do bạn truyền vào giờ được
  lọc bỏ giá trị không hữu hạn, sắp xếp và khử trùng lặp (đầu vào hỏng thì rơi về domain
  của dữ liệu); mark và trục không còn tràn ra ngoài khi truyền `tickValues` mà
  `enableExplicitTickValues` đang tắt; và domain phần trăm được đệm theo biên độ, để marker
  mốc 0 nằm đúng trên trục thay vì lòi ra ngoài mép.
- **Chú giải của VerticalStackBar giữ nguyên màu.** Key bị tắt vẫn nằm trong `legendData`
  với cờ `disabled: true`: viên chú giải chỉ mờ đi thay vì biến mất, và các slot màu được
  chia trên toàn bộ tập key - không key nào đổi màu khi tắt rồi bật lại. Các cột vẫn loại
  trừ key đã tắt.

## v1.6.0

Phiên bản gói: react **1.6.0** · devtools **0.2.0** · insights **0.2.0** · core, wc, vue,
svelte, angular **1.5.2**.

- **DevTools 0.2.0: nút bật/tắt lá chắn Michi.** Mount devtools giờ không còn che app của
  bạn nữa, nó chỉ bắt đầu như một lá chắn nổi nhỏ (huy hiệu của thư viện). Nhấp vào đó,
  hoặc nhấn `Ctrl/Cmd+Shift+M`, để mở bảng điều khiển; trạng thái mở/đóng tự nhớ theo từng
  trình duyệt, nên tải lại trang thì mọi thứ vẫn y nguyên như bạn để lại. Góc màn hình đã
  bị một widget nổi khác chiếm mất? Cứ **kéo lá chắn đi bất kỳ đâu**, vị trí đó cũng được
  nhớ, và tùy chọn `buttonPosition` mới sẽ chọn góc khởi đầu. Handle có thêm `isOpen()`, và
  `<MichiVzDevtools />` (react 1.6.0) truyền `buttonPosition` xuống. Xem
  [DevTools](/vi/guide/devtools).
- **Insights 0.2.0: nối nhiều dataset bằng `matchLabels()`.** Nối cùng một thực thể trên
  hai danh sách viết khác nhau (một file xuất từ CRM so với một file xuất từ ERP) để hai
  dataset gộp lại thành một biểu đồ. Mặc định khớp tốt nhất theo cả hai chiều (mutual best
  match), có ngưỡng biên độ tin cậy, hàng nào không khớp thì trả về kèm gợi ý "có phải bạn
  muốn nói". Cơ chế hash không cần model chạy được offline; backend MiniLM còn nối được cả
  từ đồng nghĩa, từ viết tắt, và bản dịch. Thử ngay bản demo trực tiếp
  [MatchLab](/vi/guide/insights#clean-match-and-search-your-data).
- **Core 1.5.2: vá hiệu năng cho trang nặng.** Cơ chế bảo vệ tính bất biến (idempotency)
  của `onChartDataProcessed` giờ ký context bằng một hàm hash FNV-1a có giới hạn, thay vì
  stringify từng hàng dữ liệu (một chuỗi nhiều MB mỗi lần render với 50 nghìn điểm), và
  hover trên scatter canvas/WebGPU gộp mọi đợt trỏ chuột dồn dập trong một khung hình
  thành đúng một lượt `requestAnimationFrame` cuối. Dashboard lớn vẫn phản hồi nhanh, chẳng
  cần cấu hình gì thêm.
- **Tài liệu, giờ có bốn ngôn ngữ.** Trang web có bản tiếng Anh, tiếng Pháp, tiếng Hà Lan
  và tiếng Việt, với bộ chuyển ngôn ngữ trên thanh điều hướng; mọi trang hướng dẫn, biểu đồ
  và API đều đã dịch. Rất hoan nghênh đóng góp bản dịch; xem link **Giúp dịch thuật** ở
  chân trang.
- **Trang chủ sắc nét hơn.** Trang chủ giờ mở đầu bằng câu chuyện DevTools và bốn trụ cột
  viết bằng ngôn ngữ tự nhiên: kiểm tra mọi thứ, biểu đồ máy đọc được, dễ tiếp cận sẵn theo
  mặc định, và chạy local. Chân trang mới mời bạn star repo, tham gia cộng đồng, đóng góp,
  và giúp dịch thuật. Lá chắn Michi giờ là favicon của trang web, nằm cạnh tiêu đề thanh
  điều hướng, và mỗi trang đều có mô tả riêng cùng thẻ chia sẻ mạng xã hội riêng.

## v1.5.0

- **DevTools ra mắt: `@michi-vz/devtools` 0.1.0, bản phát hành công khai đầu tiên.** Một
  bảng điều khiển ngay trong trang (không cần extension trình duyệt) soi state sống của
  mọi biểu đồ qua tám tab: Overview (sửa trực tiếp + **Reset chart**), Sizing, Scales,
  Diff, Hit-test, Profiler, Insights, và một tab audit A11y. Cách ly bằng Shadow DOM, đổi
  kích thước được, sáng + tối, mặc định chỉ chạy ở môi trường dev với entry point
  `/production` vô hại, và chỉ một dòng React: `<MichiVzDevtools />`. Xem
  [DevTools](/vi/guide/devtools).
- **Insights 0.1.0: AI minh bạch, ưu tiên local.**
  [Phương pháp luận](/vi/guide/insights#methodology---the-exact-logic-behind-every-insight)
  giờ trình bày chi tiết logic đằng sau mỗi insight; `describeModelSource()` nói rõ một
  model backend sẽ tải gì, từ đâu, **trước khi** tải bất cứ thứ gì; `modelSource` chuyển
  hướng việc tải sang mirror hoặc file tự self-host (hay cấm hẳn); và `ollamaCaller` /
  `openaiCompatCaller` nối một AI chạy local (Ollama, LM Studio, llama.cpp) chỉ với một
  dòng lệnh, không tải gì cả. Kết quả phát hiện bất thường giờ kèm cả phương pháp, ngưỡng,
  và một lời giải thích bằng ngôn ngữ thuần.
- **Core:** hook devtools có thêm kênh hit-test tần suất cao và đo thời gian render (không
  tốn chi phí gì khi devtools tắt).

## v1.4.0

- **Đường chữ thập khi di chuột (crosshair) đã trở lại - và có thể tùy chỉnh.** Đường
  chuột dọc của LineChart giờ mặc định bật lại (khôi phục sự tương đồng với phiên bản cũ;
  bản port trước đó đã âm thầm tắt nó đi), bám vào điểm dữ liệu gần nhất thay vì bám theo
  con trỏ thô, và ẩn đi khi con trỏ rời khỏi biểu đồ - giống nhau ở cả chế độ SVG, canvas,
  và WebGPU. Tạo kiểu riêng cho từng biểu đồ bằng `enableMouseLine: { stroke, strokeWidth,
  strokeDasharray, snap }`, đặt chủ đề toàn cục bằng các biến CSS `--michi-vz-crosshair` /
  `--michi-vz-crosshair-width` / `--michi-vz-crosshair-dash`, hoặc truyền `false` để tắt nó.

## v1.3.0

- **Không bỏ sót kỳ nào trên trục x.** Trục ngày của LineChart giờ luôn giữ đúng kỳ đầu
  tiên và cuối cùng thực sự (các tick thời gian thô của `d3` trước đây thường bám vào các
  mốc tròn và loại bỏ chúng), và các nhãn bị chen chúc sẽ tự động xoay -45° rồi thu gọn
  xuống còn khoảng 5 nhãn thay vì âm thầm biến mất.
- **Dòng thời gian liên tục với `fillPeriodTicks` (Line + Area, tùy chọn).** Một tick cho
  mỗi kỳ trong khoảng, chứ không chỉ những kỳ có mặt trong dữ liệu; các kỳ bị thiếu được
  render mờ đi kèm tooltip khi hover là "không có dữ liệu", có thể tùy chỉnh qua
  `noDataTickTooltip` và `noDataTickColor`.

## v1.2.1

- **Mỗi trang npm liên kết tới các gói anh em.** README của mỗi gói giờ có một bảng *Gói
  framework* liên kết tới cả sáu gói, nên từ bất kỳ wrapper nào bạn cũng có thể đến được
  các gói còn lại. Một liên kết monorepo bị hỏng đã được sửa.
- **Cả sáu gói được đồng bộ lại.** `vue`, `angular`, `svelte`, và `wc` từng chậm hơn một
  phiên bản trên npm; giờ chúng được phát hành cùng lúc với `core` và `react` ở cùng một
  phiên bản.
- **Khả năng khám phá tài liệu.** Bảng [Cài đặt](/vi/guide/installation) liên kết mỗi gói
  tới npm, và có một nút npm ở trang chủ cùng một biểu tượng npm trên thanh điều hướng
  trên cùng.

## v1.2.0

Bản phát hành **tương thích thay thế trực tiếp** (drop-in compatibility): các gói
`@michi-vz/*` theo scope có thể thay thế gói đơn lẻ cũ `michi-vz` mà không gây hồi quy cho
bất kỳ biểu đồ nào. Mọi thứ đều tương thích ngược.

- **Context không phụ thuộc renderer.** `legendData` (hợp đồng màu theo từng chuỗi dữ liệu
  dành cho canvas / các consumer ở chế độ skip) trên context của Line/Gap/Area/Scatter/
  BarBell/Radar; `renderedData` / `visibleItems`; mọi `on*Processed` giờ có tính bất biến
  (idempotent), nên chỉ kích hoạt khi context thực sự thay đổi và không bao giờ lặp vô hạn.
- **LineChart.** Trạng thái đang tải / không có dữ liệu, cấu hình trục (`yTicks`, đường
  lưới, tô nổi bật đường số 0), `fontFamily`, và `svgChildren` do consumer cung cấp.
- **Thêm props biểu đồ.** Chú giải hình dạng cho Gap; `maxBarHeight` / `symmetricXDomain`
  cho Comparable; xoay nhãn + `keys` cho VerticalStackBar; band scale, crosshair, và hình
  dạng theo từng điểm cho Scatter; hình dạng dữ liệu kiểu cũ + hit-test dễ tính hơn cho
  Radar.
- **Trục, SEO, và a11y.** Tự động xoay và thu gọn tick thích ứng trên các trục bị chen
  chúc; `<svg>` của biểu đồ giờ mang `<title>`, `<desc>`, và `<metadata>` JSON-LD chuẩn
  schema.org.
- **Đường render WebGPU thử nghiệm** song song với SVG và canvas.

## v1.1.1

- **Bản sửa Bar-Bell.** Các vòng tròn đầu mút (end-cap) giờ render đè lên trên các đoạn
  thanh (trước đây một đoạn sau có thể vẽ đè lên đầu mút của đoạn trước), và toàn bộ đoạn
  thanh đều có thể hover để hiện tooltip, không chỉ riêng vòng tròn đầu mút.
