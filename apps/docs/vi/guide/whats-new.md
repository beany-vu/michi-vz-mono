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
